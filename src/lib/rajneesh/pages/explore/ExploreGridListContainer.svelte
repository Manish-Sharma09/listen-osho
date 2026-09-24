<script lang="ts" module>
	import VirtualContainer from '$lib/components/VirtualContainer.svelte'
	import { safeInteger } from '$lib/helpers/utils/integers.ts'
	import ExploreGridItem, { type ExploreItemGridItemProps } from './ExploreGridItem.svelte'

	interface Props {
		items: number[]
		item: ExploreItemGridItemProps['children']
	}
</script>

<script lang="ts">
	const { items, item: itemSnippet }: Props = $props()

	let containerWidth = $state(0)

	const gap = 16

	const sizes = $derived.by(() => {
		const minWidth = containerWidth > 600 ? 200 : 150

		const columns = safeInteger(Math.floor(containerWidth / minWidth), 1)
		const width = safeInteger(Math.floor((containerWidth - gap * (columns - 1)) / columns))

		// Square artwork (inset by the 8px card padding) + 64px caption + padding
		const height = width + 64

		return {
			width,
			height: height + gap,
			columns,
			heightWithoutGap: height,
		}
	})
</script>

<VirtualContainer
	bind:offsetWidth={containerWidth}
	{gap}
	count={items.length}
	size={sizes.height}
	lanes={sizes.columns}
	key={(index) => `${items[index]}-${index}`}
>
	{#snippet children(item)}
		<ExploreGridItem
			itemId={items[item.index] as number}
			style="
				left: {item.lane * sizes.width + item.lane * gap}px;
				width: {sizes.width}px;
				height: {item.size - gap}px;
				transform: translateY({item.start}px);
			"
			class="virtual-item top-0"
		>
			{#snippet children(itemValue)}
				{@render itemSnippet(itemValue)}
			{/snippet}
		</ExploreGridItem>
	{/snippet}
</VirtualContainer>
