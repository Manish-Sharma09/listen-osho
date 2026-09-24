<script lang="ts" module>
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { RouteId } from '$app/types'
	import { ripple } from '$lib/attachments/ripple.ts'
	import type { QueryResult } from '$lib/db/query/query.ts'
	import { createManagedArtwork } from '$lib/helpers/create-managed-artwork.svelte.ts'
	import { dbGetAlbumTracksIdsByName } from '$lib/library/get/ids'
	import type { AlbumData } from '$lib/library/get/value'
	import { createAlbumQuery } from '$lib/library/get/value-queries'
	import Artwork from '$lib/components/Artwork.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import { tilt } from '$lib/rajneesh/attachments/tilt.ts'
	import { snackbar } from '$lib/components/snackbar/snackbar.ts'

	export interface ExploreItemGridItemProps {
		itemId: number
		class: ClassValue
		style: string
		children: Snippet<[AlbumData]>
	}
</script>

<script lang="ts">
	const {
		itemId,
		class: className,
		children,
		...props
	}: ExploreItemGridItemProps = $props()

	const menu = useMenu()
	const main = useMainStore()
	const player = usePlayer()

	const query = createAlbumQuery(() => itemId) as QueryResult<AlbumData>
	const { value: item } = $derived(query)

	const artworkSrc = createManagedArtwork(() => {
		return item ? item.image : undefined
	})

	const linkProps = $derived.by(() => {
		const item = query.value
		if (!item) {
			return null
		}

		// Currently Explore items link to Album details
		const resolvedHref = resolve('/(app)/library/[[slug=libraryEntities]]/[uuid]', {
			slug: 'albums',
			uuid: item.uuid,
		})

		return {
			href: resolvedHref,
			shouldReplace: false, // Don't replace state when navigating from Explore
		}
	})

	const menuItems = () => {
		if (!item || !linkProps) {
			return []
		}

		return [
			{
				label: m.libraryViewDetails(),
				action: () => {
					goto(linkProps.href, { replaceState: linkProps.shouldReplace })
				},
			},
			{
				label: m.playerAddToQueue(),
				action: async () => {
					try {
						const tracksIds = await dbGetAlbumTracksIdsByName(item.name)

						player.addToQueue(tracksIds)
					} catch (error) {
						snackbar.unexpectedError(error)
					}
				},
			},
			{
				label: m.libraryAddToPlaylist(),
				action: async () => {
					try {
						const tracksIds = await dbGetAlbumTracksIdsByName(item.name)

						main.addTrackToPlaylistDialogOpen = tracksIds
					} catch (error) {
						snackbar.unexpectedError(error)
					}
				},
			},
			{
				label: m.libraryRemoveFromLibrary(),
				action: () => {
					main.removeLibraryItemOpen = {
						id: item.id,
						name: item.name,
						storeName: 'albums',
					}
				},
			},
		]
	}
</script>

<!--
	The anchor is the virtual list item (absolutely positioned, paint-contained), so the 3D tilt
	lives on an inner card with a little padding around it to keep the tilt from being clipped.
-->
<a
	{...props}
	role="listitem"
	class={[className, 'explore-card group block rounded-xl p-1 -outline-offset-2']}
	href={linkProps?.href}
	data-sveltekit-replacestate={linkProps?.shouldReplace}
	oncontextmenu={(e) => {
		e.preventDefault()
		menu.showFromEvent(e, menuItems(), {
			anchor: false,
			position: { top: e.y, left: e.x },
		})
	}}
>
	<div
		{@attach ripple()}
		{@attach tilt({ max: 9, scale: 1.02 })}
		class="surface-card interactable h-full flex-col items-stretch rounded-xl p-2 transition-[border-color] duration-200 group-hover:border-(--hairline-strong)"
	>
		<div class="relative overflow-hidden rounded-lg">
			<Artwork
				src={artworkSrc()}
				fallbackIcon="album"
				class={[
					'w-full rounded-lg ring-0 [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-calm group-hover:[&_img]:scale-105',
					query.loading && 'skeleton',
				]}
			/>
			<span
				class="absolute right-2 bottom-2 flex size-9 translate-y-2 items-center justify-center rounded-full bg-primary text-onPrimary opacity-0 shadow-float transition-[opacity,translate] duration-300 ease-calm group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
				aria-hidden="true"
			>
				<Icon type="headphones" class="size-4" />
			</span>
		</div>

		<div class="flex h-16 w-full flex-col justify-center overflow-hidden px-1.5 text-left text-onSurfaceVariant">
			{#if query.loading}
				<div class="skeleton mb-2 h-3 w-3/4 rounded-full"></div>
				<div class="skeleton h-2 w-1/3 rounded-full"></div>
			{:else if query.error}
				<span class="text-body-sm text-error">{m.errorUnexpected()}</span>
			{:else if item}
				{@render children(item)}
			{/if}
		</div>
	</div>
</a>
