<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import { createManagedArtwork } from '$lib/helpers/create-managed-artwork.svelte'
	import { formatNameOrUnknown } from '$lib/helpers/utils/text.ts'
	import type { TrackData } from '$lib/library/get/value.ts'
	import type { Album } from '$lib/library/types.ts'
	import { tilt } from '$lib/rajneesh/attachments/tilt.ts'
	import RecordSleeve from '$lib/rajneesh/components/three-d/RecordSleeve.svelte'

	interface ResumeCardData {
		track: TrackData
		album: Album | undefined
		listenedMinutes: number
	}

	interface Props {
		card: ResumeCardData
		/** The most recent card gets the "Last played" badge */
		featured?: boolean
		onResume: () => void
	}

	const { card, featured = false, onResume }: Props = $props()

	const player = usePlayer()

	const artworkSrc = createManagedArtwork(() => card.album?.image ?? card.track?.image?.small)
	const isCurrent = $derived(player.activeTrack?.uuid === card.track.uuid)
	const listenedLabel = $derived.by(() => {
		if (card.listenedMinutes < 60) {
			return 'few minutes listened'
		}

		const hours = Math.floor(card.listenedMinutes / 60)
		return `${hours} hour${hours === 1 ? '' : 's'} listened`
	})
</script>

<article
	{@attach tilt({ max: 5 })}
	class="record-host surface-card group flex h-full w-full animate-rise flex-col overflow-hidden rounded-xl"
>
	<div class="flex grow items-center gap-5 p-5 pr-8">
		<RecordSleeve
			src={artworkSrc()}
			alt={card.track.name}
			out={isCurrent}
			spinning={isCurrent && player.playing}
			class="w-20 shrink-0"
		/>

		<div class="ml-5 flex min-w-0 flex-col gap-1">
			<span class="text-eyebrow text-onSurfaceVariant">
				{isCurrent && player.playing ? 'Now spinning' : featured ? 'Last played' : 'In progress'}
			</span>
			<h3 class="line-clamp-2 text-title-lg">
				{formatNameOrUnknown(card.track.name)}
			</h3>
			<p class="text-body-sm text-onSurfaceVariant">
				{listenedLabel}
			</p>
		</div>
	</div>

	<div class="mt-auto border-t border-(--hairline) px-5 py-4">
		<Button kind="filled" class="w-full" onclick={onResume}>
			<Icon type="play" class="size-5" />
			Continue listening
		</Button>
	</div>
</article>
