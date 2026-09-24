import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'
import { logChunkSizePlugin } from './lib/vite-log-chunk-size.ts'
import { themeColorsPlugin } from './lib/vite-plugin-theme-colors.ts'

const getAutoImportPlugin = (dts: string | false = false) =>
	AutoImport({
		dts,
		imports: [
			{
				'$paraglide/messages': [['*', 'm']],
				'$lib/stores/player/use-store.ts': ['usePlayer'],
				'$lib/stores/main/use-store.ts': ['useMainStore'],
				'$lib/components/menu/MenuRenderer.svelte': ['useMenu'],
				'tiny-invariant': [['default', 'invariant']],
				svelte: ['untrack'],
			},
		],
	})

export default defineConfig({
	server: {
		fs: {
			allow: ['./.generated'],
		},
		warmup: {
			// Avoids page reloading in Dev mode. When vite supports bundled-dev mode this can be removed.
			clientFiles: [
				'src/lib/components/**/*.svelte',
				'src/lib/library/scan-actions/scanner/worker.ts',
			],
		},
	},
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	build: {
		target: ['chrome114', 'safari16.4'],
		rolldownOptions: {
			output: {
				legalComments: 'none',
				advancedChunks: {
					groups: [
						{
							// Merge all css into a single file
							name: 'styles',
							test: /\.css$/,
							minModuleSize: 0,
							priority: 100,
						},
						{
							// Merge smaller chunks than together
							name: 'small-chunks',
							maxModuleSize: 1 * 1024,
						},
					],
				},
			},
		},
	},
	worker: {
		format: 'es',
		plugins: () => [getAutoImportPlugin()],
	},
	plugins: [
		themeColorsPlugin({
			// Sky blue from the Listen Osho logo seeds any token not pinned below
			defaultColorSeed: '#3fc3fb',
			// DESIGN.md (Geist): near-black ink on a near-white canvas with hairline borders.
			// Dark mode is the inverted Geist ladder. The logo sky is the single accent (tertiary).
			overrides: {
				primary: ['#171717', '#ededed'],
				onPrimary: ['#ffffff', '#0a0a0a'],
				primaryContainer: ['#ebebeb', '#2e2e2e'],
				onPrimaryContainer: ['#171717', '#ededed'],
				secondary: ['#4d4d4d', '#a1a1a1'],
				onSecondary: ['#ffffff', '#0a0a0a'],
				secondaryContainer: ['#f2f2f2', '#1f1f1f'],
				secondaryContainerVariant: ['#ebebeb', '#171717'],
				onSecondaryContainer: ['#171717', '#ededed'],
				tertiary: ['#0a7ab0', '#3fc3fb'],
				onTertiary: ['#ffffff', '#0a0a0a'],
				tertiaryContainer: ['#e3f6fe', '#0b2a3a'],
				onTertiaryContainer: ['#06405c', '#bfeafe'],
				error: ['#ee0000', '#ff6166'],
				onError: ['#ffffff', '#0a0a0a'],
				errorContainer: ['#ffe5e5', '#3d0f10'],
				onErrorContainer: ['#c50000', '#ffb3b5'],
				surface: ['#fafafa', '#0a0a0a'],
				onSurface: ['#171717', '#ededed'],
				surfaceVariant: ['#f2f2f2', '#1a1a1a'],
				onSurfaceVariant: ['#4d4d4d', '#a1a1a1'],
				surfaceContainerHighest: ['#ebebeb', '#262626'],
				surfaceContainerHigh: ['#f2f2f2', '#1c1c1c'],
				surfaceContainer: ['#f5f5f5', '#141414'],
				surfaceContainerLow: ['#fafafa', '#111111'],
				surfaceContainerLowest: ['#ffffff', '#111111'],
				surfaceBright: ['#ffffff', '#1f1f1f'],
				surfaceDim: ['#ebebeb', '#0a0a0a'],
				outline: ['#a1a1a1', '#5c5c5c'],
				outlineVariant: ['#ebebeb', '#262626'],
				shadow: ['#000000', '#000000'],
				scrim: ['#000000', '#000000'],
				inverseSurface: ['#171717', '#ededed'],
				inverseOnSurface: ['#fafafa', '#171717'],
				inversePrimary: ['#ededed', '#171717'],
			},
			output: `${import.meta.dirname}/.generated/theme-colors.css`,
		}),
		imagetools(),
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './.generated/paraglide',
			strategy: ['baseLocale'],
			isServer: 'import.meta.env.SSR',
		}),
		getAutoImportPlugin('./.generated/types/auto-imports.d.ts'),
		logChunkSizePlugin(),
		{
			name: 'ssr-config',
			config(config) {
				const isSsr = config?.build?.ssr

				// Since this is mostly SPA, server logs are mostly noise.
				config.logLevel = isSsr ? 'warn' : 'info'

				return config
			},
		},
	],
})
