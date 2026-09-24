#!/usr/bin/env node
/**
 * Builds the Pagefind transcript search index only when it is missing,
 * so `pnpm dev` works on a fresh checkout without a full production build.
 *
 * Usage: pnpm run ensure:pagefind (runs automatically before `pnpm dev`)
 */

import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENTRY = path.resolve(__dirname, '..', 'static', 'pagefind', 'pagefind.js')

if (fs.existsSync(ENTRY)) {
	process.exit(0)
}

console.log('Pagefind index not found, building it (this takes about a minute)...')
const result = spawnSync('tsx', [path.join(__dirname, 'build-pagefind-index.ts')], {
	stdio: 'inherit',
	shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)
