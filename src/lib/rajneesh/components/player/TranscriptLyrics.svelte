<script lang="ts">
	import Sanscript from '@indic-transliteration/sanscript'
	import IconButton from '$lib/components/IconButton.svelte'
	import { getItemLanguage } from '$lib/helpers/utils/text.ts'
	import EmptyState from '$lib/rajneesh/components/ui/EmptyState.svelte'
	import { playerPanel } from '$lib/rajneesh/stores/player-panel.svelte.ts'
	import { loadTrackTranscript } from '$lib/rajneesh/transcript/load-transcript.ts'

	/*
	 * Apple Music style "lyrics" for discourses. Transcripts carry no timestamps, so the highlighted
	 * paragraph follows playback proportionally to text length. It is an approximation and is
	 * labelled as such. Tapping a paragraph seeks to the matching point in the audio.
	 */
	interface Props {
		class?: ClassValue
	}

	const { class: className }: Props = $props()

	const player = usePlayer()
	const main = useMainStore()
	const track = $derived(player.activeTrack)

	const DEVANAGARI = /[ऀ-ॿ]/
	/** Pause auto-scrolling for this long after the listener scrolls on their own */
	const MANUAL_SCROLL_GRACE_MS = 4000

	let status = $state<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle')
	let paragraphs = $state<string[]>([])
	let scroller = $state<HTMLElement | null>(null)
	let lastManualScroll = 0

	// Load whenever the playing discourse changes
	$effect(() => {
		const current = track
		if (!current) {
			status = 'idle'
			paragraphs = []
			return
		}

		let cancelled = false
		status = 'loading'
		paragraphs = []

		loadTrackTranscript(current)
			.then((text) => {
				if (cancelled) return
				if (!text) {
					status = 'missing'
					return
				}

				paragraphs = text
					.split(/\n+/)
					.map((line) => line.trim())
					.filter((line) => line.length > 0)
				status = paragraphs.length > 0 ? 'ready' : 'missing'
			})
			.catch(() => {
				if (!cancelled) status = 'error'
			})

		return () => {
			cancelled = true
		}
	})

	const isHindi = $derived(paragraphs.some((line) => DEVANAGARI.test(line)))
	const showRoman = $derived(isHindi && playerPanel.romanized)
	// IAST renders the danda (।, ॥) as pipes; show them as ordinary sentence punctuation
	const toRoman = (line: string) =>
		Sanscript.t(line, 'devanagari', 'iast')
			.replace(/\s*\|\|\s*/g, '. ')
			.replace(/\s*\|\s*/g, '. ')
			.trim()

	const displayed = $derived(showRoman ? paragraphs.map(toRoman) : paragraphs)

	// Where each paragraph starts, as a fraction of the whole text
	const starts = $derived.by(() => {
		const total = paragraphs.reduce((sum, line) => sum + line.length, 0) || 1
		let running = 0
		return paragraphs.map((line) => {
			const start = running / total
			running += line.length
			return start
		})
	})

	const progress = $derived.by(() => {
		const value = player.currentTime / player.duration
		return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
	})

	const activeIndex = $derived.by(() => {
		let index = 0
		for (let i = 0; i < starts.length; i += 1) {
			if ((starts[i] ?? 0) <= progress) index = i
			else break
		}
		return index
	})

	const scrollToActive = (behavior: ScrollBehavior) => {
		const container = scroller
		const element = container?.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`)
		if (!container || !element) return

		container.scrollTo({
			top: element.offsetTop - container.clientHeight * 0.38,
			behavior,
		})
	}

	// Keep the current paragraph in view, unless the listener is reading elsewhere
	$effect(() => {
		void activeIndex
		if (status !== 'ready') return
		if (Date.now() - lastManualScroll < MANUAL_SCROLL_GRACE_MS) return

		scrollToActive(main.isReducedMotion ? 'auto' : 'smooth')
	})

	const markManualScroll = () => {
		lastManualScroll = Date.now()
	}

	const seekTo = (index: number) => {
		if (!player.duration || !Number.isFinite(player.duration)) return
		lastManualScroll = 0
		player.seek((starts[index] ?? 0) * player.duration)
	}

	const lineClass = (index: number) => {
		const distance = Math.abs(index - activeIndex)
		if (distance === 0) return 'is-active'
		if (distance === 1) return 'is-near'
		return 'is-far'
	}
</script>

<section aria-label="Transcript" class={['transcript flex min-h-0 flex-col', className]}>
	<header class="flex items-center justify-between gap-3 px-2 pb-3">
		<div class="flex flex-col">
			<span class="text-eyebrow text-onSurface">Transcript</span>
			{#if status === 'ready'}
				<span class="text-body-sm text-onSurfaceVariant">Follows playback approximately</span>
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
				<div class="skeleton h-6 rounded-md" style="width: {width}%"></div>
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
			class="scroller min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
			onwheel={markManualScroll}
			ontouchmove={markManualScroll}
			lang={showRoman ? 'hi-Latn' : track ? getItemLanguage(track.language) : undefined}
		>
			<ol class="flex flex-col gap-7 pt-[18vh] pb-[45vh]">
				{#each displayed as line, index (index)}
					<li data-line={index}>
						<button
							type="button"
							class={['line', lineClass(index)]}
							aria-current={index === activeIndex ? 'true' : undefined}
							onclick={() => seekTo(index)}
						>
							{line}
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
		font-size: clamp(1.25rem, 2.4vw, 1.75rem);
		line-height: 1.3;
		letter-spacing: -0.02em;
		font-weight: 700;
		color: var(--color-onSurface);
		white-space: pre-wrap;
		transform-origin: left center;
		transition:
			opacity 600ms var(--ease-calm),
			filter 600ms var(--ease-calm),
			transform 600ms var(--ease-calm);
		user-select: text;
		-webkit-user-select: text;
	}

	.line:focus-visible {
		outline: 2px solid var(--color-tertiary);
		outline-offset: 2px;
	}

	.line.is-active {
		opacity: 1;
		transform: scale(1.02);
	}

	.line.is-near {
		opacity: 0.4;
	}

	.line.is-far {
		opacity: 0.22;
		filter: blur(1.2px);
	}

	@media (any-hover: hover) {
		.line:not(.is-active):hover {
			opacity: 0.7;
			filter: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.line {
			transition: none;
		}

		.line.is-active {
			transform: none;
		}
	}
</style>
