// High-level music API used by pages and client components.
//
// Primary backend: Monochrome (Tidal-compatible proxies like wolf.qqdl.site)
// Secondary:       Dab Music (dabmusic.xyz) — only when DAB_SESSION is set
//
// Both backends are accessed from the server (see lib/monochrome.ts, lib/dab.ts).
// The client talks to /api/* routes defined under app/api/.

import type { Album, Artist, MusicItem, SearchResults } from './types'

const GENRE_QUERIES: Record<string, string> = {
  all: 'top hits',
  pop: 'pop hits',
  rock: 'classic rock',
  'hip-hop': 'hip hop',
  electronic: 'electronic dance',
  jazz: 'jazz classics',
  'r-b-soul': 'r&b soul',
  country: 'country hits',
  classical: 'classical orchestra',
  ambient: 'ambient relaxing',
  indie: 'indie rock',
  metal: 'metal anthems',
  reggae: 'reggae classics',
  folk: 'folk acoustic',
  latin: 'latin hits',
  world: 'world music',
}

export const FEATURED_GENRES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pop', label: 'Pop' },
  { id: 'rock', label: 'Rock' },
  { id: 'hip-hop', label: 'Hip-Hop' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'r-b-soul', label: 'R&B / Soul' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'indie', label: 'Indie' },
  { id: 'classical', label: 'Classical' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'country', label: 'Country' },
  { id: 'metal', label: 'Metal' },
  { id: 'reggae', label: 'Reggae' },
  { id: 'folk', label: 'Folk' },
  { id: 'latin', label: 'Latin' },
  { id: 'world', label: 'World' },
]

function genreQuery(genre: string): string {
  return GENRE_QUERIES[genre] ?? GENRE_QUERIES['all']
}

// ---- Data fetchers ----
// These call lib/monochrome.ts directly when running on the server (React Server
// Components) and fall back to the JSON /api/* routes when running on the
// client (browser).

function isServer(): boolean {
  return typeof window === 'undefined'
}

async function serverSearchMusic(query: string): Promise<SearchResults> {
  const { monoSearchAlbums, monoSearchArtists, monoSearchTracks } = await import('./monochrome')
  const { dabConfigured, dabSearchAlbums, dabSearchTracks } = await import('./dab')
  const [tracks, artists, albums] = await Promise.all([
    monoSearchTracks(query, 20),
    monoSearchArtists(query, 12),
    monoSearchAlbums(query, 12),
  ])
  if (dabConfigured()) {
    const [dabTracks, dabAlbums] = await Promise.all([
      dabSearchTracks(query, 10),
      dabSearchAlbums(query, 6),
    ])
    const trackIds = new Set(tracks.map((t) => t.id))
    const albumIds = new Set(albums.map((a) => a.id))
    for (const t of dabTracks) if (!trackIds.has(t.id)) tracks.push(t)
    for (const a of dabAlbums) if (!albumIds.has(a.id)) albums.push(a)
  }
  return { tracks, artists, albums }
}

async function serverGetTrendingTracks(genre: string, limit = 24): Promise<MusicItem[]> {
  const { monoSearchTracks } = await import('./monochrome')
  const items = await monoSearchTracks(genreQuery(genre), Math.max(limit, 24))
  return items.slice(0, limit)
}

async function serverGetUndergroundTrending(limit = 12): Promise<MusicItem[]> {
  const { monoSearchTracks } = await import('./monochrome')
  const picks = ['underground hip hop', 'lofi chill', 'bedroom pop', 'indie electronic']
  const pick = picks[Math.floor(Math.random() * picks.length)]
  const items = await monoSearchTracks(pick, limit + 4)
  return items.slice(0, limit)
}

async function serverGetAlbumById(id: string): Promise<Album | null> {
  if (id.startsWith('dab_')) {
    const { dabGetAlbum } = await import('./dab')
    return dabGetAlbum(id)
  }
  const { monoGetAlbum } = await import('./monochrome')
  return monoGetAlbum(id)
}

async function serverGetArtistById(id: string): Promise<Artist | null> {
  const { monoGetArtist } = await import('./monochrome')
  return monoGetArtist(id)
}

async function serverGetStreamUrl(id: string): Promise<string | null> {
  if (id.startsWith('dab_')) {
    const { dabGetStreamUrl } = await import('./dab')
    return dabGetStreamUrl(id)
  }
  const { monoGetStreamUrl } = await import('./monochrome')
  return monoGetStreamUrl(id)
}

// ---- Client-side helpers (fetch to /api/*) ----

async function clientJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return (await res.json()) as T
}

// ---- Unified exports ----

export async function searchMusic(query: string): Promise<SearchResults> {
  if (!query.trim()) return { tracks: [], artists: [], albums: [] }
  if (isServer()) return serverSearchMusic(query)
  return clientJson<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`)
}

export async function getTrendingTracks(genre = 'all', limit = 24): Promise<MusicItem[]> {
  if (isServer()) return serverGetTrendingTracks(genre, limit)
  return clientJson<MusicItem[]>(
    `/api/trending?genre=${encodeURIComponent(genre)}&limit=${limit}`,
  )
}

export async function getUndergroundTrending(limit = 12): Promise<MusicItem[]> {
  if (isServer()) return serverGetUndergroundTrending(limit)
  return clientJson<MusicItem[]>(`/api/trending/underground?limit=${limit}`)
}

export async function getAlbumById(id: string): Promise<Album | null> {
  if (isServer()) return serverGetAlbumById(id)
  return clientJson<Album | null>(`/api/album/${encodeURIComponent(id)}`)
}

export async function getArtistById(id: string): Promise<Artist | null> {
  if (isServer()) return serverGetArtistById(id)
  return clientJson<Artist | null>(`/api/artist/${encodeURIComponent(id)}`)
}

export async function getStreamUrl(id: string): Promise<string | null> {
  if (isServer()) return serverGetStreamUrl(id)
  const data = await clientJson<{ url: string | null }>(
    `/api/stream?id=${encodeURIComponent(id)}`,
  )
  return data.url
}

// Metadata about the current backend configuration, for UI/debug.
export const musicAPI = {
  primary: 'Monochrome',
  secondary: 'Dab Music',
  downloadSupport: false,
}
