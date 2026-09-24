/**
 * Hands off from the static startup preloader (markup and styles live in src/app.html)
 * to the mounted app.
 */

/** Keep the preloader up at least this long after navigation start so it never flickers */
const MIN_VISIBLE_MS = 800
/** Fallback in case `transitionend` never fires (e.g. the tab is hidden) */
const REMOVE_FALLBACK_MS = 1500

export const dismissPreloader = (): void => {
	const element = document.getElementById('app-preloader')
	if (!element || element.dataset.leaving === 'true') {
		return
	}

	element.dataset.leaving = 'true'

	const remove = () => {
		element.remove()
	}

	const leave = () => {
		element.addEventListener('transitionend', (event) => {
			if (event.target === element && event.propertyName === 'opacity') {
				remove()
			}
		})
		element.classList.add('is-leaving')
		setTimeout(remove, REMOVE_FALLBACK_MS)
	}

	// performance.now() is measured from navigation start
	const wait = Math.max(0, MIN_VISIBLE_MS - performance.now())
	setTimeout(() => requestAnimationFrame(leave), wait)
}
