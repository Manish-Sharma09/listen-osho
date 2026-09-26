/**
 * Turns a plain-text transcript into short, lyric-sized lines and estimates when each is spoken.
 * Transcripts carry no timestamps, so the discourse is shared out by how long each line takes to
 * say: its letters, plus a pause after every sentence and a longer one after every paragraph.
 */

export interface LyricLine {
	text: string
	/** Estimated start, as a fraction of the whole discourse (0 to 1) */
	start: number
	/** First line of a transcript paragraph */
	paragraphStart: boolean
}

/** Lines shorter than this are joined with the next sentence */
const MIN_LINE_LENGTH = 40
/** Joining never grows a line past this, and longer sentences are broken at commas */
const MAX_LINE_LENGTH = 140

/** Pauses, measured in letters' worth of speaking time */
const SENTENCE_PAUSE = 6
const PARAGRAPH_PAUSE = 14

// Sentence-ending punctuation (including the danda), followed by any closing quotes or brackets
const SENTENCE_BREAK = /(?<=[।॥?!.…]['"”’)\]]*)\s+/u
const SENTENCE_END = /[।॥?!.…]['"”’)\]]*(?=\s|$)/gu
const CLAUSE_BREAK = /(?<=[,;:])\s+/u

/** Joins neighbouring pieces while a line is still short, without letting it grow too long */
const pack = (pieces: string[]): string[] => {
	const packed: string[] = []

	for (const piece of pieces) {
		const last = packed[packed.length - 1]
		if (
			last !== undefined &&
			last.length < MIN_LINE_LENGTH &&
			last.length + 1 + piece.length <= MAX_LINE_LENGTH
		) {
			packed[packed.length - 1] = `${last} ${piece}`
		} else {
			packed.push(piece)
		}
	}

	return packed
}

export const toLyricLines = (transcript: string): LyricLine[] => {
	const drafts: { text: string; weight: number; paragraphStart: boolean }[] = []

	for (const rawParagraph of transcript.split('\n')) {
		const paragraph = rawParagraph.replace(/\s+/g, ' ').trim()
		if (!paragraph) {
			continue
		}

		const sentences = paragraph
			.split(SENTENCE_BREAK)
			.flatMap((sentence) =>
				sentence.length > MAX_LINE_LENGTH ? pack(sentence.split(CLAUSE_BREAK)) : [sentence],
			)
		const texts = pack(sentences)

		texts.forEach((text, index) => {
			const letters = text.replace(/\s/g, '').length
			const sentenceEnds = text.match(SENTENCE_END)?.length ?? 0
			const paragraphEnd = index === texts.length - 1

			drafts.push({
				text,
				weight:
					letters + sentenceEnds * SENTENCE_PAUSE + (paragraphEnd ? PARAGRAPH_PAUSE : 0),
				paragraphStart: index === 0,
			})
		})
	}

	const total = drafts.reduce((sum, draft) => sum + draft.weight, 0) || 1
	let elapsed = 0

	return drafts.map(({ text, weight, paragraphStart }) => {
		const start = elapsed / total
		elapsed += weight

		return { text, start, paragraphStart }
	})
}
