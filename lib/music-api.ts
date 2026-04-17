import type { Track, Album, Artist, MusicItem } from './types'

/**
 * Monochrome / Hi-Fi API client.
 *
 * The Hi-Fi API is a community-hosted Tidal wrapper that exposes
 * /search, /artist, /album, /playlist, /track, /cover, etc.
 * See: https://github.com/monochrome-music/hifi-api-workers
 *      https://github.com/uimaxbai/hifi-api
 *
 * All IDs returned by this module are *numeric strings* for tracks,
 * albums, and artists (Tidal uses integer IDs) and *UUID strings*
 * for playlists. The app's existing `id: string` typing handles both
 * without changes.
 */

// Primary then fallback API instances. Each one exposes the same endpoints.
const HIFI_API_BASES = [
  'https://api.monochrome.tf',
  'https://monochrome-api.samidy.com',
  'https://hifi.geeked.wtf',
] as const

const PLACEHOLDER_ARTWORK = '/placeholder-album.jpg'

// Tidal editorial playlists used to populate the home feed.
// TIDAL's Top Hits (141 tracks, updated weekly, popularity 90):
const TRENDING_PLAYLIST_ID = 'edf3b7d2-cb42-41d7-93c0-afa2a395521b'
// Indie Circus: Best New Indie — used as an "underground" feed:
const UNDERGROUND_PLAYLIST_ID = 'c3163d0a-b486-4003-987c-cd05a60b6763'

// Genres used by the hero pills and the /search page. These are plain
// query strings that the Hi-Fi /search?s= endpoint handles naturally.
// The constant is still named AUDIUS_GENRES so the rest of the app
// does not need to change imports.
export const AUDIUS_GENRES = [
  'Electronic',
  'Hip-Hop/Rap',
  'Pop',
  'Rock',
  'Dance',
  'Indie',
  'R&B/Soul',
  'Jazz',
  'Country',
  'Classical',
  'Latin',
  'Folk',
  'Metal',
  'Reggae',
  'Ambient',
  'Lo-Fi',
]

/* --------------------------- HTTP + image helpers --------------------------- */

interface FetchOptions {
  timeoutMs?: number
  revalidate?: number
}

async function hifiFetch<T>(path: string, params: Record<string, string | number | undefined> = {}, opts: FetchOptions = {}): Promise<T | null> {
  const { timeoutMs = 10_000, revalidate = 300 } = opts
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}` !== '') query.set(k, `${v}`)
  }
  const qs = query.toString()

  let lastError: unknown = null
  for (const base of HIFI_API_BASES) {
    const url = `${base}${path}${qs ? `?${qs}` : ''}`
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          next: { revalidate },
          headers: { accept: 'application/json' },
        })
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} from ${base}${path}`)
          continue
        }
        return (await res.json()) as T
      } finally {
        clearTimeout(timer)
      }
    } catch (err) {
      lastError = err
      continue
    }
  }
  if (lastError) console.error('[music-api] all Hi-Fi bases failed for', path, lastError)
  return null
}

/**
 * Tidal image UUIDs look like "f457f1ce-c464-4ab4-a74c-af5a181c6649" and
 * the CDN wants the dashes replaced with slashes:
 *   https://resources.tidal.com/images/f457/f1ce/c464/4ab4/a74c/af5a181c6649/640x640.jpg
 */
function buildTidalImage(slug: string | null | undefined, size: '80x80' | '320x320' | '640x640' | '750x750' | '1280x1280' = '640x640'): string {
  if (!slug) return PLACEHOLDER_ARTWORK
  return `https://resources.tidal.com/images/${slug.replaceAll('-', '/')}/${size}.jpg`
}

/* ------------------------- Tidal -> app type mappers ------------------------ */

interface TidalArtistRef {
  id: number | string
  name: string
  handle?: string | null
  picture?: string | null
}

interface TidalAlbumRef {
  id: number | string
  title: string
  cover?: string | null
}

interface TidalTrackPayload {
  id: number | string
  title: string
  duration: number
  popularity?: number
  url?: string
  artist?: TidalArtistRef | null
  artists?: TidalArtistRef[]
  album?: TidalAlbumRef | null
}

interface TidalAlbumPayload {
  id: number | string
  title: string
  cover?: string | null
  numberOfTracks?: number
  duration?: number
  releaseDate?: string
  copyright?: string
  artist?: TidalArtistRef | null
  artists?: TidalArtistRef[]
  items?: Array<{ item?: TidalTrackPayload; type?: string } | TidalTrackPayload>
  description?: string
}

interface TidalArtistPayload {
  id: number | string
  name: string
  picture?: string | null
  popularity?: number
  url?: string
  selectedAlbumCoverFallback?: string | null
}

function primaryArtistOf(payload: { artist?: TidalArtistRef | null; artists?: TidalArtistRef[] } | undefined): TidalArtistRef | null {
  if (!payload) return null
  if (payload.artist) return payload.artist
  if (payload.artists && payload.artists.length) return payload.artists[0]
  return null
}

function tidalTrackToTrack(track: TidalTrackPayload): Track {
  const artist = primaryArtistOf(track)
  return {
    id: String(track.id),
    name: track.title,
    artistName: artist?.name ?? 'Unknown Artist',
    artistId: artist?.id != null ? String(artist.id) : '',
    artworkUrl: buildTidalImage(track.album?.cover, '640x640'),
    duration: track.duration,
    playCount: track.popularity,
    source: 'hifi',
  }
}

function tidalTrackToMusicItem(track: TidalTrackPayload): MusicItem {
  const t = tidalTrackToTrack(track)
  return {
    id: t.id,
    type: 'track',
    name: t.name,
    artistName: t.artistName,
    artistId: t.artistId,
    artworkUrl: t.artworkUrl,
    duration: t.duration,
    playCount: t.playCount,
    source: 'hifi',
  }
}

function tidalAlbumToMusicItem(album: TidalAlbumPayload): MusicItem {
  const artist = primaryArtistOf(album)
  return {
    id: String(album.id),
    type: 'album',
    name: album.title,
    artistName: artist?.name ?? 'Various Artists',
    artistId: artist?.id != null ? String(artist.id) : '',
    artworkUrl: buildTidalImage(album.cover, '640x640'),
    trackCount: album.numberOfTracks,
    duration: album.duration,
    source: 'hifi',
  }
}

function tidalArtistRefToMusicItem(artist: TidalArtistRef): MusicItem {
  return {
    id: String(artist.id),
    type: 'artist',
    name: artist.name,
    artistName: artist.name,
    artistId: String(artist.id),
    artworkUrl: buildTidalImage(artist.picture, '640x640'),
    source: 'hifi',
  }
}

/* ---------------------------------- Home ---------------------------------- */

interface PlaylistResponse {
  playlist: { title?: string; numberOfTracks?: number; image?: string | null; squareImage?: string | null }
  items: Array<{ item?: TidalTrackPayload; type?: string } | TidalTrackPayload>
}

async function fetchPlaylistTracks(playlistId: string, limit: number): Promise<MusicItem[]> {
  const res = await hifiFetch<PlaylistResponse>('/playlist/', { id: playlistId, limit })
  if (!res) return []
  const items = Array.isArray(res.items) ? res.items : []
  return items
    .map((entry) => (entry && typeof entry === 'object' && 'item' in entry && entry.item ? entry.item : (entry as TidalTrackPayload)))
    .filter((t): t is TidalTrackPayload => !!t && !!t.id && !!t.title)
    .slice(0, limit)
    .map(tidalTrackToMusicItem)
}

interface SearchResponse {
  data: {
    items?: TidalTrackPayload[]
    artists?: { items: TidalArtistPayload[] }
    albums?: { items: TidalAlbumPayload[] }
    tracks?: { items: TidalTrackPayload[] }
    playlists?: { items: unknown[] }
  }
}

async function searchTracksByQuery(query: string, limit: number): Promise<MusicItem[]> {
  const res = await hifiFetch<SearchResponse>('/search/', { s: query, limit })
  const items = res?.data?.items ?? []
  return items.slice(0, limit).map(tidalTrackToMusicItem)
}

export async function getTrendingTracks(genre?: string, limit: number = 20): Promise<MusicItem[]> {
  if (genre) {
    return searchTracksByQuery(genre, limit)
  }
  const tracks = await fetchPlaylistTracks(TRENDING_PLAYLIST_ID, limit)
  if (tracks.length > 0) return tracks
  // Fallback if the playlist is unavailable: search "top hits".
  return searchTracksByQuery('top hits', limit)
}

export async function getUndergroundTrending(limit: number = 20): Promise<MusicItem[]> {
  const tracks = await fetchPlaylistTracks(UNDERGROUND_PLAYLIST_ID, limit)
  if (tracks.length > 0) return tracks
  return searchTracksByQuery('indie new', limit)
}

/* --------------------------------- Search --------------------------------- */

export async function searchMusic(query: string): Promise<{ tracks: MusicItem[]; artists: MusicItem[]; albums: MusicItem[] }> {
  const trimmed = query.trim()
  if (!trimmed) return { tracks: [], artists: [], albums: [] }

  const [tracksRes, artistsRes, albumsRes] = await Promise.all([
    hifiFetch<SearchResponse>('/search/', { s: trimmed, limit: 25 }),
    hifiFetch<SearchResponse>('/search/', { a: trimmed, limit: 25 }),
    hifiFetch<SearchResponse>('/search/', { al: trimmed, limit: 25 }),
  ])

  const tracks = (tracksRes?.data?.items ?? []).slice(0, 20).map(tidalTrackToMusicItem)
  const artists = (artistsRes?.data?.artists?.items ?? []).slice(0, 20).map(tidalArtistRefToMusicItem)
  const albums = (albumsRes?.data?.albums?.items ?? []).slice(0, 20).map(tidalAlbumToMusicItem)

  return { tracks, artists, albums }
}

/* --------------------------------- Artist --------------------------------- */

interface ArtistDetailResponse {
  artist: TidalArtistPayload & { picture?: string | null }
  cover: { '750'?: string } | null
}

interface ArtistReleasesResponse {
  albums: { items: TidalAlbumPayload[] }
  tracks: TidalTrackPayload[]
}

export async function getArtistById(userId: string): Promise<Artist | null> {
  const numericId = Number.parseInt(userId, 10)
  if (!Number.isFinite(numericId) || numericId <= 0) return null

  const [detailRes, releasesRes] = await Promise.all([
    hifiFetch<ArtistDetailResponse>('/artist/', { id: numericId }),
    hifiFetch<ArtistReleasesResponse>('/artist/', { f: numericId, skip_tracks: 'true' }),
  ])

  const detail = detailRes?.artist
  if (!detail) return null

  const picture = detail.picture ?? detail.selectedAlbumCoverFallback ?? null
  const albumItems = releasesRes?.albums?.items ?? []
  const topTracksItems = releasesRes?.tracks ?? []

  const albums: Album[] = albumItems.map((a) => ({
    id: String(a.id),
    name: a.title,
    artistName: detail.name,
    artistId: String(detail.id),
    artworkUrl: buildTidalImage(a.cover, '640x640'),
    trackCount: a.numberOfTracks ?? 0,
    tracks: [],
    source: 'hifi',
  }))

  const topTracks: Track[] = topTracksItems.map(tidalTrackToTrack)

  return {
    id: String(detail.id),
    name: detail.name,
    artworkUrl: buildTidalImage(picture, '640x640'),
    coverUrl: buildTidalImage(picture, '1280x1280'),
    trackCount: topTracks.length,
    topTracks,
    albums,
    source: 'hifi',
  }
}

/* ---------------------------------- Album --------------------------------- */

interface AlbumDetailResponse {
  data: TidalAlbumPayload
}

export async function getAlbumById(albumId: string): Promise<Album | null> {
  const numericId = Number.parseInt(albumId, 10)
  if (!Number.isFinite(numericId) || numericId <= 0) return null

  const res = await hifiFetch<AlbumDetailResponse>('/album/', { id: numericId, limit: 200 })
  const data = res?.data
  if (!data) return null

  const artist = primaryArtistOf(data)
  const rawItems = Array.isArray(data.items) ? data.items : []
  const tracks: Track[] = rawItems
    .map((entry) => (entry && typeof entry === 'object' && 'item' in entry && entry.item ? entry.item : (entry as TidalTrackPayload)))
    .filter((t): t is TidalTrackPayload => !!t && !!t.id && !!t.title)
    .map((t) => {
      const mapped = tidalTrackToTrack(t)
      // Album pages hide artwork per track (showArtwork={false}), but we still
      // set it to the album cover so the player shows it if one is played later.
      return {
        ...mapped,
        artworkUrl: buildTidalImage(data.cover, '640x640'),
      }
    })

  return {
    id: String(data.id),
    name: data.title,
    artistName: artist?.name ?? 'Various Artists',
    artistId: artist?.id != null ? String(artist.id) : '',
    artworkUrl: buildTidalImage(data.cover, '640x640'),
    trackCount: data.numberOfTracks ?? tracks.length,
    tracks,
    description: data.copyright,
    source: 'hifi',
  }
}

/* ---------------------------- misc / compat helpers ----------------------- */

export async function getTrackById(_trackId: string): Promise<Track | null> {
  // Not used by the UI; keeping the export so nothing that imported it breaks.
  return null
}

export function getSpotifyEmbedUrl(spotifyUri: string): string {
  const trackId = spotifyUri.replace('spotify:track:', '')
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`
}

export function getSpotifyTrackUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`
}
