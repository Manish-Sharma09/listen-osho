<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import IconButton from '$lib/components/IconButton.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import Separator from '$lib/components/Separator.svelte'
	import { debounce } from '$lib/helpers/utils/debounce.ts'
	import type { PageData } from './$types.ts'

	interface Props {
		name: string
		sortOptions: PageData['sortOptions']
		store: PageData['store']
	}

	const { name, sortOptions, store }: Props = $props()

	let searchInput = $state<HTMLInputElement | null>(null)

	const searchHandler = debounce((e: InputEvent) => {
		const term = (e.target as HTMLInputElement).value

		store.searchTerm = term
	}, 300)

	$effect(() => {
		if (page.url.searchParams.get('focus') !== '1') {
			return
		}

		searchInput?.focus()
	})
	const searchPlaceholder = $derived.by(() => {
		const slug = page.params.slug
		if (slug === 'albums' || slug === 'explore') {
			return m.librarySearch()
		}

		return `${m.librarySearch()} ${name.toLowerCase()}`
	})

	const menu = useMenu()

	const sortMenuItems = $derived.by(() =>
		sortOptions().map((option) => ({
			label: option.name,
			selected: store.sortByKey === option.key,
			action: () => {
				store.sortByKey = option.key
			},
		})),
	)

	const sortMenuHandler = (e: MouseEvent) => {
		menu.showFromEvent(e, sortMenuItems, {
			anchor: true,
			preferredAlignment: {
				vertical: 'top',
				horizontal: 'right',
			},
		})
	}
</script>

<div
	class="surface-card @container sticky top-[calc(var(--app-header-height)+12px)] z-1 mt-6 mb-8 flex w-full items-center gap-1 rounded-lg py-1 pr-1 pl-3 transition-[box-shadow,border-color] duration-200 focus-within:border-(--hairline-strong) focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-tertiary)_18%,transparent)] @sm:gap-2"
>
	<Icon type="search" class="size-5 shrink-0 text-onSurfaceVariant" />

	<input
		bind:this={searchInput}
		value={store.searchTerm}
		type="text"
		name="search"
		placeholder={searchPlaceholder}
		aria-label={searchPlaceholder}
		class="h-11 min-w-0 flex-1 bg-transparent pl-1 text-body-lg placeholder:text-onSurfaceVariant/80 focus:outline-none"
		oninput={(e) => searchHandler(e as unknown as InputEvent)}
	/>

	<Separator vertical class="my-auto hidden h-6 @sm:flex" />

	{#if sortMenuItems.length > 1}
		<IconButton icon="sort" tooltip={m.libraryOpenSortMenu()} onclick={sortMenuHandler} />
	{/if}

	{#if page.params.slug !== 'explore'}
		<IconButton
			class={[store.order === 'desc' && 'rotate-180', 'transition-transform']}
			icon="sortAscending"
			tooltip={m.libraryToggleSortOrder()}
			onclick={() => {
				store.order = store.order === 'asc' ? 'desc' : 'asc'
			}}
		/>
	{/if}

	<Separator vertical class="my-auto hidden h-6 @sm:flex" />

	<IconButton
		ariaLabel={m.settings()}
		tooltip={m.settings()}
		icon="settings"
		onclick={() => {
			void goto('/settings')
		}}
	/>
</div>
