import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.listenosho.app',
	appName: 'Listen Osho',
	webDir: 'build',
	// Lets the web code detect it is running inside the app (src/lib/helpers/native-app.ts)
	appendUserAgent: 'ListenOshoApp',
	plugins: {
		SystemBars: {
			// Keep the WebView between the system bars without injecting --safe-area-inset-* variables,
			// which the app doesn't use (it relies on env(safe-area-inset-*) where needed)
			insetsHandling: 'native',
		},
	},
}

export default config
