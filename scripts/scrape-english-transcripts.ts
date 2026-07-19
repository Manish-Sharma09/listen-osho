#!/usr/bin/env node
/**
 * One-off scraper: pulls English discourse transcripts from oshoworld.com and
 * saves them into static/rajneesh/transcripts/ using this repo's own catalog.json
 * naming convention (trackIdTpl-derived), so they link up automatically via
 * transcriptPathToTrackUuid (track-resolver.ts / build-pagefind-index.ts) without
 * any further wiring.
 *
 * Resumable: skips any track file that already exists and is non-empty.
 *
 * Usage: tsx scripts/scrape-english-transcripts.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CATALOG_PATH = path.join(ROOT, 'static', 'rajneesh', 'catalog.json')
const TRANSCRIPTS_DIR = path.join(ROOT, 'static', 'rajneesh', 'transcripts')
const REPORT_PATH = path.join(ROOT, 'scripts', '.scrape-english-transcripts-report.json')

const BASE = 'https://oshoworld.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const CONCURRENCY = 4
const RETRY_COUNT = 3
const RETRY_DELAY_MS = 1500

type AlbumTuple = [
	name: string,
	description: string,
	isStructured: boolean,
	structured: [count: number, trackIdTpl: string, ...rest: unknown[]] | null,
	coverUrl: string | null,
]

type Catalog = { albums: AlbumTuple[] }

interface Report {
	albumsOk: string[]
	albumsFailed: { name: string; triedSlugs: string[] }[]
	tracksFailed: { album: string; slug: string; error: string }[]
	tracksSaved: number
	tracksSkippedExisting: number
}

const report: Report = {
	albumsOk: [],
	albumsFailed: [],
	tracksFailed: [],
	tracksSaved: 0,
	tracksSkippedExisting: 0,
}

function pad2(n: number): string {
	return String(n).padStart(2, '0')
}

function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/'/g, '')
		.replace(/[:,]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string): Promise<string | null> {
	for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
		try {
			const res = await fetch(url, { headers: { 'User-Agent': UA } })
			if (res.status === 404) return null
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			return await res.text()
		} catch (err) {
			if (attempt === RETRY_COUNT) {
				console.error(`  fetch failed (${attempt}/${RETRY_COUNT}): ${url}: ${(err as Error).message}`)
				return null
			}
			await sleep(RETRY_DELAY_MS * attempt)
		}
	}
	return null
}

function extractNextData(html: string): any | null {
	const m = html.match(/__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
	if (!m) return null
	try {
		return JSON.parse(m[1])
	} catch {
		return null
	}
}

const ENTITY_MAP: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	rsquo: '’',
	lsquo: '‘',
	rdquo: '”',
	ldquo: '“',
	ndash: '–',
	mdash: '—',
	hellip: '…',
}

function decodeEntities(text: string): string {
	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, ent: string) => {
		if (ent[0] === '#') {
			const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10)
			return Number.isNaN(code) ? whole : String.fromCodePoint(code)
		}
		return ENTITY_MAP[ent] ?? whole
	})
}

function htmlToText(html: string): string {
	let text = html
	text = text.replace(/<br\s*\/?>/gi, '\n')
	text = text.replace(/<\/(p|div)>/gi, '\n\n')
	text = text.replace(/<[^>]+>/g, '')
	text = decodeEntities(text)
	text = text.replace(/\r\n/g, '\n')
	text = text
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
	text = text.replace(/\n{3,}/g, '\n\n').trim()
	return text
}

async function fetchJson(remoteSlug: string): Promise<any | null> {
	const html = await fetchWithRetry(`${BASE}/${remoteSlug}`)
	if (!html) return null
	return extractNextData(html)
}

async function fetchTrackText(remoteSlug: string): Promise<string | null> {
	const data = await fetchJson(remoteSlug)
	const description: string | undefined = data?.props?.pageProps?.data?.pageData?.audioData?.description
	if (!description) return null
	return htmlToText(description)
}

/**
 * Individual discourse detail-page slugs sometimes use a different spelling than
 * the series slug (e.g. series "and-the-flowers-showered-01-11" but its tracks are
 * "and-the-flowers-showerd-01" - a typo drift on oshoworld's own site). The series
 * listing page's listData still carries the real per-track slug prefix even though
 * that same listing is truncated (reports the correct total but returns fewer
 * items), so we only use it to learn the prefix, not to enumerate tracks.
 */
function slugCandidatesForName(albumName: string): string[] {
	const beforeColon = albumName.split(':')[0]
	const bases = [albumName, beforeColon]
	const out = new Set<string>()
	for (const base of bases) {
		const plain = slugify(base)
		out.add(plain)
		// oshoworld sometimes drops filler words ("the") from the slug entirely.
		out.add(plain.replace(/(^|-)the(-|$)/g, '$1').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'))
	}
	return Array.from(out).filter(Boolean)
}

async function resolveRemotePrefix(albumName: string, catalogPrefix: string, count: number): Promise<string> {
	const namePrefixes = slugCandidatesForName(albumName)
	const bases = Array.from(new Set([catalogPrefix, ...namePrefixes]))
	// Series pages use either a numbered range slug ("-01-42") or a plain "-series" slug.
	const seriesCandidates = Array.from(
		new Set(bases.flatMap((p) => [`${p}-01-${pad2(count)}`, `${p}-series`])),
	)
	for (const candidate of seriesCandidates) {
		const data = await fetchJson(candidate)
		const firstSlug: string | undefined = data?.props?.pageProps?.data?.pageData?.listData?.[0]?.slug
		if (firstSlug) {
			const lastDash = firstSlug.lastIndexOf('-')
			if (lastDash !== -1) return firstSlug.slice(0, lastDash)
		}
	}
	// Series page unavailable too - fall back to best-guess track prefixes, tried per-track below.
	return catalogPrefix
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency: number): Promise<void> {
	let idx = 0
	async function next(): Promise<void> {
		while (idx < items.length) {
			const item = items[idx++]
			await worker(item)
		}
	}
	await Promise.all(Array.from({ length: concurrency }, () => next()))
}

async function main() {
	const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as Catalog
	const englishAlbums = catalog.albums.filter(
		(a): a is AlbumTuple & { 3: NonNullable<AlbumTuple[3]> } =>
			a[2] === true && a[3] !== null && a[1].toLowerCase().startsWith('english'),
	)

	console.log(`Found ${englishAlbums.length} English structured albums in catalog.json`)

	const nameFilter = process.env.SCRAPE_NAME_CONTAINS?.toLowerCase()
	const filtered = nameFilter ? englishAlbums.filter((a) => a[0].toLowerCase().includes(nameFilter)) : englishAlbums
	const limit = process.env.SCRAPE_LIMIT ? parseInt(process.env.SCRAPE_LIMIT, 10) : filtered.length
	const albumsToProcess = filtered.slice(0, limit)

	let albumNum = 0
	for (const [name, , , structured] of albumsToProcess) {
		albumNum++
		const [count, trackIdTpl] = structured
		const catalogPrefix = trackIdTpl.replace(/-\{i\}$/, '')
		const localFolder = `${catalogPrefix}-by-osho-01-${pad2(count)}`
		const localDir = path.join(TRANSCRIPTS_DIR, localFolder)

		const existingCount = fs.existsSync(localDir)
			? fs.readdirSync(localDir).filter((f) => f.endsWith('.txt') && fs.statSync(path.join(localDir, f)).size > 0)
					.length
			: 0
		if (existingCount >= count) {
			console.log(`[${albumNum}/${albumsToProcess.length}] SKIP (already complete): ${name}`)
			report.albumsOk.push(name)
			continue
		}

		console.log(`[${albumNum}/${albumsToProcess.length}] ${name} (${count} tracks)`)
		const remotePrefix = await resolveRemotePrefix(name, catalogPrefix, count)
		const trackPrefixCandidates = Array.from(new Set([remotePrefix, catalogPrefix, ...slugCandidatesForName(name)]))

		fs.mkdirSync(localDir, { recursive: true })

		const indices = Array.from({ length: count }, (_, k) => k + 1)
		let albumSaved = 0
		await runPool(
			indices,
			async (i) => {
				const localFile = path.join(localDir, `${catalogPrefix}-${pad2(i)}.txt`)
				if (fs.existsSync(localFile) && fs.statSync(localFile).size > 0) {
					report.tracksSkippedExisting++
					albumSaved++
					return
				}
				let text: string | null = null
				let triedSlug = ''
				for (const prefix of trackPrefixCandidates) {
					triedSlug = `${prefix}-${pad2(i)}`
					text = await fetchTrackText(triedSlug)
					if (text) break
				}
				if (!text) {
					report.tracksFailed.push({ album: name, slug: triedSlug, error: 'no description found' })
					return
				}
				fs.writeFileSync(localFile, text, 'utf8')
				report.tracksSaved++
				albumSaved++
			},
			CONCURRENCY,
		)

		if (albumSaved === 0) {
			report.albumsFailed.push({ name, triedSlugs: trackPrefixCandidates.map((p) => `${p}-01..${pad2(count)}`) })
			console.error(`  no tracks recovered for this album on oshoworld.com`)
		} else {
			report.albumsOk.push(name)
			if (albumSaved < count) {
				console.error(`  only ${albumSaved}/${count} tracks recovered`)
			}
		}
		fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8')
	}

	fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8')
	console.log('\n=== Done ===')
	console.log(`Albums OK: ${report.albumsOk.length}`)
	console.log(`Albums failed to locate: ${report.albumsFailed.length}`)
	console.log(`Tracks saved: ${report.tracksSaved}`)
	console.log(`Tracks skipped (already existed): ${report.tracksSkippedExisting}`)
	console.log(`Tracks failed: ${report.tracksFailed.length}`)
	console.log(`Full report: ${REPORT_PATH}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
