<script lang="ts">
	import { ripple } from '$lib/attachments/ripple.ts'
	import Icon from '$lib/components/icon/Icon.svelte'
	import type { NavItem } from '$lib/rajneesh/ui/nav-items.ts'

	interface Props {
		items: NavItem[]
		activeSlug: string
		class?: ClassValue
	}

	const { items, activeSlug, class: className }: Props = $props()
</script>

<nav
	aria-label="Primary"
	class={[
		'surface-frost grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] border-t border-(--hairline) px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),6px)]',
		className,
	]}
>
	{#each items as item (item.slug)}
		{@const active = item.slug === activeSlug}
		<a
			{@attach ripple()}
			href={`/library/${item.slug}`}
			aria-current={active ? 'page' : undefined}
			class={[
				'interactable h-14 flex-col justify-center gap-1 rounded-lg text-label-sm transition-colors',
				active ? 'text-onSurface' : 'text-onSurfaceVariant',
			]}
		>
			<span
				class={[
					'flex h-7 items-center justify-center rounded-full transition-[background-color,width] duration-300 ease-calm',
					active ? 'w-14 bg-primary text-onPrimary' : 'w-10',
				]}
			>
				<Icon type={item.icon} class="size-5" />
			</span>
			{item.title}
		</a>
	{/each}
</nav>
