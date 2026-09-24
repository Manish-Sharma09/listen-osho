<script lang="ts">
	interface Props {
		title: string
		/** id for the heading, so the section can reference it via aria-labelledby */
		id?: string
		eyebrow?: string
		description?: string
		/** Right-aligned action area, e.g. a "View all" button */
		action?: Snippet
		class?: ClassValue
	}

	const { title, id, eyebrow, description, action, class: className }: Props = $props()
</script>

<div class={['mb-8 flex flex-wrap items-end justify-between gap-4', className]}>
	<div class="flex min-w-0 flex-col gap-1.5">
		{#if eyebrow}
			<span class="text-eyebrow text-onSurfaceVariant">{eyebrow}</span>
		{/if}
		<h2 {id} class="text-headline-md sm:text-headline-lg">{title}</h2>
		{#if description}
			<p class="max-w-prose text-body-lg text-onSurfaceVariant">{description}</p>
		{/if}
	</div>

	{#if action}
		<div class="flex shrink-0 items-center gap-2">
			{@render action()}
		</div>
	{/if}
</div>
