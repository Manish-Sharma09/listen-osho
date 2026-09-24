<script lang="ts">
	/*
	 * Apple Music style living background for the full player: several heavily blurred copies of
	 * the artwork drift and rotate slowly, under a soft dark veil so white text stays readable.
	 */
	interface Props {
		src?: string
		class?: ClassValue
	}

	const { src, class: className }: Props = $props()

	const main = useMainStore()
</script>

<div
	aria-hidden="true"
	class={[
		'immersive-backdrop pointer-events-none fixed inset-0 -z-1 overflow-hidden bg-[#0b0b0b]',
		main.isReducedMotion && 'is-still',
		className,
	]}
>
	{#if src}
		{#key src}
			<div class="layers">
				<img {src} alt="" class="layer layer-a" />
				<img {src} alt="" class="layer layer-b" />
				<img {src} alt="" class="layer layer-c" />
			</div>
		{/key}
	{:else}
		<div class="bg-mesh absolute inset-0 opacity-70"></div>
	{/if}
	<div class="veil"></div>
</div>

<style>
	.layers {
		position: absolute;
		inset: 0;
		animation: layers-in 1.2s var(--ease-calm) both;
	}

	.layer {
		position: absolute;
		width: 90vmax;
		height: 90vmax;
		object-fit: cover;
		border-radius: 50%;
		filter: blur(90px) saturate(1.6);
		opacity: 0.85;
	}

	.layer-a {
		top: -30vmax;
		left: -25vmax;
		animation: drift-a 38s linear infinite;
	}

	.layer-b {
		right: -30vmax;
		bottom: -35vmax;
		animation: drift-b 46s linear infinite;
	}

	.layer-c {
		top: 10vmax;
		left: 25vmax;
		width: 60vmax;
		height: 60vmax;
		opacity: 0.6;
		animation: drift-c 54s linear infinite;
	}

	.veil {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(120% 90% at 50% 40%, rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.55)),
			linear-gradient(rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.35));
	}

	.is-still .layer {
		animation: none;
	}

	@keyframes layers-in {
		from {
			opacity: 0;
		}
	}

	@keyframes drift-a {
		to {
			rotate: 360deg;
		}
	}

	@keyframes drift-b {
		from {
			rotate: 360deg;
		}
		to {
			rotate: 0deg;
		}
	}

	@keyframes drift-c {
		0% {
			rotate: 0deg;
			translate: 0 0;
		}
		50% {
			rotate: 180deg;
			translate: -8vmax 6vmax;
		}
		100% {
			rotate: 360deg;
			translate: 0 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.layer {
			animation: none;
		}
	}
</style>
