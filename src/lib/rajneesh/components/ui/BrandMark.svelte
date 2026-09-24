<script lang="ts">
	import logo from '$lib/rajneesh/assets/logo.png?w=160&format=webp&as=metadata'

	interface Props {
		/** Show the "Listen Osho" wordmark next to the logo */
		wordmark?: boolean
		class?: ClassValue
	}

	const { wordmark = false, class: className }: Props = $props()
</script>

<span class={['inline-flex items-center gap-2.5', className]}>
	<img
		src={logo.src}
		width="40"
		height="40"
		alt={wordmark ? '' : 'Listen Osho'}
		draggable="false"
		class="size-10 shrink-0 rounded-xl ring-1 ring-(--hairline)"
	/>
	{#if wordmark}
		<span class="text-title-md font-semibold tracking-[-0.4px] whitespace-nowrap">Listen Osho</span>
	{/if}
</span>
