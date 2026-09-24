<script lang="ts">
	import IconButton from '$lib/components/IconButton.svelte'
	import { playerPanel } from '$lib/rajneesh/stores/player-panel.svelte.ts'

	const { class: className }: { class?: ClassValue } = $props()
</script>

<IconButton
	icon="lyrics"
	tooltip={playerPanel.transcriptOpen ? 'Show queue' : 'Show transcript'}
	ariaLabel={playerPanel.transcriptOpen ? 'Show queue' : 'Show transcript'}
	class={[
		'transition-colors',
		playerPanel.transcriptOpen && 'bg-onSurface text-surface',
		className,
	]}
	onclick={() => {
		playerPanel.transcriptOpen = !playerPanel.transcriptOpen
	}}
/>
