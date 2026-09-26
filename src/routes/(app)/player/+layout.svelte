<script lang="ts">
	import { page } from '$app/state'
	import BackButton from '$lib/components/BackButton.svelte'
	import Button from '$lib/components/Button.svelte'
	import Header from '$lib/components/Header.svelte'
	import IconButton from '$lib/components/IconButton.svelte'
	import ListDetailsLayout from '$lib/components/ListDetailsLayout.svelte'
	import PlayerFavoriteButton from '$lib/components/player/buttons/PlayerFavoriteButton.svelte'
	import SeekBackButton from '$lib/components/player/buttons/SeekBackButton.svelte'
	import PlayTogglePillButton from '$lib/components/player/buttons/PlayTogglePillButton.svelte'
	import RepeatButton from '$lib/components/player/buttons/RepeatButton.svelte'
	import ShuffleButton from '$lib/components/player/buttons/ShuffleButton.svelte'
	import BgMusicButton from '$lib/rajneesh/components/player/BgMusicButton.svelte'
	import PlayerBookmarkButton from '$lib/rajneesh/components/player/PlayerBookmarkButton.svelte'
	import Timeline from '$lib/components/player/Timeline.svelte'
	import Slider from '$lib/components/Slider.svelte'
	import TracksListContainer from '$lib/components/tracks/TracksListContainer.svelte'
	import { formatArtists, getItemLanguage } from '$lib/helpers/utils/text.ts'
	import { isRajneeshEnabled } from '$lib/rajneesh/index.ts'
	import SpeedControlButton from '$lib/rajneesh/components/player/SpeedControlButton.svelte'
	import Turntable from '$lib/rajneesh/components/three-d/Turntable.svelte'
	import EmptyState from '$lib/rajneesh/components/ui/EmptyState.svelte'
	import Icon, { type IconType } from '$lib/components/icon/Icon.svelte'
	import ImmersiveBackdrop from '$lib/rajneesh/components/player/ImmersiveBackdrop.svelte'
	import LyricsToggleButton from '$lib/rajneesh/components/player/LyricsToggleButton.svelte'
	import TranscriptLyrics from '$lib/rajneesh/components/player/TranscriptLyrics.svelte'
	import { playerPanel } from '$lib/rajneesh/stores/player-panel.svelte.ts'

	const { data } = $props()

	const mainStore = useMainStore()
	const player = usePlayer()
	const track = $derived(player.activeTrack)
	const progress = $derived.by(() => {
		const value = player.currentTime / player.duration
		return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
	})

	const sizes = $derived(data.sizes())
	const isCompactVertical = $derived(sizes.isCompactVertical)
	const layoutMode = $derived(data.layoutMode(sizes.isCompact, page.url.pathname))

	const panelTabs: { id: 'transcript' | 'queue'; label: string; icon: IconType }[] = [
		{ id: 'transcript', label: 'Transcript', icon: 'lyrics' },
		{ id: 'queue', label: m.queue(), icon: 'trayFull' },
	]
</script>

{#snippet playerSnippet()}
	{@const showTranscriptInline = layoutMode === 'list' && playerPanel.transcriptOpen}
	<div
		class={[
			layoutMode === 'both' && 'w-100',
			layoutMode === 'list' && 'mx-auto w-full max-w-120',
			'player-content relative z-0 grow items-center gap-x-8 overflow-clip px-4 pb-4',
			isCompactVertical && !sizes.isCompactHorizontal && 'player-content-horizontal',
		]}
	>
		<div
			class={[
				isCompactVertical && !sizes.isCompactHorizontal ? 'absolute top-0 left-0 h-14' : 'h-16',
				'flex w-full items-center justify-between gap-2 [grid-area:header]',
			]}
		>
			<BackButton class="size-10 rounded-full! bg-white/10 backdrop-blur-md" />

			<div class="flex min-w-0 flex-col items-center px-2 text-center">
				<span class="text-eyebrow text-onSurfaceVariant">Now playing</span>
				<span class="sr-only">{m.player()}</span>
				{#if track}
					<span class="max-w-56 truncate text-body-sm text-onSurface/80">{track.album}</span>
				{/if}
			</div>

			<LyricsToggleButton class="size-10 bg-white/10 backdrop-blur-md" />
		</div>

		{#if showTranscriptInline}
			<!-- On small screens the transcript takes the turntable's place, like lyrics on a phone -->
			<TranscriptLyrics class="h-[min(56svh,32rem)] w-full [grid-area:artwork]" />
		{:else}
			<div class="m-auto my-auto aspect-square h-full max-h-80 [grid-area:artwork]">
				<Turntable
					src={player.artworkSrc}
					playing={player.playing}
					{progress}
					onToggle={track ? () => player.togglePlay() : undefined}
					toggleLabel={player.playing ? m.playerPause() : m.playerPlay()}
				/>
			</div>
		{/if}

		<div class="mt-4 flex w-full flex-col gap-5 [grid-area:controls]">
			<div class="flex min-h-14 w-full items-center gap-3">
				{#if track}
					<div class="grid min-w-0 flex-1" lang={getItemLanguage(track.language)}>
						<div class="truncate text-title-lg font-bold">{track.name}</div>
						<div class="truncate text-body-md text-onSurfaceVariant">
							{formatArtists(track.artists)} — Discourse {player.activeTrackIndex + 1}
						</div>
					</div>
				{/if}

				<div class="ml-auto flex shrink-0 gap-1">
					<PlayerFavoriteButton />

					{#if layoutMode === 'list'}
						<IconButton tooltip={m.playerOpenQueue()} icon="trayFull" as="a" href="/player/queue" />
					{/if}
				</div>
			</div>

			<Timeline class="w-full" />

			<div class="flex items-center justify-between gap-2">
				{#if isRajneeshEnabled()}
					<SpeedControlButton />
				{:else}
					<ShuffleButton />
				{/if}

				<SeekBackButton />

				<PlayTogglePillButton class="h-16! w-16! rounded-full!" />

				<PlayerBookmarkButton />

				{#if isRajneeshEnabled()}
					<BgMusicButton />
				{:else}
					<RepeatButton />
				{/if}
			</div>

			{#if mainStore.volumeSliderEnabled}
				<div class="flex items-center gap-2">
					<IconButton
						icon="volumeMid"
						tooltip={m.playerDecreaseVolume()}
						onclick={() => (player.volume -= 10)}
					/>

					<Slider bind:value={player.volume} />

					<IconButton
						icon="volumeHigh"
						tooltip={m.playerIncreaseVolume()}
						onclick={() => (player.volume += 10)}
					/>
				</div>
			{/if}

			{#if player.playbackError && track}
				<div
					role="alert"
					class="rounded-xl bg-errorContainer/70 px-4 py-2 text-center text-body-md text-onErrorContainer"
				>
					{player.playbackError}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet queueActions()}
	<RepeatButton />
	<IconButton
		tooltip={m.playerClearQueue()}
		disabled={player.isQueueEmpty}
		icon="trayRemove"
		onclick={player.clearQueue}
	/>
{/snippet}

{#snippet queueList()}
	<div class="flex grow p-4">
		{#if player.isQueueEmpty}
			<EmptyState icon="playlistMusic" title={m.playerQueueEmpty()}>
				<Button kind="outlined" as="a" href="/library/tracks">
					{m.playerQueuePlaySomething()}
				</Button>
			</EmptyState>
		{:else}
			<TracksListContainer
				items={player.itemsIds}
				predefinedMenuItems={{
					addToQueue: false,
				}}
				onItemClick={({ index }) => {
					player.playTrack(index)
				}}
			/>
		{/if}
	</div>
{/snippet}

{#snippet queueSnippet()}
	{#if layoutMode === 'details'}
		<Header title={m.queue()}>
			{@render queueActions()}
		</Header>

		<div class="flex w-full grow flex-col">
			{@render queueList()}
		</div>
	{:else}
		<!-- Wide layout: the right pane switches between the synced transcript and the queue -->
		<div class="flex w-full grow flex-col">
			<div class="flex h-16 items-center gap-3 border-b border-(--hairline) px-4">
				<div
					role="tablist"
					aria-label="Player panel"
					class="flex rounded-full bg-white/8 p-1 backdrop-blur-md"
				>
					{#each panelTabs as tab (tab.id)}
						{@const selected = (tab.id === 'transcript') === playerPanel.transcriptOpen}
						<button
							type="button"
							role="tab"
							aria-selected={selected}
							class={[
								'flex h-8 items-center gap-2 rounded-full px-4 text-label-lg transition-colors duration-200',
								selected ? 'bg-onSurface text-surface' : 'text-onSurfaceVariant hover:text-onSurface',
							]}
							onclick={() => {
								playerPanel.transcriptOpen = tab.id === 'transcript'
							}}
						>
							<Icon type={tab.icon} class="size-4" />
							{tab.label}
						</button>
					{/each}
				</div>

				<div class="ml-auto flex items-center gap-1">
					{#if !playerPanel.transcriptOpen}
						{@render queueActions()}
					{/if}
				</div>
			</div>

			{#if playerPanel.transcriptOpen}
				<TranscriptLyrics class="h-[calc(100svh-6rem)] px-6 pt-4" />
			{:else}
				{@render queueList()}
			{/if}
		</div>
	{/if}
{/snippet}

<ImmersiveBackdrop src={player.artworkSrc} />

<ListDetailsLayout
	id="full-player"
	mode={layoutMode}
	class="player-immersive theme-scope mx-auto w-full max-w-300 grow active-view-player:view-name-[pl-card]"
	list={playerSnippet}
	details={queueSnippet}
	noListStableGutter
	noPlayerOverlayPadding
/>

<style lang="postcss">
	@reference '../../../app.css';

	/* The player is always an immersive dark stage over the artwork, like Apple Music.
	   Tokens use light-dark(); .theme-scope re-declares them here so the dark scheme reaches them. */
	:global(.player-immersive) {
		color-scheme: dark;
		color: var(--color-onSurface);
	}

	.player-content {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: max-content minmax(--spacing(35), 1fr) auto;
		grid-template-areas: 'header' 'artwork' 'controls';
	}

	.player-content-horizontal {
		grid-template-columns:
			1fr minmax(0, --spacing(75)) minmax(0, --spacing(125))
			1fr;
		grid-template-rows: max-content 1fr;
		grid-template-areas:
			'header header header header'
			'. artwork controls .';
	}

	@keyframes -global-view-player-container-rounded {
		from {
			border-radius: var(--vt-pl-card-from-radius);
		}
		to {
			border-radius: var(--vt-pl-card-to-radius);
		}
	}

	@keyframes -global-view-player-card-morph-enter {
		from {
			width: var(--mp-width);
			height: var(--mp-height);
			translate: var(--mp-left) calc(var(--mp-bottom) - var(--mp-height));
		}
		to {
			width: var(--fp-width);
			height: 100svh;
			translate: var(--fp-left) 0;
		}
	}

	@keyframes -global-view-player-card-morph-exit {
		from {
			width: var(--fp-width);
			height: 100svh;
			translate: var(--fp-left) 0;
		}
		to {
			width: var(--mp-width);
			height: var(--mp-height);
			translate: var(--mp-left) calc(var(--mp-bottom) - var(--mp-height));
		}
	}

	:global(html:active-view-transition-type(player)) {
		--vt-pl-card-radius: var(--radius-2xl);
		@media (width >= --theme(--breakpoint-sm)) {
			--vt-pl-card-radius: var(--radius-3xl);
		}

		&::view-transition-group(pl-card) {
			overflow: clip;
			/* matches the immersive player stage */
			background: #0b0b0b;
			top: 0;
			left: 0;
			transform: none;
			height: 100%;
			animation:
				view-player-container-rounded 400ms var(--ease-standard),
				var(--vt-pl-card-morph-ani) 400ms var(--ease-standard);
		}

		&::view-transition-old(pl-card),
		&::view-transition-new(pl-card) {
			overflow: clip;
		}

		&::view-transition-old(pl-card) {
			animation: fade-out 75ms linear forwards;
		}

		&::view-transition-new(pl-card) {
			animation: fade-in 325ms 75ms linear both;
		}

		&:active-view-transition-type(forwards) {
			--vt-pl-card-from-radius: var(--vt-pl-card-radius);
			--vt-pl-card-to-radius: 0;
			--vt-pl-card-morph-ani: view-player-card-morph-enter;

			&::view-transition-old(pl-card) {
				object-fit: contain;
			}

			&::view-transition-new(pl-card) {
				object-fit: cover;
				object-position: 0 calc(-1 * var(--fp-scroll-top));
			}
		}

		&:active-view-transition-type(backwards) {
			--vt-pl-card-from-radius: 0;
			--vt-pl-card-to-radius: var(--vt-pl-card-radius);
			--vt-pl-card-morph-ani: view-player-card-morph-exit;

			&::view-transition-old(pl-card) {
				object-fit: cover;
				object-position: 0 calc(-1 * var(--fp-scroll-top));
			}

			&::view-transition-new(pl-card) {
				object-fit: contain;
			}
		}

		&::view-transition-group(pl-artwork) {
			animation-duration: 400ms;
			animation-timing-function: var(--ease-standard);
		}
	}
</style>
