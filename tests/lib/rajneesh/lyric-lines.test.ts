import { describe, expect, it } from 'vitest'
import { toLyricLines } from '$lib/rajneesh/transcript/lyric-lines.ts'

describe('toLyricLines', () => {
	it('returns nothing for an empty transcript', () => {
		expect(toLyricLines('')).toEqual([])
		expect(toLyricLines('\n  \n\n')).toEqual([])
	})

	it('breaks a paragraph into sentences at the danda and other sentence endings', () => {
		const lines = toLyricLines(
			'मैं आपसे वही कहूंगा जो मैं जानता हूं, क्योंकि उसके कहने का ही कुछ मूल्य है। जो मेरे हृदय तक हो, उसकी ही संभावना बनती है! क्या आप तैयार हैं?',
		)

		expect(lines.map((line) => line.text)).toEqual([
			'मैं आपसे वही कहूंगा जो मैं जानता हूं, क्योंकि उसके कहने का ही कुछ मूल्य है।',
			'जो मेरे हृदय तक हो, उसकी ही संभावना बनती है!',
			'क्या आप तैयार हैं?',
		])
		expect(lines.map((line) => line.paragraphStart)).toEqual([true, false, false])
	})

	it('joins short sentences until the line is long enough', () => {
		const lines = toLyricLines('नमो ब्रह्मणे। नमस्ते वायो। ऋत वादिष्यामि। सत्यं वादिष्यामि।')

		expect(lines.map((line) => line.text)).toEqual([
			'नमो ब्रह्मणे। नमस्ते वायो। ऋत वादिष्यामि।',
			'सत्यं वादिष्यामि।',
		])
	})

	it('breaks a very long sentence at commas', () => {
		const clause = 'and the mind keeps running after the next thing without rest'
		const lines = toLyricLines(`${clause}, ${clause}, ${clause}.`)

		expect(lines.length).toBe(3)
		expect(lines.every((line) => line.text.length <= 140)).toBe(true)
		expect(lines.map((line) => line.text).join(' ')).toBe(`${clause}, ${clause}, ${clause}.`)
	})

	it('keeps closing quotes with their sentence', () => {
		const lines = toLyricLines(
			'He said, "Be still and know that you are already home." Then he was silent for a while.',
		)

		expect(lines[0]?.text).toBe('He said, "Be still and know that you are already home."')
	})

	it('marks the first line of every paragraph', () => {
		const lines = toLyricLines(
			'The first paragraph is right here.\n\nThe second paragraph follows it.',
		)

		expect(lines.map((line) => line.paragraphStart)).toEqual([true, true])
	})

	it('spreads the start times over the discourse by speaking length', () => {
		const lines = toLyricLines(
			'A short line that is still long enough.\nA much longer line that takes a good deal more time to say out loud than the first.\nThe end of it all.',
		)

		expect(lines[0]?.start).toBe(0)
		for (let index = 1; index < lines.length; index += 1) {
			expect(lines[index]?.start).toBeGreaterThan(lines[index - 1]?.start ?? 0)
		}
		expect(lines.at(-1)?.start).toBeLessThan(1)

		// The longer middle line gets more time than the first
		const first = (lines[1]?.start ?? 0) - (lines[0]?.start ?? 0)
		const second = (lines[2]?.start ?? 0) - (lines[1]?.start ?? 0)
		expect(second).toBeGreaterThan(first)
	})
})
