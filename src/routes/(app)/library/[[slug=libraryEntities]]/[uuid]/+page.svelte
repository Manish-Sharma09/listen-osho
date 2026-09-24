<script lang="ts">
	import RecordSleeve from '$lib/rajneesh/components/three-d/RecordSleeve.svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import Button from '$lib/components/Button.svelte'
	import Header from '$lib/components/Header.svelte'
	import IconButton from '$lib/components/IconButton.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import TracksListContainer from '$lib/components/tracks/TracksListContainer.svelte'
	import { isRajneeshEnabled } from '$lib/rajneesh/index.ts'
	import { initPageQueries } from '$lib/db/query/page-query.svelte.ts'
	import { createManagedArtwork } from '$lib/helpers/create-managed-artwork.svelte'
	import { formatArtists, formatNameOrUnknown } from '$lib/helpers/utils/text.ts'
	import type { AlbumData, TrackData } from '$lib/library/get/value.ts'
	import { removeTrackEntryFromPlaylist } from '$lib/library/playlists-actions.ts'
	import { type Album, type Playlist, UNKNOWN_ITEM } from '$lib/library/types.ts'
	import { getPlaylistMenuItems } from '$lib/menu-actions/playlists.ts'

	const { data } = $props()

	const menu = useMenu()
	const main = useMainStore()
	const player = usePlayer()

	// svelte-ignore state_referenced_locally
	initPageQueries(data)

	// svelte-ignore state_referenced_locally
	const { itemQuery, tracksQuery } = data

	const item = $derived(itemQuery.value)
	const tracks = $derived(tracksQuery.value)
	const slug = $derived(data.slug)
	const isThisSeriesActive = $derived(
		slug === 'albums' && !!player.activeTrack && player.activeTrack.album === item.name,
	)

	const artworkSrc = createManagedArtwork(() => {
		if (slug !== 'playlists') {
			return (item as Album).image
		}

		return null
	})

	const isWideLayout = new MediaQuery('(min-width: 1154px)')

	const playlistTrackMenuItems = (track: TrackData) => {
		return [
			{
				label: m.libraryTrackRemoveFromPlaylist(),
				action: () => {
					const entryId = tracks.playlistIdMap?.[track.id]
					invariant(entryId)

					void removeTrackEntryFromPlaylist(entryId)
				},
			},
		]
	}

	const getMenuItems = () => {
		const addToQueueMenuItem =
			tracks.tracksIds.length === 0
				? null
				: {
						label: m.playerAddToQueue(),
						action: () => {
							player.addToQueue(tracks.tracksIds)
						},
					}

		if (slug === 'playlists') {
			return [addToQueueMenuItem, ...getPlaylistMenuItems(main, item as Playlist)]
		}

		return [
			addToQueueMenuItem,
			{
				label: m.libraryAddToPlaylist(),
				action: () => {
					main.addTrackToPlaylistDialogOpen = tracks.tracksIds
				},
			},
			{
				label: m.libraryRemoveFromLibrary(),
				action: () => {
					main.removeLibraryItemOpen = {
						id: item.id,
						name: item.name,
						storeName: slug,
					}
				},
			},
		]
	}

	const menuItems = $derived.by(() => {
		const items = getMenuItems().filter((item) => item !== null)

		return items.length > 0 ? items : null
	})

	const description = $derived(slug === 'playlists' && (item as Playlist).description)

	const artists = $derived(slug === 'albums' && formatArtists((item as AlbumData).artists))
</script>

{#if !isWideLayout.current || !main.librarySplitLayoutEnabled}
	<Header title={data.singularTitle()} mode="fixed" />
{/if}

<div class="@container flex grow flex-col px-4 pb-4 sm:px-6">
	<section
		class="record-host relative isolate mt-4 mb-8 flex w-full flex-col items-center gap-8 overflow-hidden rounded-2xl border border-(--hairline) bg-surfaceContainerLowest p-6 @lg:p-10 @2xl:min-h-80 @2xl:flex-row @2xl:items-end"
	>
		<!-- DESIGN.md mesh, the page's only colour -->
		<div class="bg-mesh pointer-events-none absolute inset-0 -z-1 opacity-70" aria-hidden="true"></div>

		{#if slug !== 'playlists'}
			<!-- The series as a record sleeve: the vinyl slides out on hover and spins while this series plays -->
			<div class="w-52 shrink-0 animate-rise pr-18 @2xl:w-64 @2xl:pr-22">
				<RecordSleeve
					src={artworkSrc()}
					alt={formatNameOrUnknown(item.name)}
					out={isThisSeriesActive}
					spinning={isThisSeriesActive && player.playing}
					peek={0.42}
				/>
			</div>
		{/if}

		<div class="flex w-full min-w-0 animate-rise flex-col gap-4 [animation-delay:80ms]">
			<div class="flex flex-col gap-2 @max-2xl:items-center @max-2xl:text-center">
				<span class="flex items-center gap-2 text-eyebrow text-onSurfaceVariant">
					<Icon type="playlist" class="size-4" />
					{data.singularTitle()}
				</span>

				<h1 class="text-headline-lg text-balance @2xl:text-display-xl">
					{formatNameOrUnknown(item.name)}
				</h1>

				{#if description}
					<p class="text-body-lg text-onSurfaceVariant">{description}</p>
				{/if}

				{#if artists}
					<div class="grid w-full overflow-hidden text-body-lg">
						<div class="truncate">
							{artists}
						</div>
					</div>
				{/if}

				<div class="text-eyebrow text-onSurfaceVariant">
					{#if slug === 'albums' && (item as AlbumData).year !== UNKNOWN_ITEM}
						{(item as AlbumData).year} •
					{/if}

					{m.libraryTracksCount({ count: tracks.tracksIds.length })}
				</div>
			</div>

			<div class="flex items-center gap-2 @max-2xl:justify-center">
				<Button
					kind="filled"
					class="h-11 px-6"
					disabled={tracks.tracksIds.length === 0}
					onclick={() => {
						player.playTrack(0, tracks.tracksIds)
					}}
				>
					<Icon type="play" class="size-5" />
					{m.play()}
				</Button>

				{#if !isRajneeshEnabled()}
					<Button
						kind="outlined"
						class="h-11"
						disabled={tracks.tracksIds.length === 0}
						onclick={() => {
							player.playTrack(0, tracks.tracksIds, {
								shuffle: true,
							})
						}}
					>
						{m.shuffle()}
						<Icon type="shuffle" />
					</Button>
				{/if}

				{#if menuItems && slug !== 'albums'}
					<IconButton
						icon="moreVertical"
						tooltip={m.more()}
						class="ml-auto size-10 rounded-md! border border-(--hairline) bg-surfaceContainerLowest"
						onclick={(e) => {
							menu.showFromEvent(e, menuItems, {
								anchor: true,
								preferredAlignment: {
									horizontal: 'right',
									vertical: 'top',
								},
							})
						}}
					/>
				{/if}
			</div>
		</div>
	</section>

	<!-- Plain translucent panel: a backdrop blur over a very tall virtual list would be costly -->
	<div class="rounded-xl border border-(--hairline) bg-surfaceContainerLowest p-1.5">
	<TracksListContainer
		items={tracks.tracksIds}
		predefinedMenuItems={{
			viewAlbum: slug !== 'albums',
			viewArtist: slug !== 'artists',
		}}
		menuItems={slug === 'playlists' ? playlistTrackMenuItems : undefined}
	/>
	</div>
</div>
