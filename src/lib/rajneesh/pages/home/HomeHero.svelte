<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import portrait from '$lib/rajneesh/assets/portrait.png?w=760&format=webp&as=metadata'
	import { getCatalog } from '$lib/rajneesh/stores/catalog.svelte.ts'

	interface Props {
		/** Label of the primary action, e.g. "Continue listening" when there is history */
		primaryLabel: string
		onPrimary: () => void
		onExplore: () => void
	}

	const { primaryLabel, onPrimary, onExplore }: Props = $props()

	const main = useMainStore()

	const numberFormat = new Intl.NumberFormat('en')
	const catalog = $derived(getCatalog())
	const stats = $derived([
		{ value: catalog ? numberFormat.format(catalog.tracks.length) : '—', label: 'Discourses' },
		{ value: catalog ? numberFormat.format(catalog.albums.length) : '—', label: 'Series' },
		{ value: '2', label: 'Languages' },
	])

	// Portrait parallax: the figure drifts slightly against the wordmark as the pointer moves
	let shiftX = $state(0)
	let shiftY = $state(0)
	const onPointerMove = (event: PointerEvent) => {
		if (main.isReducedMotion || event.pointerType !== 'mouse') return
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
		shiftX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
		shiftY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
	}
</script>

<!-- DESIGN.md hero-band: canvas, the single mesh gradient, tightly tracked display type -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	aria-labelledby="home-hero-title"
	class="hero relative isolate mt-4 mb-4 flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-(--hairline) bg-surfaceContainerLowest lg:min-h-[640px]"
	onpointermove={onPointerMove}
	onpointerleave={() => {
		shiftX = 0
		shiftY = 0
	}}
	style="--shift-x: {shiftX}; --shift-y: {shiftY}"
>
	<div class="bg-mesh absolute inset-0 -z-10" aria-hidden="true"></div>
	<!-- Fine dotted grid, a nod to the spec-sheet feel of the Geist system -->
	<div class="hero-grid absolute inset-0 -z-10" aria-hidden="true"></div>

	<!-- Layer 1: solid wordmark, behind the portrait -->
	<div class="hero-word hero-word-solid text-display-hero" aria-hidden="true">LISTEN</div>

	<!-- Layer 2: portrait -->
	<div class="hero-figure pointer-events-none absolute z-1" aria-hidden="true">
		<img
			src={portrait.src}
			alt=""
			draggable="false"
			class="hero-portrait size-full object-contain object-bottom"
		/>
	</div>

	<!-- Layer 3: translucent copy of the wordmark passing in front of the portrait -->
	<div class="hero-word hero-word-veil text-display-hero z-2" aria-hidden="true">LISTEN</div>

	<!-- Layer 4: content -->
	<div class="relative z-3 flex max-w-xl flex-col gap-6 px-4 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
		<span class="w-fit animate-rise text-eyebrow text-onSurfaceVariant">
			Listen Osho — Audio discourses
		</span>

		<h1
			id="home-hero-title"
			class="animate-rise text-headline-lg [animation-delay:80ms] sm:text-display-xl sm:text-[56px] sm:leading-[56px] sm:tracking-[-2.8px]"
		>
			Words that point<br />to silence.
		</h1>

		<p class="max-w-md animate-rise text-body-lg text-onSurfaceVariant [animation-delay:140ms]">
			Thousands of talks in Hindi and English. Stream a discourse, or save it and listen offline.
		</p>

		<div class="flex animate-rise flex-wrap items-center gap-3 [animation-delay:200ms]">
			<Button class="h-11 px-5" onclick={onPrimary}>
				<Icon type="play" class="size-5" />
				{primaryLabel}
			</Button>
			<Button kind="outlined" class="h-11 px-5" onclick={onExplore}>
				Explore library
				<Icon type="chevronRight" class="size-5" />
			</Button>
		</div>
	</div>

	<dl
		class="absolute top-8 right-8 z-3 flex animate-rise gap-6 [animation-delay:320ms] max-lg:hidden"
	>
		{#each stats as stat (stat.label)}
			<div class="flex flex-col border-l border-(--hairline-strong) pl-4">
				<dt class="order-2 text-eyebrow text-onSurfaceVariant">{stat.label}</dt>
				<dd class="order-1 text-headline-sm tabular-nums">{stat.value}</dd>
			</div>
		{/each}
	</dl>
</section>

<style>
	.hero {
		--hero-ink: light-dark(var(--color-ink), #ededed);
	}

	.hero-grid {
		background-image: radial-gradient(
			circle at 1px 1px,
			light-dark(rgb(0 0 0 / 0.07), rgb(255 255 255 / 0.06)) 1px,
			transparent 0
		);
		background-size: 24px 24px;
		mask-image: linear-gradient(to bottom, black, transparent 85%);
	}

	.hero-word {
		position: absolute;
		inset-inline: 0;
		bottom: 3%;
		padding-inline: 3%;
		text-align: left;
		white-space: nowrap;
		pointer-events: none;
		user-select: none;
		font-size: clamp(4.5rem, 17.5vw, 14.5rem);
		transform: translate3d(calc(var(--shift-x) * -6px), calc(var(--shift-y) * -3px), 0);
		transition: transform 600ms var(--ease-calm);
	}

	.hero-word-solid {
		color: var(--hero-ink);
	}

	.hero-word-veil {
		color: light-dark(rgb(23 23 23 / 0.16), rgb(237 237 237 / 0.18));
	}

	.hero-figure {
		right: -14%;
		bottom: 0;
		height: 48%;
		width: 72%;
		transform: translate3d(calc(var(--shift-x) * 14px), calc(var(--shift-y) * 8px), 0);
		transition: transform 600ms var(--ease-calm);

		@media (width >= 40rem) {
			right: 2%;
			height: 86%;
			width: 48%;
		}

		@media (width >= 64rem) {
			right: 9%;
		}
	}

	.hero-portrait {
		filter: drop-shadow(0 30px 40px rgb(0 0 0 / 0.25));
		animation: portrait-in 1.2s var(--ease-calm) both;
	}

	@keyframes portrait-in {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.98);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-portrait {
			animation: none;
		}
	}
</style>
