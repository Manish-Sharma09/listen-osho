# Rajneesh Live — Discourses

A web app for listening to, reading and searching Rajneesh audio discourses in Hindi and English. Built with SvelteKit and Tailwind CSS 4, and deployed on GitHub Pages.

**Live site:** [rajneesh-live.github.io](https://rajneesh-live.github.io/)

## Features

- **Home** — A hero section, "Now spinning" with the current discourse, Continue Listening, a cover-flow shelf of featured series, and your recent bookmarks
- **Discover** — Topic tiles counted across every transcript (in Hindi or English). Pick one to search inside the talks, or shuffle for new ones
- **Transcript search** — Full-text search across every discourse transcript, powered by a static [Pagefind](https://pagefind.app/) index. Read the matching transcript or jump straight to the talk
- **Immersive player** — A CSS-3D turntable whose record spins while audio plays and whose tonearm follows playback progress, over a slowly drifting, blurred artwork backdrop
- **Transcript "lyrics"** — Read along with the transcript while you listen. The highlighted paragraph follows playback (approximate, because transcripts have no timestamps). Tap a paragraph to seek to it
- **Bookmarks** — Save moments in a discourse with a timestamp, and share a link that opens at that exact point
- **Shorts** — A TikTok-style vertical feed of short discourse clips with swipe navigation, background music, likes and sharing
- **Explore** — Browse the full catalog of discourse albums in a searchable grid
- **Content language** — Switch between Hindi and English discourses
- **Offline support** — Download tracks to device storage for offline listening
- **Stats** — Track listening hours and completed discourses
- **Installable** — Add to the home screen as a PWA

Reduced-motion preferences are respected: the turntable, cover flow and backdrop animations stay still.

## Development

Requires Node >= 22 and pnpm.

```
pnpm install
pnpm run dev
```

On a fresh checkout, `pnpm run dev` first builds the Pagefind transcript search index into `static/pagefind/`. This takes about a minute and only happens once.

Build for production (rebuilds the search index, then the site into `build/`):

```
pnpm run build
pnpm run preview
```

Other useful scripts:

| Command | What it does |
| --- | --- |
| `pnpm run check` | Type-check with svelte-check |
| `pnpm run test` | Run the Vitest suite |
| `pnpm run biome-check` / `biome-fix` | Lint `src/` with Biome |
| `pnpm run prettier-check` / `prettier-fix` | Check or apply formatting |
| `pnpm run build:pagefind` | Rebuild the transcript search index |
| `pnpm run generate:transcript-tags` | Regenerate the Discover topic counts |
| `pnpm run compile-i18n` | Compile Paraglide translations |

## Project structure

- `src/lib/rajneesh/` — Everything specific to this fork: pages (home, shorts, explore, bookmarks), the 3D turntable and cover flow, transcript lyrics and search, the catalog, downloads and analytics. See [its README](src/lib/rajneesh/README.md) for contribution guidelines.
- `static/rajneesh/` — `catalog.json`, discourse transcripts and the Discover tag data
- `scripts/` — Search index, transcript tag and transcript scraping scripts
- `DESIGN.md` — The design system the UI follows (Geist type, a single ink tone, hairline borders)

## Deployment

Pushing to `main` builds the site and deploys it to GitHub Pages ([deploy.yml](.github/workflows/deploy.yml)).

The **Build Transcript Search EPUB** workflow ([transcript-search.yml](.github/workflows/transcript-search.yml)) can be run by hand from the Actions tab. It searches the transcripts for a word or phrase and packages the top results as an EPUB.

## Acknowledgements

Forked from [Snae Player](https://github.com/minht11/local-music-pwa) by minht11.
