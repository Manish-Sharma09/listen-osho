<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import type { RouteId } from '$app/types'
	import AlbumsListContainer from '$lib/components/AlbumsListContainer.svelte'
	import ArtistListContainer from '$lib/components/ArtistListContainer.svelte'
	import Button from '$lib/components/Button.svelte'
	import IconButton from '$lib/components/IconButton.svelte'
	import type { IconType } from '$lib/components/icon/Icon.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import ListDetailsLayout from '$lib/components/ListDetailsLayout.svelte'
	import PlaylistListContainer from '$lib/components/playlists/PlaylistListContainer.svelte'
	import TracksListContainer from '$lib/components/tracks/TracksListContainer.svelte'
	import { initPageQueriesDynamic } from '$lib/db/query/page-query.svelte.ts'
	import { useSetOverlaySnippet } from '$lib/layout-bottom-bar.svelte.ts'
	import { getPlaylistMenuItems } from '$lib/menu-actions/playlists.ts'
	import { isRajneeshEnabled } from '$lib/rajneesh/feature-flags.ts'
	import BookmarksPage from '$lib/rajneesh/pages/bookmarks/BookmarksPage.svelte'
	import Home from '$lib/rajneesh/pages/home/Home.svelte'
	import ShortsView from '$lib/rajneesh/pages/shorts/ShortsView.svelte'
	import ExploreListContainer from '$lib/rajneesh/pages/explore/ExploreListContainer.svelte'
	import TranscriptSearchResults from '$lib/rajneesh/transcript/search/TranscriptSearchResults.svelte'
	import { getNavItems } from '$lib/rajneesh/ui/nav-items.ts'
	import BottomNav from '$lib/rajneesh/components/nav/BottomNav.svelte'
	import TopNav from '$lib/rajneesh/components/nav/TopNav.svelte'
	import EmptyState from '$lib/rajneesh/components/ui/EmptyState.svelte'
	import Search from './Search.svelte'

	const { data, children } = $props()

	initPageQueriesDynamic(
		() => data.slug,
		() => data,
	)

	const main = useMainStore()

	const itemsIds = $derived(data.itemsIdsQuery.value)
	const slug = $derived(data.slug)

	interface NavItem {
		slug: typeof slug
		title: string
		icon: IconType
	}

	const navItems = getNavItems()

	const isWideLayout = $derived(data.isWideLayout())
	const layoutMode = $derived(
		data.layoutMode(main.librarySplitLayoutEnabled, isWideLayout, page.params.uuid),
	)

	useSetOverlaySnippet('bottom-bar', () => layoutBottom)

	export const snapshot: Snapshot<string> = {
		capture: () => data.store.searchTerm,
		restore: (value) => {
			data.store.searchTerm = value
		},
	}
</script>

{#snippet layoutBottom()}
	<!-- Below the sm breakpoint every device gets the bottom tab bar -->
	<BottomNav
		items={navItems}
		activeSlug={slug}
		class="pointer-events-auto -mt-2 w-full sm:hidden active-view-regular:view-name-[bottom-bar]"
	/>
{/snippet}

{#snippet pageIntro(eyebrow: string, title: string, description: string)}
	<header class="animate-rise pt-10 pb-2 sm:pt-14">
		<div class="mb-3 text-eyebrow text-onSurfaceVariant">{eyebrow}</div>
		<h1 class="text-headline-lg text-balance sm:text-display-xl">{title}</h1>
		<p class="mt-3 max-w-2xl text-body-lg text-onSurfaceVariant">{description}</p>
	</header>
{/snippet}

{#if layoutMode !== 'details'}
	<TopNav items={navItems} activeSlug={slug}>
		{#if (slug === 'albums' || slug === 'artists') && isWideLayout}
			<IconButton
				icon="sidePanel"
				tooltip={main.librarySplitLayoutEnabled
					? m.librarySplitViewDisable()
					: m.librarySplitViewEnable()}
				class={[
					'size-9 rounded-md! border border-(--hairline) bg-surfaceContainerLowest max-sm:hidden',
					main.librarySplitLayoutEnabled && 'rotate-180',
				]}
				onclick={() => {
					main.librarySplitLayoutEnabled = !main.librarySplitLayoutEnabled
				}}
			/>
		{/if}
	</TopNav>

	{#if slug !== 'shorts'}
		<!-- Reserves the space under the fixed top bar; Shorts is full-bleed and lets the bar float -->
		<div class="h-(--app-header-height) shrink-0" aria-hidden="true"></div>
	{/if}
{/if}

<ListDetailsLayout mode={layoutMode} class="mx-auto w-full max-w-(--app-max-content-width) grow">
	{#snippet list(mode)}
		<div class={['flex grow flex-col', mode === 'both' && 'pt-(--app-header-height)']}>
			<div class={[mode === 'both' && 'w-100', 'flex grow flex-col px-4 sm:px-6']}>
				{#if slug === 'explore'}
					{@render pageIntro(
						'Library',
						'Explore every series.',
						'Search series by name, or search inside thousands of transcripts to find the exact moment a word was spoken.',
					)}
				{:else if slug === 'bookmarks'}
					{@render pageIntro(
						'Saved moments',
						'Bookmarks.',
						'Every moment you marked in the player, ready to pick up again.',
					)}
				{/if}

				{#if slug !== 'home' && slug !== 'shorts'}
					<Search name={data.pluralTitle()} sortOptions={data.sortOptions} store={data.store} />
				{/if}

				{#if slug === 'playlists'}
					<div class="mb-4 flex items-center justify-end">
						<Button
							kind="outlined"
							onclick={() => {
								main.createNewPlaylistDialogOpen = true
							}}
						>
							<Icon type="plus" />

							{m.libraryNewPlaylist()}
						</Button>
					</div>
				{/if}

				{#if data.tracksCountQuery.value === 0 && slug !== 'playlists' && slug !== 'home' && slug !== 'shorts' && !isRajneeshEnabled()}
					<div class="my-auto flex flex-col items-center text-center">
						<div class="mb-1 text-title-lg">{m.libraryEmpty()}</div>
						{m.libraryStartByAdding()}
						<Button as="a" href="/settings" class="mt-4">
							<Icon type="plus" />
							{m.libraryImportTracks()}
						</Button>
					</div>
				{:else}
					<div class={['flex w-full grow flex-col']}>
						{#if slug === 'home'}
							<Home />
						{:else if slug === 'shorts'}
							<ShortsView />
						{:else if slug === 'bookmarks'}
							<BookmarksPage searchTerm={data.store.searchTerm} />
						{:else if slug === 'explore' && data.store.searchTerm.trim()}
							<div class="flex flex-col gap-6">
								{#if itemsIds.length > 0}
									<ExploreListContainer items={itemsIds} />
								{/if}
								<TranscriptSearchResults searchTerm={data.store.searchTerm} />
							</div>
						{:else if itemsIds.length === 0}
							<EmptyState
								icon="magnify"
								title={m.libraryNoResults()}
								description={m.libraryNoResultsExplanation()}
							/>
						{:else if slug === 'tracks'}
							<TracksListContainer items={itemsIds} />
						{:else if slug === 'albums'}
							<AlbumsListContainer items={itemsIds} />
						{:else if slug === 'explore'}
							<ExploreListContainer items={itemsIds} />
						{:else if slug === 'artists'}
							<ArtistListContainer items={itemsIds} />
						{:else if slug === 'playlists'}
							<PlaylistListContainer
								items={itemsIds}
								menuItems={(playlist) => getPlaylistMenuItems(main, playlist)}
								onItemClick={({ playlist }) => {
									const detailsViewId: RouteId = '/(app)/library/[[slug=libraryEntities]]/[uuid]'
									const shouldReplace = page.route.id === detailsViewId

									void goto(`/library/playlists/${playlist.uuid}`, { replaceState: shouldReplace })
								}}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet details()}
		<div
			class={[
				'pointer-events-auto flex h-full flex-col rounded-2xl',
				// The details page draws its own cards; in split view it only needs a gutter
				layoutMode === 'both' && 'mx-2',
			]}
		>
			{#key page.url.pathname}
				{@render children?.()}
			{/key}
		</div>
	{/snippet}
</ListDetailsLayout>

