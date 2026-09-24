<script lang="ts" module>
	export interface CoverFlowItem {
		id: string
		title: string
		subtitle?: string
		image?: string
		href: string
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation'
	import IconButton from '$lib/components/IconButton.svelte'
	import { onMount } from 'svelte'

	interface Props {
		items: CoverFlowItem[]
		/** Accessible name for the carousel region */
		label: string
		autoAdvanceMs?: number
		class?: ClassValue
	}

	const { items, label, autoAdvanceMs = 5000, class: className }: Props = $props()

	const main = useMainStore()

	let active = $state(0)
	let paused = $state(false)
	let dragStartX: number | null = null
	let dragged = false

	const clampIndex = (index: number) => Math.min(Math.max(index, 0), items.length - 1)
	const go = (delta: number) => {
		if (items.length === 0) return
		active = (active + delta + items.length) % items.length
	}

	const activeItem = $derived(items[clampIndex(active)])

	// Position each cover relative to the active one: centre faces forward, the rest fan out in depth
	const coverStyle = (index: number) => {
		const offset = index - active
		const distance = Math.abs(offset)
		const side = Math.sign(offset)
		const x = offset === 0 ? 0 : side * (62 + (distance - 1) * 30)
		const z = offset === 0 ? 80 : -120 - distance * 50
		const rotate = offset === 0 ? 0 : side * -42

		return [
			`transform: translate(-50%, -50%) translateX(${x}%) translateZ(${z}px) rotateY(${rotate}deg)`,
			`z-index: ${100 - distance}`,
			`opacity: ${distance > 4 ? 0 : 1}`,
			`pointer-events: ${distance > 4 ? 'none' : 'auto'}`,
		].join(';')
	}

	const onCoverClick = (index: number, href: string) => {
		if (dragged) return
		if (index === active) {
			void goto(href)
			return
		}
		active = index
	}

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowRight') {
			event.preventDefault()
			// Keep the global player seek shortcut from also firing
			event.stopPropagation()
			go(1)
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault()
			event.stopPropagation()
			go(-1)
		}
	}

	const onPointerDown = (event: PointerEvent) => {
		dragStartX = event.clientX
		dragged = false
	}

	const onPointerUp = (event: PointerEvent) => {
		if (dragStartX === null) return
		const delta = event.clientX - dragStartX
		dragStartX = null
		if (Math.abs(delta) > 40) {
			dragged = true
			go(delta < 0 ? 1 : -1)
		}
	}

	onMount(() => {
		if (autoAdvanceMs <= 0) return

		const id = setInterval(() => {
			if (!paused && !main.isReducedMotion && document.visibilityState === 'visible') {
				go(1)
			}
		}, autoAdvanceMs)

		return () => clearInterval(id)
	})
</script>

{#if items.length > 0}
	<section
		aria-roledescription="carousel"
		aria-label={label}
		class={['coverflow relative overflow-x-clip py-2', className]}
		onmouseenter={() => (paused = true)}
		onmouseleave={() => (paused = false)}
		onfocusin={() => (paused = true)}
		onfocusout={() => (paused = false)}
	>
		<!-- Keyboard-operable stage for the carousel (arrow keys move between covers) -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			class="stage"
			tabindex="0"
			role="group"
			aria-label="{label}. Use the left and right arrow keys to browse."
			onkeydown={onKeydown}
			onpointerdown={onPointerDown}
			onpointerup={onPointerUp}
			onpointercancel={() => (dragStartX = null)}
		>
			{#each items as item, index (item.id)}
				{@const isActive = index === active}
				<button
					type="button"
					class={['cover', isActive && 'is-active']}
					style={coverStyle(index)}
					aria-label={isActive ? `Open ${item.title}` : `Show ${item.title}`}
					aria-current={isActive ? 'true' : undefined}
					tabindex={isActive ? 0 : -1}
					onclick={() => onCoverClick(index, item.href)}
				>
					{#if item.image}
						<img src={item.image} alt="" draggable="false" loading="lazy" />
					{/if}
				</button>
			{/each}
		</div>

		<div class="mt-2 flex flex-col items-center gap-3 text-center" aria-live="polite">
			{#if activeItem}
				<div class="min-h-14 max-w-xl px-4">
					<div class="line-clamp-1 text-title-lg">{activeItem.title}</div>
					{#if activeItem.subtitle}
						<div class="text-eyebrow text-onSurfaceVariant">{activeItem.subtitle}</div>
					{/if}
				</div>
			{/if}

			<div class="flex items-center gap-2">
				<IconButton
					icon="chevronRight"
					tooltip="Previous series"
					ariaLabel="Previous series"
					class="surface-card rounded-md! [&_svg]:rotate-180"
					onclick={() => go(-1)}
				/>
				<span class="min-w-16 font-mono text-label-md text-onSurfaceVariant tabular-nums">
					{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
				</span>
				<IconButton
					icon="chevronRight"
					tooltip="Next series"
					ariaLabel="Next series"
					class="surface-card rounded-md!"
					onclick={() => go(1)}
				/>
			</div>
		</div>
	</section>
{/if}

<style>
	.stage {
		position: relative;
		height: clamp(15rem, 34vw, 23rem);
		perspective: 1200px;
		transform-style: preserve-3d;
		outline: none;
		touch-action: pan-y;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
	}

	.stage:active {
		cursor: grabbing;
	}

	.stage:focus-visible {
		outline: 2px solid var(--color-tertiary);
		outline-offset: 6px;
		border-radius: 16px;
	}

	.cover {
		all: unset;
		position: absolute;
		left: 50%;
		top: 46%;
		width: clamp(9.5rem, 22vw, 15rem);
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		background: var(--color-surfaceContainerHigh);
		box-shadow:
			0 0 0 1px var(--hairline),
			0 24px 48px -20px rgb(0 0 0 / 0.5);
		transition:
			transform 800ms var(--ease-calm),
			opacity 500ms ease,
			filter 800ms var(--ease-calm);
		filter: saturate(0.7) brightness(0.92);
		/* mirror floor */
		-webkit-box-reflect: below 6px linear-gradient(transparent 62%, rgb(255 255 255 / 0.22));

		& img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			pointer-events: none;
		}
	}

	.cover.is-active {
		filter: none;
	}

	.cover:focus-visible {
		outline: 3px solid var(--color-tertiary);
		outline-offset: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		.cover {
			transition: none;
		}
	}
</style>
