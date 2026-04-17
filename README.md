# Wavesound

A Next.js music player that streams full tracks from the [Audius](https://audius.co) API, with optional Spotify embed support.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and shadcn/ui components. Audio playback runs on the native `HTMLAudioElement` via a client-side context provider.

## Getting Started

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

`npm` and `yarn` also work — the repo's lockfile is `pnpm-lock.yaml`, so `pnpm` is recommended for reproducible installs.

## Scripts

- `pnpm dev` — start the Next.js dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint

## Project layout

- `app/` — App Router pages (`/`, `/search`, `/album/[id]`, `/artist/[id]`)
- `components/` — UI components including `audio-player`, `audio-player-provider`, `music-card`, `track-row`
- `lib/music-api.ts` — Audius API client (search, trending, track/artist/album lookups) and Spotify embed helpers
- `lib/types.ts` — shared Audius and app types
- `hooks/` — `use-favorites` and other hooks

## Contributing

Issues and pull requests are welcome. For bug reports, please include reproduction steps and the browser / Node version you're using.

## Built with v0

This repository is linked to a [v0](https://v0.app) project — start new chats there to make changes, and v0 will push commits directly to this repo. Every merge to `main` automatically deploys.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Q9KG0k7LKGg0ia0QmeBtU1OK6xV3)

<a href="https://v0.app/chat/api/kiro/clone/KGECMD/Wavesound-Music-player" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
