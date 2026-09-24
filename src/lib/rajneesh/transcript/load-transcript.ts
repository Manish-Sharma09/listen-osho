/**
 * Loads the plain-text transcript for a catalog track from /rajneesh/transcripts.
 * Shared by the player's "Read transcript" dialog and the synced transcript panel.
 */

import { TRANSCRIPT_PREFIX_ALIASES } from './track-resolver.ts'

interface TranscriptTrack {
	uuid: string
	trackNo: number
	trackOf: number
}

// Catalog prefix -> transcript folder prefix, for series whose spelling drifted
const CATALOG_TO_TRANSCRIPT_PREFIX: Record<string, string> = Object.fromEntries(
	Object.entries(TRANSCRIPT_PREFIX_ALIASES).map(([transcript, catalog]) => [catalog, transcript]),
)

export const buildTranscriptCandidates = (
	trackUuid: string,
	trackNo: number,
	trackOf: number,
): string[] => {
	const lastDash = trackUuid.lastIndexOf('-')
	if (lastDash === -1) {
		return []
	}

	const catalogPrefix = trackUuid.slice(0, lastDash)
	const prefixes = Array.from(
		new Set([catalogPrefix, CATALOG_TO_TRANSCRIPT_PREFIX[catalogPrefix]].filter(Boolean)),
	) as string[]
	const num = String(trackNo)
	const count = String(trackOf)

	const discourseWidths = Array.from(
		new Set([num.length, count.length, 2, 3].filter((width) => width >= num.length)),
	).sort((a, b) => a - b)
	const rangeWidths = Array.from(new Set([count.length, 2, 3])).sort((a, b) => a - b)

	return prefixes.flatMap((prefix) => {
		const discourseSlugs = Array.from(
			new Set([
				`${prefix}-${num}`,
				...discourseWidths.map((width) => `${prefix}-${num.padStart(width, '0')}`),
			]),
		)

		const seriesSlugs = Array.from(
			new Set(
				rangeWidths.flatMap((width) => [
					`${prefix}-by-osho-1-${count.padStart(width, '0')}`,
					`${prefix}-by-osho-${String(1).padStart(width, '0')}-${count.padStart(width, '0')}`,
					`${prefix}-by-osho-${String(1).padStart(width, '0')}-${count}`,
				]),
			),
		)

		return seriesSlugs.flatMap((seriesSlug) =>
			discourseSlugs.map(
				(discourseSlug) => `/rajneesh/transcripts/${seriesSlug}/${discourseSlug}.txt`,
			),
		)
	})
}

const cache = new Map<string, Promise<string | null>>()

/** Resolves to the transcript text, or null when this discourse has no transcript. */
export const loadTrackTranscript = (track: TranscriptTrack): Promise<string | null> => {
	const cached = cache.get(track.uuid)
	if (cached) {
		return cached
	}

	const request = (async () => {
		for (const candidate of buildTranscriptCandidates(track.uuid, track.trackNo, track.trackOf)) {
			const response = await fetch(candidate)
			// Dev servers and SPA fallbacks can answer unknown paths with the HTML shell
			const isHtml = response.headers.get('content-type')?.includes('text/html')
			if (!response.ok || isHtml) {
				continue
			}

			const buffer = await response.arrayBuffer()
			return new TextDecoder('utf-8').decode(buffer)
		}

		return null
	})()

	// Do not cache failures caused by the network, only definitive answers
	request.catch(() => cache.delete(track.uuid))
	cache.set(track.uuid, request)

	return request
}
