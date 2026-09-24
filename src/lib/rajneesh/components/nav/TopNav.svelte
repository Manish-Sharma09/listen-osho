<script lang="ts">
	import { goto } from '$app/navigation'
	import IconButton from '$lib/components/IconButton.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import BrandMark from '$lib/rajneesh/components/ui/BrandMark.svelte'
	import type { NavItem } from '$lib/rajneesh/ui/nav-items.ts'

	interface Props {
		items: NavItem[]
		activeSlug: string
		/** Extra app controls rendered before the settings button (e.g. split view toggle) */
		children?: Snippet
		class?: ClassValue
	}

	const { items, activeSlug, children, class: className }: Props = $props()

	const main = useMainStore()

	const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

	const openSearch = () => {
		void goto('/library/explore?focus=1')
	}

	const onWindowKeydown = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement | null
		const isEditable =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target?.isContentEditable
		if (isEditable) return

		if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || event.key === '/') {
			event.preventDefault()
			openSearch()
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<header
	class={[
		'surface-frost pointer-events-auto fixed inset-x-0 top-0 z-10 h-(--app-header-height) border-b border-(--hairline)',
		className,
	]}
>
	<div
		class="mx-auto flex h-full w-full max-w-(--app-max-content-width) items-center gap-3 px-4 sm:gap-6 sm:px-6"
	>
		<a href="/library/home" class="flex shrink-0 items-center rounded-md" aria-label="Listen Osho home">
			<BrandMark wordmark class="[&_img]:size-8 [&_img]:rounded-md" />
		</a>

		<nav aria-label="Primary" class="hidden items-center gap-1 sm:flex">
			{#each items as item (item.slug)}
				{@const active = item.slug === activeSlug}
				<a
					href={`/library/${item.slug}`}
					aria-current={active ? 'page' : undefined}
					class={[
						'rounded-full px-3 py-1.5 text-body-md transition-colors duration-200',
						active
							? 'bg-secondaryContainer text-onSurface'
							: 'text-onSurfaceVariant hover:bg-secondaryContainer/60 hover:text-onSurface',
					]}
				>
					{item.title}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2">
			<!-- DESIGN.md text-input look, acting as a command-style search trigger -->
			<button
				type="button"
				onclick={openSearch}
				class="hidden h-9 w-56 items-center gap-2 rounded-md border border-(--hairline) bg-surfaceContainerLowest px-3 text-left text-body-md text-onSurfaceVariant shadow-whisper transition-colors hover:border-(--hairline-strong) md:flex lg:w-64"
			>
				<Icon type="search" class="size-4 shrink-0" />
				<span class="flex-1 truncate">Search discourses…</span>
				<kbd class="rounded-sm border border-(--hairline) px-1.5 font-mono text-label-sm">
					{isMac ? '⌘K' : 'Ctrl K'}
				</kbd>
			</button>

			<IconButton
				icon="search"
				tooltip="Search"
				ariaLabel="Search"
				class="size-9 rounded-md! md:hidden"
				onclick={openSearch}
			/>

			{@render children?.()}

			<IconButton
				icon="palette"
				tooltip={main.isThemeDark ? 'Switch to light theme' : 'Switch to dark theme'}
				ariaLabel={main.isThemeDark ? 'Switch to light theme' : 'Switch to dark theme'}
				class="size-9 rounded-md! border border-(--hairline) bg-surfaceContainerLowest"
				onclick={() => {
					main.theme = main.isThemeDark ? 'light' : 'dark'
				}}
			/>

			<IconButton
				as="a"
				href="/settings"
				icon="settings"
				tooltip={m.settings()}
				ariaLabel={m.settings()}
				class="size-9 rounded-md! border border-(--hairline) bg-surfaceContainerLowest"
			/>
		</div>
	</div>
</header>
