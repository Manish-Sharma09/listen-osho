<script lang="ts">
	import Icon, { type IconType } from '$lib/components/icon/Icon.svelte'

	interface Props {
		icon: IconType
		title: string
		description?: string
		tone?: 'neutral' | 'error'
		children?: Snippet
		class?: ClassValue
	}

	const { icon, title, description, tone = 'neutral', children, class: className }: Props = $props()
</script>

<div
	role={tone === 'error' ? 'alert' : 'status'}
	class={['m-auto flex max-w-md animate-rise flex-col items-center px-6 py-16 text-center', className]}
>
	<!-- mb-12 clears the outer ring, which overhangs the box by 2.25rem -->
	<div class="relative mb-12 flex size-24 items-center justify-center">
		<!-- Concentric hairline rings, like grooves on a record -->
		<div class="absolute -inset-4 rounded-full border border-(--hairline)"></div>
		<div class="absolute -inset-9 rounded-full border border-(--hairline) opacity-60"></div>
		<div
			class={[
				'surface-card relative flex size-20 items-center justify-center rounded-full',
				tone === 'error' ? 'text-error' : 'text-onSurface',
			]}
		>
			<Icon type={icon} class="size-9" />
		</div>
	</div>

	<div class="mb-2 text-title-lg">{title}</div>
	{#if description}
		<p class="text-body-md text-onSurfaceVariant">{description}</p>
	{/if}

	{#if children}
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			{@render children()}
		</div>
	{/if}
</div>
