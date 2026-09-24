<script lang="ts">
	// DESIGN.md "logo strip": a greyscale row of names, here the masters Osho speaks on.
	interface Props {
		items: readonly string[]
		label: string
		/** Builds the link for a name */
		href: (item: string) => string
		class?: ClassValue
	}

	const { items, label, href, class: className }: Props = $props()
</script>

<section aria-label={label} class={['marquee group relative overflow-hidden py-8', className]}>
	<div
		class="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
	>
		<!-- Rendered twice so the -50% translate loops seamlessly -->
		{#each [0, 1] as copy (copy)}
			<ul class="flex shrink-0 items-center gap-10" aria-hidden={copy === 1 ? 'true' : undefined}>
				{#each items as item (item)}
					<li>
						<a
							href={href(item)}
							tabindex={copy === 1 ? -1 : undefined}
							class="text-eyebrow whitespace-nowrap text-onSurfaceVariant/70 transition-colors hover:text-onSurface"
						>
							{item}
						</a>
					</li>
				{/each}
			</ul>
		{/each}
	</div>
</section>

<style>
	.marquee {
		mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
	}
</style>
