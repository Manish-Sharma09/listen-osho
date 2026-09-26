/**
 * The Android app (see capacitor.config.ts) appends this marker to the WebView user agent.
 * Keep in sync with static/supported-browser-check.js, which can't import this module.
 */
export const NATIVE_APP_USER_AGENT_MARKER = 'ListenOshoApp'

export const isNativeApp: boolean =
	typeof navigator !== 'undefined' && navigator.userAgent.includes(NATIVE_APP_USER_AGENT_MARKER)

interface SystemChromePlugin {
	setColor(options: { color: string; dark: boolean }): Promise<void>
}

let systemChrome: Promise<SystemChromePlugin> | undefined

const toHex = (cssColor: string): string | null => {
	const [r, g, b] = cssColor.match(/[\d.]+/g)?.map(Number) ?? []
	if (r === undefined || g === undefined || b === undefined) {
		return null
	}

	return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Colours the strips behind the Android status and navigation bars, which sit outside the WebView.
 * `color` is any computed rgb() or hex colour, `dark` picks light bar icons.
 * See android/app/src/main/java/com/listenosho/app/SystemChromePlugin.java
 */
export const setNativeSystemBarsColor = (color: string, dark: boolean): void => {
	const hex = color.startsWith('#') ? color : toHex(color)
	if (!isNativeApp || !hex) {
		return
	}

	systemChrome ??= import('@capacitor/core').then(({ registerPlugin }) =>
		registerPlugin<SystemChromePlugin>('SystemChrome'),
	)
	systemChrome.then((plugin) => plugin.setColor({ color: hex, dark })).catch(() => {})
}
