import { writeFileSync } from 'node:fs'
import {
	argbFromHex,
	// biome-ignore lint/style/noRestrictedImports: Used for static theme generation
} from '@material/material-color-utilities'
import type { Plugin } from 'vite'
import { getThemePaletteRgbEntries, type PaletteToken } from '../src/lib/theme.ts'

type ThemeOverrides = Partial<Record<PaletteToken, readonly [light: string, dark: string]>>

const generateThemeVariables = (hexColor: string, overrides: ThemeOverrides = {}) => {
	const argb = argbFromHex(hexColor)

	const tokensLightEntries = getThemePaletteRgbEntries(argb, false)
	const tokensDark = Object.fromEntries(getThemePaletteRgbEntries(argb, true))

	const variables = tokensLightEntries
		.map(([name, lightValue]) => {
			const [light, dark] = overrides[name] ?? [lightValue, tokensDark[name]]

			return `--color-${name}: light-dark(${light}, ${dark});`
		})
		.join('\n')

	return variables
}

export interface Options {
	output: string
	/** Hex color seed used when generating default color tokens */
	defaultColorSeed: string
	/**
	 * Fixed [light, dark] hex values that replace generated tokens, used to pin the
	 * default theme to a hand-authored palette. Runtime artwork/custom themes still apply.
	 */
	overrides?: ThemeOverrides
}

/** @public */
export const themeColorsPlugin = (options: Options): Plugin => ({
	name: themeColorsPlugin.name,
	enforce: 'pre',
	async buildStart() {
		const variables = await generateThemeVariables(options.defaultColorSeed, options.overrides)

		const content = `
			@theme {
				--color-*: initial;
				--color-transparent: transparent;
				--color-current: currentColor;
			  ${variables}
			}
		`

		// We generate actual CSS file instead of virtual module
		// so tailwindcss intellisense can properly access it
		writeFileSync(options.output, content, {
			encoding: 'utf-8',
		})
	},
})
