<script lang="ts">
	import Button from '$lib/components/Button.svelte'
	import Icon from '$lib/components/icon/Icon.svelte'
	import { formatDuration } from '$lib/helpers/utils/format-duration.ts'
	import { formatArtists, getItemLanguage } from '$lib/helpers/utils/text.ts'
	import Turntable from '$lib/rajneesh/components/three-d/Turntable.svelte'

	interface Props {
		/** Used when nothing is queued yet */
		onStart: () => void
	}

	const { onStart }: Props = $props()

	const player = usePlayer()
	const track = $derived(player.activeTrack)

	const progress = $derived.by(() => {
		const value = player.currentTime / player.duration
		return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
	})

	const toggle = () => {
		if (track) {
			player.togglePlay()
			return
		}

		onStart()
	}
</script>

<section
	aria-labelledby="home-now-spinning-title"
	class="grid items-center gap-8 py-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:gap-14"
>
	<div class="mx-auto w-full max-w-md">
		<Turntable
			src={player.artworkSrc}
			playing={player.playing}
			{progress}
			onToggle={toggle}
			toggleLabel={player.playing ? m.playerPause() : m.playerPlay()}
		/>
	</div>

	<div class="flex min-w-0 flex-col gap-5">
		<span class="flex items-center gap-2 text-eyebrow text-onSurfaceVariant">
			<span
				class={[
					'size-1.5 rounded-full',
					player.playing ? 'animate-pulse bg-tertiary' : 'bg-onSurfaceVariant/40',
				]}
				aria-hidden="true"
			></span>
			{player.playing ? 'Now spinning' : track ? 'On the turntable' : 'Your turntable'}
		</span>

		{#if track}
			<div class="grid gap-2" lang={getItemLanguage(track.language)}>
				<h2 id="home-now-spinning-title" class="text-headline-md text-balance sm:text-headline-lg">
					{track.name}
				</h2>
				<p class="text-body-lg text-onSurfaceVariant">
					{track.album} · {formatArtists(track.artists)}
				</p>
			</div>

			<div class="flex flex-col gap-2">
				<div class="h-1 overflow-hidden rounded-full bg-onSurface/10" aria-hidden="true">
					<div
						class="h-full origin-left rounded-full bg-tertiary transition-transform duration-500 ease-linear"
						style="transform: scaleX({progress})"
					></div>
				</div>
				<div class="flex justify-between font-mono text-label-md text-onSurfaceVariant tabular-nums">
					<span>{formatDuration(player.currentTime)}</span>
					<span>{formatDuration(player.duration)}</span>
				</div>
			</div>
		{:else}
			<div class="grid gap-2">
				<h2 id="home-now-spinning-title" class="text-headline-md text-balance sm:text-headline-lg">
					Put on a discourse.
				</h2>
				<p class="text-body-lg text-onSurfaceVariant">
					Drop the needle on a random moment from the library, or pick a series below.
				</p>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-3">
			<Button class="h-11 px-5" onclick={toggle} disabled={!!player.playbackError && !track}>
				<Icon type="play" class={['size-5', player.playing && 'hidden']} />
				{#if player.playing}
					{m.playerPause()}
				{:else}
					{track ? m.playerPlay() : 'Start listening'}
				{/if}
			</Button>

			{#if track}
				<Button kind="outlined" as="a" href="/player" class="h-11 px-5">
					Open player
					<Icon type="chevronUp" class="size-5" />
				</Button>
			{/if}
		</div>

		{#if player.playbackError && track}
			<p role="alert" class="text-body-sm text-error">{player.playbackError}</p>
		{/if}

		<p class="text-body-sm text-onSurfaceVariant/80 max-md:hidden">
			Tip: click the record to play or pause.
		</p>
	</div>
</section>
