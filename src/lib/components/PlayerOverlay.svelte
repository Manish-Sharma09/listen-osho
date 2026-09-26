<script lang="ts">
	import { goto } from '$app/navigation'
	import { formatArtists, getItemLanguage } from '$lib/helpers/utils/text.ts'
	import PlayerBookmarkButton from '$lib/rajneesh/components/player/PlayerBookmarkButton.svelte'
	import Button from './Button.svelte'
	import Icon from './icon/Icon.svelte'
	import PlayToggleButton from './player/buttons/PlayToggleButton.svelte'
	import SeekBackButton from './player/buttons/SeekBackButton.svelte'
	import MainControls from './player/MainControls.svelte'
	import PlayerArtwork from './player/PlayerArtwork.svelte'
	import Timeline from './player/Timeline.svelte'
	import VolumeSlider from './player/VolumeSlider.svelte'

	const { class: className }: { class?: ClassValue } = $props()

	const mainStore = useMainStore()
	const player = usePlayer()

	const track = $derived(player.activeTrack)
	const progress = $derived.by(() => {
		const value = player.currentTime / player.duration
		return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
	})

	// Clicks on these do their own thing; a click anywhere else on the card opens the full player
	const CONTROLS = 'a, button, input, select, textarea, label, [role="slider"], [role="button"]'

	let pressStartedOnControl = false

	const isControl = (target: EventTarget | null) =>
		target instanceof Element && target.closest(CONTROLS) !== null

	const openFullPlayer = (event: MouseEvent) => {
		// Dragging a slider and letting go over the card still fires a click on the card
		if (pressStartedOnControl || isControl(event.target)) {
			return
		}

		void goto('/player')
	}
</script>

<!-- The artwork link inside is the keyboard route to the full player -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	id="mini-player"
	class={[
		'pointer-events-auto relative isolate mx-auto max-w-225 cursor-pointer justify-between overflow-hidden rounded-2xl border border-(--hairline) surface-frost text-onSurface shadow-lift contain-content view-name-[pl-card] sm:h-auto active-view-player:border-transparent',
		className,
	]}
	onpointerdown={(event) => {
		pressStartedOnControl = isControl(event.target)
	}}
	onclick={openFullPlayer}
>
	<!-- Compact progress line for small screens, where the full timeline is hidden -->
	<div
		class="absolute inset-x-4 top-0 h-0.5 overflow-hidden rounded-full bg-onSurface/10 sm:hidden"
		aria-hidden="true"
	>
		<div
			class="h-full origin-left bg-tertiary transition-transform duration-500 ease-linear"
			style="transform: scaleX({progress})"
		></div>
	</div>

	<div
		class="flex h-full w-full flex-col items-center justify-between gap-4 sm:px-4 sm:pt-2 sm:pb-4"
	>
		<Timeline class="max-sm:hidden" />
		<div class="hello flex h-min w-full grow grid-cols-[1fr_max-content_1fr] items-center sm:grid">
			<div class="flex grow items-center">
				<Button
					as="a"
					href="/player"
					kind="blank"
					tooltip={m.playerOpenFullPlayer()}
					class="max-sm:rounded-r-4 group flex grow items-center rounded-lg pr-2 max-sm:p-2 sm:h-11 sm:max-w-60"
				>
					<!-- Tiny vinyl that slides out from behind the artwork and spins while playing -->
					<span
						class={[
							'mini-disc absolute left-0.5 -z-2 size-10 rounded-full transition-[translate] duration-700 ease-calm max-sm:left-2.5',
							player.playing && 'is-playing translate-x-4',
						]}
						aria-hidden="true"
					></span>
					<div
						class="relative -z-1 size-11 shrink-0 overflow-hidden rounded-lg bg-surfaceContainerHighest ring-1 ring-(--hairline) active-view-player:view-name-[pl-artwork]"
					>
						{#if track}
							<PlayerArtwork class="size-full" />
						{/if}

						<Icon
							type="chevronUp"
							class={[
								'absolute inset-0 m-auto shrink-0 active-view-player:view-name-[pl-chevron-up]',
								track &&
									'scale-0 rounded-full bg-primary text-onPrimary transition-[transform,opacity] duration-200 [.group:hover_&]:scale-100',
							]}
						/>
					</div>

					{#if track}
						<div class="mr-1 ml-7 grid min-w-0" lang={getItemLanguage(track.language)}>
							<div class="truncate text-title-sm">
								{track.name}
							</div>
							<div class="truncate text-body-sm text-onSurfaceVariant">
								{formatArtists(track.artists)}
							</div>
						</div>
					{/if}
				</Button>
			</div>

			<div class="ml-auto flex gap-2 pr-2 sm:hidden">
				<SeekBackButton class="max-xss:hidden" />
				<PlayToggleButton />
				<PlayerBookmarkButton />
			</div>

			<MainControls class="max-sm:hidden" />

			<div class="ml-auto flex items-center gap-2 pr-2 max-sm:hidden">
				{#if mainStore.volumeSliderEnabled}
					<VolumeSlider />
				{/if}
			</div>
		</div>

		{#if player.playbackError && player.activeTrack}
			<div class="px-3 pb-3 text-center text-body-sm text-error sm:px-0 sm:pb-0">
				{player.playbackError}
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference '../../app.css';

	.controls {
		grid-template-columns: 1fr max-content 1fr;
	}

	.mini-disc {
		background:
			radial-gradient(circle, var(--color-saffron) 0 22%, transparent 23%),
			repeating-radial-gradient(circle, #0d0d0d 0 2%, #1c1c1c 2% 4%);
		box-shadow: 0 4px 10px -4px rgb(0 0 0 / 0.5);
		animation: var(--animate-spin-record);
		animation-play-state: paused;
	}

	.mini-disc.is-playing {
		animation-play-state: running;
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-disc {
			animation: none;
		}
	}

	::view-transition-old(pl-chevron-up) {
		display: none;
	}

	@keyframes -global-view-pl-chevron-up-fade-in {
		from {
			opacity: 0;
			transform: scale(0);
		}
	}

	::view-transition-new(pl-chevron-up) {
		animation: view-pl-chevron-up-fade-in 125ms 225ms linear backwards;
	}
</style>
