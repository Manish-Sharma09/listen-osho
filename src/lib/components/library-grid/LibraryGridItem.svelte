<script lang="ts" module>
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { RouteId } from '$app/types'
	import { ripple } from '$lib/attachments/ripple.ts'
	import type { QueryResult } from '$lib/db/query/query.ts'
	import { createManagedArtwork } from '$lib/helpers/create-managed-artwork.svelte.ts'
	import { dbGetAlbumTracksIdsByName, dbGetArtistTracksIdsByName } from '$lib/library/get/ids'
	import type { AlbumData, ArtistData } from '$lib/library/get/value'
	import { createAlbumQuery, createArtistQuery } from '$lib/library/get/value-queries'
	import Artwork from '../Artwork.svelte'
	import { snackbar } from '../snackbar/snackbar.ts'

	export type LibraryGridItemType = 'albums' | 'artists'

	export type LibraryGridItemValue<Type extends LibraryGridItemType> = {
		albums: AlbumData
		artists: ArtistData
	}[Type]

	export interface LibraryItemGridItemProps<Type extends LibraryGridItemType> {
		itemId: number
		type: Type
		class: ClassValue
		style: string
		children: Snippet<[LibraryGridItemValue<Type>]>
	}
</script>

<script lang="ts" generics="Type extends LibraryGridItemType">
	const {
		type,
		itemId,
		class: className,
		children,
		...props
	}: LibraryItemGridItemProps<Type> = $props()

	const menu = useMenu()
	const main = useMainStore()
	const player = usePlayer()

	type Value = LibraryGridItemValue<Type>

	const query =
		// prettier-ignore
		(
			// svelte-ignore state_referenced_locally only initialized once
			type === 'albums' ? createAlbumQuery(() => itemId) : createArtistQuery(() => itemId)
		) as QueryResult<Value>
	const { value: item } = $derived(query)

	const artworkSrc = createManagedArtwork(() => {
		if (type === 'albums') {
			return item ? (item as AlbumData).image : undefined
		}

		return undefined
	})

	const linkProps = $derived.by(() => {
		const item = query.value
		if (!item) {
			return null
		}

		const detailsViewId: RouteId = '/(app)/library/[[slug=libraryEntities]]/[uuid]'
		const shouldReplace = page.route.id === detailsViewId

		const resolvedHref = resolve('/(app)/library/[[slug=libraryEntities]]/[uuid]', {
			slug: type,
			uuid: item.uuid,
		})

		return {
			href: resolvedHref,
			shouldReplace,
		}
	})

	const dbGetAlbumOrArtistTrackIdsByName = async (name: string) => {
		if (type === 'albums') {
			return dbGetAlbumTracksIdsByName(name)
		}

		return dbGetArtistTracksIdsByName(name)
	}

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
						const tracksIds = await dbGetAlbumOrArtistTrackIdsByName(item.name)

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
						const tracksIds = await dbGetAlbumOrArtistTrackIdsByName(item.name)

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
						storeName: type,
					}
				},
			},
		]
	}
</script>

<a
	{@attach ripple()}
	{...props}
	role="listitem"
	class={[
		className,
		'surface-card interactable flex flex-col rounded-xl p-1.5 transition-[border-color] duration-200 hover:border-(--hairline-strong)',
	]}
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
	<Artwork
		src={artworkSrc()}
		fallbackIcon={type === 'albums' ? 'album' : 'person'}
		class={['w-full rounded-lg ring-0', query.loading && 'skeleton']}
	/>

	<div
		class="flex h-18 w-full flex-col justify-center overflow-hidden px-2 text-center text-onSurfaceVariant"
	>
		{#if query.loading}
			<div class="skeleton mx-auto mb-2 h-3 w-3/4 rounded-full"></div>
			<div class="skeleton mx-auto h-2 w-1/3 rounded-full"></div>
		{:else if query.error}
			{m.errorUnexpected()}
		{:else if item}
			{@render children(item)}
		{/if}
	</div>
</a>
