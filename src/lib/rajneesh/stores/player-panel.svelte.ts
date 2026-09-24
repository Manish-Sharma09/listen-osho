/**
 * Which panel the full player shows beside (or, on small screens, instead of) the turntable:
 * the synced transcript ("lyrics") or the queue. Remembered per browser.
 */

const STORAGE_KEY = 'listen-osho-player-panel'

interface PlayerPanelState {
	transcriptOpen: boolean
	/** Show Hindi transcripts in Roman letters instead of Devanagari */
	romanized: boolean
}

const read = (): PlayerPanelState => {
	try {
		const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<PlayerPanelState>
			return {
				transcriptOpen: parsed.transcriptOpen === true,
				romanized: parsed.romanized === true,
			}
		}
	} catch {
		// Storage unavailable; fall back to defaults
	}

	return { transcriptOpen: false, romanized: false }
}

export const playerPanel = $state<PlayerPanelState>(read())

$effect.root(() => {
	$effect(() => {
		const snapshot = JSON.stringify({
			transcriptOpen: playerPanel.transcriptOpen,
			romanized: playerPanel.romanized,
		})

		try {
			localStorage.setItem(STORAGE_KEY, snapshot)
		} catch {
			// Ignore quota or privacy-mode errors
		}
	})
})
