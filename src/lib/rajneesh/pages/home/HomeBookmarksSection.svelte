<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import BookmarkCard from '$lib/rajneesh/components/bookmarks/BookmarkCard.svelte'
	import SectionHeader from '$lib/rajneesh/components/ui/SectionHeader.svelte'
	import {
		getResolvedBookmarks,
		onBookmarksDataChange,
		playBookmark,
		shareBookmark,
		type ResolvedBookmark,
	} from '$lib/rajneesh/bookmarks/index.ts'
	import { onMount } from 'svelte'

	const player = usePlayer()

	let bookmarks = $state<ResolvedBookmark[]>([])
	const visibleBookmarks = $derived(bookmarks.slice(0, 4))

	const loadBookmarks = async () => {
		bookmarks = await getResolvedBookmarks()
	}

	onMount(() => {
		void loadBookmarks()

		const unsubscribe = onBookmarksDataChange(() => {
			void loadBookmarks()
		})

		return unsubscribe
	})
</script>

{#if visibleBookmarks.length > 0}
	<section class="py-6" aria-labelledby="home-bookmarks-title">
		<SectionHeader id="home-bookmarks-title" eyebrow="Moments you saved" title="Bookmarks">
			{#snippet action()}
				<Button kind="outlined" as="a" href="/library/bookmarks">
					View all
				</Button>
			{/snippet}
		</SectionHeader>

		<div class="grid gap-3 lg:grid-cols-2">
			{#each visibleBookmarks as bookmark (bookmark.id)}
				<BookmarkCard
					{bookmark}
					onPlay={() => void playBookmark(player, bookmark, true)}
					onShare={() => void shareBookmark(bookmark)}
				/>
			{/each}
		</div>
	</section>
{/if}
