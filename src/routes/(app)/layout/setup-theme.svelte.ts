import { page } from '$app/state'
import { isNativeApp, setNativeSystemBarsColor } from '$lib/helpers/native-app.ts'
import { isSafari } from '$lib/helpers/utils/ua'

const updateThemeMetaElement = (element: Element) => {
	// Background color uses --surface color
	const surfaceColor = window.getComputedStyle(document.documentElement).backgroundColor
	element.setAttribute('content', surfaceColor)
}

const updateWindowTileBarColor = (isDark: boolean) => {
	// Safari does not respect media queries on theme meta element,
	// so instead we update all elements every time
	if (isSafari()) {
		const metaTags = document.querySelectorAll('meta[name="theme-color"]')

		for (const element of metaTags) {
			updateThemeMetaElement(element)
		}

		return
	}

	const element = document.querySelector(
		`meta[name="theme-color"][media="(prefers-color-scheme: ${isDark ? 'dark' : 'light'})"]`,
	)

	if (element) {
		updateThemeMetaElement(element)
	}
}

const syncNativeSystemBars = (isDark: boolean) => {
	// The full player is always a dark stage over the artwork, see player/+layout.svelte
	if (page.route.id?.startsWith('/(app)/player')) {
		setNativeSystemBarsColor('#0b0b0b', true)
		return
	}

	// Background color uses --surface color
	setNativeSystemBarsColor(window.getComputedStyle(document.documentElement).backgroundColor, isDark)
}

export const setupTheme = (): void => {
	const player = usePlayer()
	const mainStore = useMainStore()

	$effect.pre(() => {
		document.documentElement.classList.toggle('dark', mainStore.isThemeDark)
	})

	if (isNativeApp) {
		$effect(() => {
			syncNativeSystemBars(mainStore.isThemeDark)
		})
	}

	let initial = true
	$effect.pre(() => {
		const isDark = mainStore.isThemeDark
		const artworkArgb = mainStore.pickColorFromArtwork
			? player.activeTrack?.primaryColor
			: undefined

		const argbOrHex = artworkArgb ?? mainStore.customThemePaletteHex

		if (initial) {
			initial = false

			if (isSafari()) {
				updateWindowTileBarColor(isDark)
			}

			// On initial load, if no custom color is set we can skip
			// loading module which relatively heavy
			if (!argbOrHex) {
				return
			}
		}

		void import('$lib/theme.ts').then(({ updateThemeCssVariables }) => {
			updateThemeCssVariables(argbOrHex, isDark)
			updateWindowTileBarColor(isDark)
			if (isNativeApp) {
				syncNativeSystemBars(isDark)
			}
		})
	})
}
