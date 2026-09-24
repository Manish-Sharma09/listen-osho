<script lang="ts">
	import Icon from '$lib/components/icon/Icon.svelte'

	/*
	 * Album art as a record sleeve. The vinyl slides out of the sleeve when the host is hovered
	 * (any ancestor with the `record-host` class) or while `out` is set, and turns while `spinning`.
	 * Reserve horizontal room with the `peek` prop so the disc is never clipped.
	 */
	interface Props {
		src?: string
		alt?: string
		out?: boolean
		spinning?: boolean
		/** How far the disc slides out, as a fraction of the sleeve width */
		peek?: number
		class?: ClassValue
	}

	const { src, alt = '', out = false, spinning = false, peek = 0.34, class: className }: Props = $props()

	let failed = $state(false)
</script>

<div
	class={['record-sleeve', out && 'is-out', spinning && 'is-spinning', className]}
	style="--peek: {peek * 100}%"
>
	<div class="disc" aria-hidden="true">
		<span class="disc-label">
			{#if src && !failed}
				<img {src} alt="" draggable="false" />
			{/if}
		</span>
	</div>

	<div class="cover">
		{#if src && !failed}
			<img
				{src}
				{alt}
				draggable="false"
				onerror={() => {
					failed = true
				}}
			/>
		{:else}
			<Icon type="album" class="m-auto size-1/2 text-onSurfaceVariant/60" />
		{/if}
		<span class="cover-gloss" aria-hidden="true"></span>
	</div>
</div>

<style>
	.record-sleeve {
		position: relative;
		aspect-ratio: 1;
		isolation: isolate;
	}

	.cover {
		position: relative;
		z-index: 1;
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 10px;
		background: var(--color-surfaceContainerHigh);
		box-shadow:
			0 0 0 1px var(--hairline),
			0 14px 28px -14px rgb(0 0 0 / 0.45);

		& img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.cover-gloss {
		position: absolute;
		inset: 0;
		background: linear-gradient(120deg, rgb(255 255 255 / 0.28), transparent 38%);
		mix-blend-mode: soft-light;
		pointer-events: none;
	}

	.disc {
		position: absolute;
		inset: 3%;
		border-radius: 50%;
		background:
			conic-gradient(
				from 210deg,
				transparent 0deg,
				rgb(255 255 255 / 0.14) 25deg,
				transparent 60deg,
				transparent 180deg,
				rgb(255 255 255 / 0.08) 205deg,
				transparent 240deg
			),
			repeating-radial-gradient(circle, #0d0d0d 0 0.5%, #1b1b1b 0.5% 1%);
		box-shadow: 0 10px 22px -10px rgb(0 0 0 / 0.6);
		transition: translate 700ms var(--ease-calm);
		animation: var(--animate-spin-record);
		animation-play-state: paused;
	}

	.disc-label {
		position: absolute;
		inset: 34%;
		overflow: hidden;
		border-radius: 50%;
		background: var(--color-saffron);

		& img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.is-out .disc,
	:global(.record-host:hover) .disc,
	:global(.record-host:focus-visible) .disc {
		translate: var(--peek) 0;
	}

	.is-spinning .disc {
		animation-play-state: running;
	}

	@media (prefers-reduced-motion: reduce) {
		.disc {
			animation: none;
			transition: none;
		}
	}
</style>
