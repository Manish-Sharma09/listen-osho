<script lang="ts" module>
	const springEasing = (): string => {
		// Damping ratio 0.78 overshoots by about 2% and settles within the duration
		const zeta = 0.78
		const omega = 6.8
		const damped = omega * Math.sqrt(1 - zeta ** 2)
		const steps = 40

		const points = Array.from({ length: steps + 1 }, (_, step) => {
			if (step === steps) {
				return 1
			}

			const t = step / steps
			const decay = Math.exp(-zeta * omega * t)
			const value =
				1 - decay * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))

			return Number(value.toFixed(4))
		})

		return `linear(${points.join(', ')})`
	}

	let glideEasing: string | undefined

	/** A gently damped spring where the browser supports linear(), like Apple Music's lyric scroll */
	const getGlideEasing = () => {
		glideEasing ??= CSS.supports('transition-timing-function', 'linear(0, 1)')
			? springEasing()
			: 'cubic-bezier(0.22, 1, 0.36, 1)'

		return glideEasing
	}
</script>

<script lang="ts">
	import Sanscript from '@indic-transliteration/sanscript'
	import { untrack } from 'svelte'
	import IconButton from '$lib/components/IconButton.svelte'
	import { getItemLanguage } from '$lib/helpers/utils/text.ts'
	import EmptyState from '$lib/rajneesh/components/ui/EmptyState.svelte'
	import { playerPanel } from '$lib/rajneesh/stores/player-panel.svelte.ts'
	import { loadTrackTranscript } from '$lib/rajneesh/transcript/load-transcript.ts'
	import { type LyricLine, toLyricLines } from '$lib/rajneesh/transcript/lyric-lines.ts'

	/*
	 * Apple Music style "lyrics" for discourses. Transcripts carry no timestamps, so each line's
	 * timing is estimated from how long it takes to say (see lyric-lines.ts), and the panel says so.
	 * The current line stays sharp while the others dim and blur with distance. When it advances,
	 * the lines glide up one after another on a spring. Tapping a line seeks to it.
	 */
	interface Props {
		class?: ClassValue
	}

	const { class: className }: Props = $props()

	const player = usePlayer()
	const main = useMainStore()
	const track = $derived(player.activeTrack)

	const DEVANAGARI = /[ऀ-ॿ]/
	/** Where the current line rests, as a fraction of the panel height from the top */
	const ANCHOR = 0.3
	const GLIDE_MS = 900
	/** Delay between neighbouring lines as they glide, which gives the rippling wave */
	const GLIDE_STAGGER_MS = 40
	const GLIDE_MAX_STAGGER_STEPS = 8
	/** Lines further than this from the current one all look the same */
	const MAX_DISTANCE = 4
	/** Resume following playback this long after the listener stops scrolling on their own */
	const RESUME_FOLLOW_MS = 4000
	/** Seek slightly past a line's estimated start so that line is the one highlighted */
	const SEEK_LEAD_S = 0.25

	let status = $state<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle')
	let lines = $state.raw<LyricLine[]>([])
	let scroller = $state<HTMLElement | null>(null)
	let list = $state<HTMLElement | null>(null)
	/** The listener is scrolling through the transcript, so it stops following playback */
	let browsing = $state(false)
	let resumeTimer: ReturnType<typeof setTimeout> | undefined
	/** Lines with a glide animation, possibly still running */
	const gliding = new Set<HTMLElement>()

	// Load whenever the playing discourse changes
	$effect(() => {
		const current = track
		if (!current) {
			status = 'idle'
			lines = []
			return
		}

		let cancelled = false
		status = 'loading'
		lines = []

		loadTrackTranscript(current)
			.then((text) => {
				if (cancelled) return

				lines = text ? toLyricLines(text) : []
				status = lines.length > 0 ? 'ready' : 'missing'
			})
			.catch(() => {
				if (!cancelled) status = 'error'
			})

		return () => {
			cancelled = true
		}
	})

	const isHindi = $derived(lines.some((line) => DEVANAGARI.test(line.text)))
	const showRoman = $derived(isHindi && playerPanel.romanized)
	// IAST renders the danda (।, ॥) as pipes; show them as ordinary sentence punctuation
	const toRoman = (text: string) =>
		Sanscript.t(text, 'devanagari', 'iast')
			.replace(/\s*\|\|\s*/g, '. ')
			.replace(/\s*\|\s*/g, '. ')
			.trim()

	const displayed = $derived(lines.map((line) => (showRoman ? toRoman(line.text) : line.text)))

	const progress = $derived.by(() => {
		const value = player.currentTime / player.duration
		return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
	})

	// The last line that has started by now
	const activeIndex = $derived.by(() => {
		let low = 0
		let high = lines.length - 1
		let found = 0

		while (low <= high) {
			const middle = (low + high) >> 1
			if ((lines[middle]?.start ?? 0) <= progress) {
				found = middle
				low = middle + 1
			} else {
				high = middle - 1
			}
		}

		return found
	})

	/** Scrolls the current line to the anchor, gliding the lines on screen into place */
	const follow = (glide: boolean) => {
		const container = scroller
		const items = list?.children
		const current = items?.[activeIndex] as HTMLElement | undefined
		if (!container || !items || !current) return

		const maxTop = container.scrollHeight - container.clientHeight
		const top = Math.min(Math.max(current.offsetTop - container.clientHeight * ANCHOR, 0), maxTop)
		const delta = top - container.scrollTop
		if (Math.abs(delta) < 1) return

		// Where lines are mid-glide right now, so a new glide carries on without a jump
		const inFlight = new Map<HTMLElement, number>()
		for (const item of gliding) {
			const { transform } = getComputedStyle(item)
			inFlight.set(item, transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42)
		}
		for (const item of gliding) {
			for (const animation of item.getAnimations()) animation.cancel()
		}
		gliding.clear()

		// Jump the scroll position, then start every line on screen from where it appeared to be
		container.scrollTop = top
		if (!glide || main.isReducedMotion) return

		// A long jump (a seek) glides in from just past the edge rather than from far away
		const reach = container.clientHeight * 0.6
		const shift = Math.min(Math.max(delta, -reach), reach)
		const easing = getGlideEasing()
		const lower = top - reach
		const upper = top + container.clientHeight + reach

		const glideLine = (index: number) => {
			const item = items[index] as HTMLElement
			// Lines ahead in the direction of travel lead, the rest follow a beat behind
			const steps = delta > 0 ? index - (activeIndex - 1) : activeIndex + 1 - index
			const animation = item.animate(
				[
					{ transform: `translateY(${shift + (inFlight.get(item) ?? 0)}px)` },
					{ transform: 'none' },
				],
				{
					duration: GLIDE_MS,
					delay: Math.min(Math.max(steps, 0), GLIDE_MAX_STAGGER_STEPS) * GLIDE_STAGGER_MS,
					easing,
					fill: 'backwards',
				},
			)
			animation.onfinish = () => gliding.delete(item)
			gliding.add(item)
		}

		// Walk out from the current line over every line on screen before or after the jump
		for (let index = activeIndex; index >= 0; index -= 1) {
			const item = items[index] as HTMLElement
			if (item.offsetTop + item.offsetHeight < lower) break
			glideLine(index)
		}
		for (let index = activeIndex + 1; index < items.length; index += 1) {
			if ((items[index] as HTMLElement).offsetTop > upper) break
			glideLine(index)
		}
	}

	// Snap into place when the lines change (a new discourse, or switching script) or the panel resizes
	$effect(() => {
		const container = scroller
		void displayed
		if (!container) return

		untrack(() => follow(false))

		const observer = new ResizeObserver(() => {
			if (!browsing) follow(false)
		})
		observer.observe(container)

		return () => observer.disconnect()
	})

	// Glide to the current line as playback moves on, and again when the listener stops browsing
	$effect(() => {
		void activeIndex
		if (status !== 'ready' || browsing) return

		untrack(() => follow(true))
	})

	const browse = () => {
		browsing = true
		clearTimeout(resumeTimer)
		resumeTimer = setTimeout(() => {
			browsing = false
		}, RESUME_FOLLOW_MS)
	}

	const stopBrowsing = () => {
		clearTimeout(resumeTimer)
		browsing = false
	}

	$effect(() => () => clearTimeout(resumeTimer))

	const seekTo = (index: number) => {
		const line = lines[index]
		if (!line || !player.duration || !Number.isFinite(player.duration)) return

		stopBrowsing()
		player.seek(Math.min(line.start * player.duration + SEEK_LEAD_S, player.duration))
	}
</script>

<section aria-label="Transcript" class={['transcript flex min-h-0 flex-col', className]}>
	<header class="flex items-center justify-between gap-3 px-2 pb-3">
		<div class="flex flex-col">
			<span class="text-eyebrow text-onSurface">Transcript</span>
			{#if status === 'ready'}
				<span class="text-body-sm text-onSurfaceVariant">
					Timing is approximate · tap a line to jump
				</span>
			{/if}
		</div>

		{#if status === 'ready' && isHindi}
			<IconButton
				icon="translate"
				tooltip={showRoman ? 'Show in Devanagari' : 'Show in Roman letters'}
				ariaLabel={showRoman ? 'Show in Devanagari' : 'Show in Roman letters'}
				class={[
					'size-10 rounded-md! border border-(--hairline)',
					showRoman && 'bg-onSurface text-surface',
				]}
				onclick={() => {
					playerPanel.romanized = !playerPanel.romanized
				}}
			/>
		{/if}
	</header>

	{#if status === 'loading'}
		<div class="flex flex-col gap-5 px-2 pt-6" role="status" aria-label="Loading transcript">
			{#each [92, 76, 84, 60, 88] as width, index (index)}
				<div class="h-6 skeleton rounded-md" style="width: {width}%"></div>
			{/each}
		</div>
	{:else if status === 'missing' || status === 'error' || status === 'idle'}
		<EmptyState
			icon="lyrics"
			title={status === 'idle'
				? 'Nothing is playing'
				: status === 'error'
					? 'Could not load the transcript'
					: 'No transcript for this discourse yet'}
			description={status === 'missing'
				? 'Transcripts are available for most series. You can keep listening, or open the queue.'
				: undefined}
			tone={status === 'error' ? 'error' : 'neutral'}
		/>
	{:else}
		<div
			bind:this={scroller}
			class="scroller relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
			onwheel={browse}
			ontouchmove={browse}
			onfocusin={(event) => {
				// Tabbing through the lines scrolls them, so treat it like browsing
				if (event.target instanceof Element && event.target.matches(':focus-visible')) browse()
			}}
			lang={showRoman ? 'hi-Latn' : track ? getItemLanguage(track.language) : undefined}
		>
			<ol
				bind:this={list}
				class={['flex flex-col gap-5 pt-[18vh] pb-[60vh]', browsing && 'is-browsing']}
			>
				{#each displayed as text, index (index)}
					<li class={[index > 0 && lines[index]?.paragraphStart && 'mt-5']}>
						<button
							type="button"
							class="line"
							data-distance={Math.min(Math.abs(index - activeIndex), MAX_DISTANCE)}
							aria-current={index === activeIndex ? 'true' : undefined}
							onclick={() => seekTo(index)}
						>
							{text}
						</button>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</section>

<style>
	.scroller {
		mask-image: linear-gradient(to bottom, transparent, black 12%, black 78%, transparent);
		scrollbar-width: none;
	}

	.line {
		all: unset;
		display: block;
		cursor: pointer;
		border-radius: 12px;
		padding: 4px 8px;
		margin-inline: -8px;
		font-size: clamp(1.375rem, 2.4vw, 1.875rem);
		line-height: 1.25;
		letter-spacing: -0.02em;
		font-weight: 700;
		color: var(--color-onSurface);
		white-space: pre-wrap;
		transform-origin: left center;
		/* Far from the current line: faint, soft and a touch smaller */
		opacity: 0.2;
		filter: blur(2.4px);
		transform: scale(0.96);
		transition:
			opacity 700ms var(--ease-calm),
			filter 700ms var(--ease-calm),
			transform 700ms var(--ease-calm),
			background-color 200ms ease;
		user-select: text;
		-webkit-user-select: text;
	}

	.line:focus-visible {
		outline: 2px solid var(--color-tertiary);
		outline-offset: 2px;
	}

	.line[data-distance='0'] {
		opacity: 1;
		filter: none;
		transform: none;
	}

	.line[data-distance='1'] {
		opacity: 0.45;
		filter: blur(0.6px);
	}

	.line[data-distance='2'] {
		opacity: 0.32;
		filter: blur(1.2px);
	}

	.line[data-distance='3'] {
		opacity: 0.25;
		filter: blur(1.8px);
	}

	/* While the listener scrolls on their own, every line is readable */
	.is-browsing .line:not([data-distance='0']) {
		opacity: 0.55;
		filter: none;
		transform: none;
	}

	@media (any-hover: hover) {
		.line:not([data-distance='0']):hover {
			opacity: 0.85;
			filter: none;
			background-color: rgb(255 255 255 / 0.06);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.line {
			transition: none;
			transform: none;
		}
	}
</style>
