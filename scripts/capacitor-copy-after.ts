/**
 * Runs after `cap copy` / `cap sync` (Capacitor calls the `capacitor:copy:after` package script).
 *
 * build/index.html is the prerendered `/` page, which only redirects to /library/home. The Android
 * app serves index.html for every route that has no file, so that redirect would loop forever.
 * Serve the SPA fallback shell instead, which renders whatever route the URL points at.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const platform = process.env.CAPACITOR_PLATFORM_NAME
const webDir = process.env.CAPACITOR_WEB_DIR ?? 'build'

if (platform === 'android') {
	fs.copyFileSync(
		path.join(webDir, '404.html'),
		path.join('android', 'app', 'src', 'main', 'assets', 'public', 'index.html'),
	)
}
