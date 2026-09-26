<script lang="ts">
	import BrandMark from '$lib/rajneesh/components/ui/BrandMark.svelte'

	const groups = [
		{
			title: 'Listen',
			links: [
				{ label: 'Home', href: '/library/home' },
				{ label: 'Shorts', href: '/library/shorts' },
				{ label: 'Explore', href: '/library/explore' },
				{ label: 'Bookmarks', href: '/library/bookmarks' },
			],
		},
		{
			title: 'App',
			links: [
				{ label: 'Settings', href: '/settings' },
				{ label: 'About', href: '/about' },
				{ label: 'Now playing', href: '/player' },
			],
		},
		{
			title: 'Credits',
			links: [
				{
					label: 'Audio via Internet Archive',
					href: 'https://archive.org/details/osho-audio-discourses-collection',
				},
			],
		},
	]
</script>

<footer class="mt-16 border-t border-(--hairline) pt-12 pb-8">
	<div class="grid gap-10 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
		<div class="flex flex-col gap-3">
			<a
				href="/library/home"
				class="flex w-fit items-center rounded-md"
				aria-label="Listen Osho home"
			>
				<BrandMark wordmark class="[&_img]:size-8 [&_img]:rounded-md" />
			</a>
			<p class="max-w-xs text-body-md text-onSurfaceVariant">
				Osho's discourses in Hindi and English, free to stream or save for offline listening.
			</p>
		</div>

		{#each groups as group (group.title)}
			<nav aria-label={group.title} class="flex flex-col gap-3">
				<div class="text-eyebrow text-onSurface">{group.title}</div>
				<ul class="flex flex-col gap-2">
					{#each group.links as link (link.href)}
						{@const external = link.href.startsWith('http')}
						<li>
							<a
								href={link.href}
								target={external ? '_blank' : undefined}
								rel={external ? 'noreferrer' : undefined}
								class="text-body-md text-onSurfaceVariant transition-colors hover:text-onSurface"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/each}
	</div>
</footer>
