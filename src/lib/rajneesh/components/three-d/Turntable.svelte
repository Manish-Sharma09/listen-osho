<script lang="ts">
	/*
	 * A CSS-3D turntable: the album sleeve leans at the back, the record spins on the platter
	 * while audio plays, and the tonearm tracks playback progress from the outer groove inwards.
	 * Purely presentational; controls live elsewhere and stay accessible.
	 */
	interface Props {
		/** Artwork for the sleeve and the record label */
		src?: string
		playing?: boolean
		/** 0..1 playback position, drives the tonearm angle */
		progress?: number
		/** Follow the pointer with a gentle parallax tilt */
		interactive?: boolean
		/** Called when the record itself is clicked */
		onToggle?: () => void
		toggleLabel?: string
		class?: ClassValue
	}

	const {
		src,
		playing = false,
		progress = 0,
		interactive = true,
		onToggle,
		toggleLabel = 'Play or pause',
		class: className,
	}: Props = $props()

	const main = useMainStore()

	let tiltX = $state(0)
	let tiltY = $state(0)

	// The rod has a fixed 18deg bend. At -24deg the whole arm rests clear of the record;
	// while playing it sweeps from the outer groove (-10deg) to the run-out near the label (+8deg).
	const armAngle = $derived(playing ? -10 + Math.min(Math.max(progress, 0), 1) * 18 : -24)

	const canParallax = $derived(interactive && !main.isReducedMotion)

	const onPointerMove = (event: PointerEvent) => {
		if (!canParallax || event.pointerType !== 'mouse') {
			return
		}

		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
		tiltY = ((event.clientX - rect.left) / rect.width - 0.5) * 16
		tiltX = (0.5 - (event.clientY - rect.top) / rect.height) * 12
	}

	const onPointerLeave = () => {
		tiltX = 0
		tiltY = 0
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={['turntable', main.isReducedMotion && 'turntable-still', className]}
	onpointermove={onPointerMove}
	onpointerleave={onPointerLeave}
	aria-hidden={onToggle ? undefined : 'true'}
>
	<div class="deck" style="--tilt-x: {tiltX}deg; --tilt-y: {tiltY}deg">
		<!-- Contact shadow grounding the deck -->
		<div class="contact-shadow"></div>

		<div class="plinth"></div>

		<!-- Sleeve leaning at the back -->
		<div class="sleeve">
			{#if src}
				<img {src} alt="" draggable="false" />
			{/if}
			<span class="sleeve-gloss"></span>
		</div>

		<div class="platter"></div>

		<svelte:element
			this={onToggle ? 'button' : 'div'}
			type={onToggle ? 'button' : undefined}
			class={['record', playing && 'is-playing']}
			aria-label={onToggle ? toggleLabel : undefined}
			aria-pressed={onToggle ? playing : undefined}
			onclick={onToggle}
		>
			<span class="grooves"></span>
			<span class="label">
				{#if src}
					<img {src} alt="" draggable="false" />
				{/if}
			</span>
			<span class="spindle"></span>
		</svelte:element>

		<!-- Specular highlight stays still while the record turns underneath -->
		<div class="record-sheen"></div>

		<div class="tonearm" style="--arm-angle: {armAngle}deg">
			<span class="arm-base"></span>
			<span class="arm-rod"></span>
			<span class="arm-head"></span>
		</div>
	</div>
</div>

<style>
	.turntable {
		position: relative;
		aspect-ratio: 1;
		width: 100%;
		container-type: inline-size;
		perspective: 1600px;
		user-select: none;
		-webkit-user-select: none;
	}

	.deck {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform: rotateX(calc(16deg + var(--tilt-x))) rotateY(var(--tilt-y));
		transition: transform 700ms var(--ease-calm);
	}

	.contact-shadow {
		position: absolute;
		left: 10cqw;
		right: 6cqw;
		bottom: 2cqw;
		height: 16cqw;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(0 0 0 / 0.28), transparent);
		filter: blur(6px);
		transform: translateZ(-40px);
	}

	.plinth {
		position: absolute;
		inset: 8cqw 2cqw 6cqw 4cqw;
		border-radius: 5cqw;
		background: light-dark(
			linear-gradient(160deg, #ffffff, #efefef),
			linear-gradient(160deg, #1f1f1f, #121212)
		);
		border: 1px solid var(--hairline);
		box-shadow:
			inset 0 1px 0 light-dark(#ffffff, rgb(255 255 255 / 0.06)),
			0 30px 60px -30px rgb(0 0 0 / 0.45);
		transform: translateZ(0);
	}

	.sleeve {
		position: absolute;
		top: 1cqw;
		left: 0;
		width: 54cqw;
		aspect-ratio: 1;
		border-radius: 1.4cqw;
		overflow: hidden;
		background: light-dark(#ebebeb, #262626);
		box-shadow: 0 18px 40px -16px rgb(0 0 0 / 0.5);
		transform: translateZ(6px) rotateZ(-7deg);
		transition: transform 900ms var(--ease-calm);

		& img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.turntable:hover .sleeve {
		transform: translateZ(10px) rotateZ(-10deg) translate(-1.5cqw, -1cqw);
	}

	.sleeve-gloss {
		position: absolute;
		inset: 0;
		background: linear-gradient(125deg, rgb(255 255 255 / 0.35), transparent 40%);
		mix-blend-mode: soft-light;
	}

	.platter {
		position: absolute;
		left: 14cqw;
		top: 19cqw;
		width: 72cqw;
		aspect-ratio: 1;
		border-radius: 50%;
		background: light-dark(
			conic-gradient(from 30deg, #d9d9d9, #f7f7f7, #cfcfcf, #f2f2f2, #d9d9d9),
			conic-gradient(from 30deg, #2a2a2a, #3a3a3a, #232323, #353535, #2a2a2a)
		);
		box-shadow: 0 10px 24px -10px rgb(0 0 0 / 0.5);
		transform: translateZ(12px);
	}

	.record {
		all: unset;
		position: absolute;
		left: 16cqw;
		top: 21cqw;
		width: 68cqw;
		aspect-ratio: 1;
		border-radius: 50%;
		cursor: default;
		transform: translateZ(18px);
		background:
			radial-gradient(circle, transparent 0 17%, rgb(255 255 255 / 0.05) 17.4% 18%, transparent 18.4%),
			repeating-radial-gradient(circle, #0c0c0c 0 0.35%, #1a1a1a 0.35% 0.7%);
		box-shadow:
			0 0 0 0.6cqw #0a0a0a,
			0 12px 24px -8px rgb(0 0 0 / 0.6);
		animation: var(--animate-spin-record);
		animation-play-state: paused;
	}

	button.record {
		cursor: pointer;
	}

	button.record:focus-visible {
		outline: 3px solid var(--color-tertiary);
		outline-offset: 4px;
	}

	.record.is-playing {
		animation-play-state: running;
	}

	.grooves {
		position: absolute;
		inset: 4%;
		border-radius: 50%;
		background: repeating-radial-gradient(
			circle,
			transparent 0 1.2%,
			rgb(255 255 255 / 0.035) 1.2% 1.4%
		);
	}

	.label {
		position: absolute;
		inset: 33%;
		border-radius: 50%;
		overflow: hidden;
		background: var(--color-saffron);
		box-shadow: inset 0 0 0 0.4cqw rgb(0 0 0 / 0.35);

		& img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.spindle {
		position: absolute;
		inset: 48.6%;
		border-radius: 50%;
		background: linear-gradient(135deg, #f5f5f5, #9a9a9a);
		box-shadow: 0 0 0 0.3cqw rgb(0 0 0 / 0.4);
	}

	.record-sheen {
		position: absolute;
		left: 16cqw;
		top: 21cqw;
		width: 68cqw;
		aspect-ratio: 1;
		border-radius: 50%;
		pointer-events: none;
		transform: translateZ(19px);
		background: conic-gradient(
			from 200deg,
			transparent 0deg,
			rgb(255 255 255 / 0.16) 30deg,
			transparent 70deg,
			transparent 180deg,
			rgb(255 255 255 / 0.1) 210deg,
			transparent 250deg
		);
		mix-blend-mode: screen;
	}

	.tonearm {
		position: absolute;
		/* pivot sits at the top right of the plinth */
		left: 84cqw;
		top: 16cqw;
		width: 0;
		height: 0;
		transform: translateZ(34px) rotate(var(--arm-angle));
		transform-origin: 0 0;
		transition: transform 1.2s var(--ease-calm);
	}

	.arm-base {
		position: absolute;
		left: -5.5cqw;
		top: -5.5cqw;
		width: 11cqw;
		aspect-ratio: 1;
		border-radius: 50%;
		background: light-dark(
			radial-gradient(circle at 35% 30%, #ffffff, #cfcfcf 60%, #a9a9a9),
			radial-gradient(circle at 35% 30%, #5a5a5a, #2b2b2b 60%, #1a1a1a)
		);
		box-shadow: 0 6px 12px -4px rgb(0 0 0 / 0.5);
	}

	.arm-rod {
		position: absolute;
		left: -0.7cqw;
		top: 0;
		width: 1.4cqw;
		height: 52cqw;
		border-radius: 1cqw;
		background: linear-gradient(90deg, #8e8e8e, #f2f2f2 45%, #9c9c9c);
		box-shadow: 0 8px 14px -6px rgb(0 0 0 / 0.55);
		transform-origin: top center;
		transform: rotate(18deg);
	}

	.arm-head {
		position: absolute;
		/* end of the rod, following the rod's own 18deg bend */
		left: calc(-0.7cqw - 52cqw * 0.309 - 2.4cqw);
		top: calc(52cqw * 0.951 - 1.6cqw);
		width: 6cqw;
		height: 9cqw;
		border-radius: 1cqw;
		background: linear-gradient(180deg, #2f2f2f, #111111);
		transform: rotate(18deg);
		box-shadow: 0 6px 10px -4px rgb(0 0 0 / 0.6);
	}

	.turntable-still .deck,
	.turntable-still .sleeve,
	.turntable-still .tonearm {
		transition: none;
	}

	.turntable-still .record {
		animation: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.record {
			animation: none;
		}
	}
</style>
