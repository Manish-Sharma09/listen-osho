<script lang="ts">
	import { createManagedArtwork } from '$lib/helpers/create-managed-artwork.svelte'
	import { formatDuration } from '$lib/helpers/utils/format-duration.ts'
	import { formatNameOrUnknown, getItemLanguage } from '$lib/helpers/utils/text.ts'
	import { createTrackQuery, type TrackData } from '$lib/library/get/value-queries.ts'
	import { DownloadButton } from '$lib/rajneesh/components/index.ts'
	import {
		ensureCompletedTracksLoaded,
		isTrackCompleted,
	} from '$lib/stores/completed-tracks.svelte.ts'
	import Artwork from '../Artwork.svelte'
	import ListItem, { type MenuItem } from '../ListItem.svelte'

	interface Props {
		trackId: number
		style?: string
		ariaRowIndex?: number
		active?: boolean
		class?: ClassValue
		menuItems?: (playlist: TrackData) => MenuItem[]
		onclick?: (track: TrackData) => void
	}

	const {
		trackId,
		style,
		active,
		class: className,
		onclick,
		ariaRowIndex,
		menuItems,
	}: Props = $props()

	const player = usePlayer()
	const query = createTrackQuery(() => trackId)
	const { value: track, loading } = $derived(query)

	const artworkSrc = createManagedArtwork(() => track?.image?.small)

	const menuItemsWithItem = $derived(track && menuItems?.bind(null, track))

	$effect(() => {
		if (track) {
			void ensureCompletedTracksLoaded()
		}
	})
</script>

<ListItem
	{style}
	menuItems={menuItemsWithItem}
	tabindex={-1}
	class={[
		'h-18 rounded-lg text-left transition-colors duration-200',
		active ? 'bg-secondaryContainer text-onSurfaceVariant' : 'text-onSurfaceVariant',
		className,
	]}
	ariaLabel={m.trackPlay({ name: track?.name ?? '' })}
	{ariaRowIndex}
	onclick={() => onclick?.(track!)}
>
	<div
		role="cell"
		class={['track-item h-full grow items-center gap-5', track && track.duration <= 0 && 'no-duration']}
	>
		<Artwork
			src={artworkSrc()}
			alt={track?.name}
			class={['hidden! h-11 w-11 rounded-md @xs:flex!', loading && 'skeleton']}
		/>

		{#if loading}
			<div>
				<div class="skeleton mb-2 h-3 w-2/3 rounded-full"></div>
				<div class="skeleton h-2 w-1/4 rounded-full"></div>
			</div>
		{:else if query.error}
			<div class="text-error">
				Error loading track with id {trackId}
			</div>
		{:else if track}
			<div class="flex flex-col gap-1" lang={getItemLanguage(track.language)}>
				<div class="flex items-center gap-2">
					{#if active}
						<!-- Equalizer bars mark the discourse that is loaded; they move while it plays -->
						<span class={['eq', player.playing && 'is-playing']} aria-hidden="true">
							<span></span><span></span><span></span>
						</span>
					{/if}
					<div class="line-clamp-2 text-title-sm break-words text-onSurface">
						{track.name}
					</div>
				</div>
				{#if isTrackCompleted(track.uuid)}
					<div class="text-body-sm text-onSurface/60">
						{m.libraryCompleted()}
					</div>
				{/if}
			</div>

			<div class="hidden @4xl:block">
				{formatNameOrUnknown(track.album)}
			</div>

			{#if track.duration > 0}
				<div class="hidden tabular-nums @sm:block">
					{formatDuration(track.duration)}
				</div>
			{/if}

			<DownloadButton
				trackId={track.uuid}
				file={track.file}
			/>
		{/if}
	</div>
</ListItem>

<style>
	.eq {
		display: inline-flex;
		align-items: flex-end;
		gap: 2px;
		width: 12px;
		height: 12px;
		flex-shrink: 0;

		& span {
			width: 2.5px;
			height: 40%;
			border-radius: 1px;
			background: var(--color-tertiary);
		}

		&.is-playing span {
			animation: eq-bounce 900ms ease-in-out infinite;
		}

		& span:nth-child(2) {
			height: 90%;
			animation-delay: -300ms;
		}

		& span:nth-child(3) {
			height: 60%;
			animation-delay: -600ms;
		}
	}

	@keyframes eq-bounce {
		0%,
		100% {
			height: 25%;
		}
		50% {
			height: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.eq.is-playing span {
			animation: none;
		}
	}

	.track-item {
		--grid-cols: auto 1fr 56px;
		display: grid;
		grid-template-columns: var(--grid-cols);
	}

	@container (min-width: 24rem) {
		.track-item {
			--grid-cols: auto 1.5fr 74px 56px;
		}

	.track-item.no-duration {
		--grid-cols: auto 1.5fr 56px;
	}
	}

	/* @container (theme('containers.4xl')) { */
	@container (min-width: 56rem) {
		.track-item {
			--grid-cols: auto 1.5fr minmax(200px, 1fr) 74px 56px;
		}

	.track-item.no-duration {
		--grid-cols: auto 1.5fr minmax(200px, 1fr) 56px;
	}
	}
</style>
