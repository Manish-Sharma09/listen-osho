import { THEME_PALLETTE_DARK } from '../../../server/theme-colors.ts'

export const prerender = true

const manifest = {
	short_name: m.appNameShort(),
	name: m.appName(),
	// Start PWA on the home page instead of the full tracks list
	start_url: './library/home/',
	scope: '../',
	theme_color: THEME_PALLETTE_DARK.surface,
	background_color: THEME_PALLETTE_DARK.surface,
	display: 'standalone',
	orientation: 'any',
	description: 'Lightweight on device music player right in your browser.',
	icons: [
		{
			src: '/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png',
			purpose: 'any',
		},
		{
			src: '/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any',
		},
		{
			src: '/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable',
		},
	],
}

export const GET = () => {
	return new Response(JSON.stringify(manifest), {
		headers: {
			'Content-Type': 'application/manifest+json',
		},
	})
}
