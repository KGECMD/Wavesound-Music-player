// Client for the community Tidal HiFi proxy (Monochrome / Bini / Geeked etc.).
// Hosts are rotated on failure. See the uptime board for a live list:
//   https://tidal-uptime.jiffy-puffs-1j.workers.dev
// The proxy sends `Access-Control-Allow-Origin: *`, so browser calls work.

import type {
  Album,
  Artist,
  MusicItem,
  StreamQuality,
  StreamResolution,
  Track,
} from './types'

export const API_HOSTS = [
  'https://hifi.geeked.wtf',
  'https://tidal-api.binimum.org',
  'https://eu-central.monochrome.tf',
  'https://us-west.monochrome.tf',
  'https://triton.squid.wtf',
  'https://api.monochrome.tf',
  'https://hifi-two.spotisaver.net',
] as const

export const GENRES = [
  'Pop',
  'Hip-Hop',
  'R&B',
  'Rock',
  'Electronic',
  'Dance',
  'House',
  'Indie',
  'Alternative',
  'Metal',
  'Country',
  'Jazz',
  'Classical',
  'Latin',
  'Reggae',
  'K-Pop',
  'Lo-Fi',
  'Ambient',
  'Soundtrack',
  'Folk',
] as const

// Backwards-compat alias; some earlier pages imported this name.
export const AUDIUS_GENRES = GENRES

// Used by the homepage "Trending" and per-genre sections. The proxy doesn't
// expose Tidal's private trending, so we seed rows with search queries that
// tend to surface popular, recent material.
const HOMEPAGE_QUERIES: Record<string, string> = {
  Trending: 'top hits 2025',
  New: 'new music',
}

// ---------- HTTP core ----------

async function proxyFetch<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const suffix = qs.toString() ? `${path}?${qs.toString()}` : path

  let lastErr: unknown
  for (const host of API_HOSTS) {
    try {
      const res = await fetch(`${host}${suffix}`, {
        // Short revalidation so SSR pages feel snappy but don't serve stale CDN tokens.
        next: { revalidate: 60 },
        headers: { Accept: 'application/json' },
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log('[proxyFetch]', `${host}${suffix}`, '->', res.status)
      }
      if (!res.ok) {
        lastErr = new Error(`${host}${suffix} → HTTP ${res.status}`)
        continue
      }
      const json = (await res.json()) as unknown
      // Community HiFi proxies wrap payloads in { version, data }. Unwrap so
      // callers can read fields off the actual payload directly.
      if (
        json &&
        typeof json === 'object' &&
        'data' in (json as Record<string, unknown>) &&
        'version' in (json as Record<string, unknown>)
      ) {
        return (json as { data: T }).data as T
      }
      return json as T
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[proxyFetch] ERR', `${host}${suffix}`, (err as Error).message)
      }
      lastErr = err
    }
  }
  throw lastErr ?? new Error(`All HiFi proxy hosts failed for ${suffix}`)
}

// Same as proxyFetch but never throws — returns null if everything fails.
// Handy for SSR pages where we'd rather render an empty state than 500.
async function safeProxyFetch<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T | null> {
  try {
    return await proxyFetch<T>(path, params)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[music-api]', path, err)
    }
    return null
  }
}

// ---------- helpers ----------

// Tidal cover IDs look like 8f2d544e-2452-46de-ba70-25498434e2ef. Their CDN
// wants the dashes replaced with slashes.
export function tidalCoverUrl(cover: string | null | undefined, size = 640): string {
  if (!cover) return '/placeholder.jpg'
  const path = cover.replace(/-/g, '/')
  return `https://resources.tidal.com/images/${path}/${size}x${size}.jpg`
}

export function tidalArtistImage(picture: string | null | undefined, size = 480): string {
  if (!picture) return '/placeholder-user.jpg'
  const path = picture.replace(/-/g, '/')
  return `https://resources.tidal.com/images/${path}/${size}x${size}.jpg`
}

function pickTrackArtwork(track: RawTrack, size = 480): string {
  return tidalCoverUrl(track.album?.cover, size)
}

// ---------- raw upstream shapes (just the bits we read) ----------

interface RawArtist {
  id: number | string
  name: string
  picture?: string | null
  handle?: string | null
  type?: string
}

interface RawAlbum {
  id: number | string
  title: string
  cover?: string | null
  releaseDate?: string
  numberOfTracks?: number
  artist?: RawArtist
  artists?: RawArtist[]
}

interface RawTrack {
  id: number | string
  title: string
  duration?: number
  explicit?: boolean
  audioQuality?: string
  album?: RawAlbum
  artist?: RawArtist
  artists?: RawArtist[]
  trackNumber?: number
}

interface SearchResult {
  tracks?: { items?: RawTrack[] }
  artists?: { items?: RawArtist[] }
  albums?: { items?: RawAlbum[] }
  playlists?: { items?: RawPlaylist[] }
  items?: RawTrack[] // /search/?s= shape
  topHit?: unknown
}

interface RawPlaylist {
  uuid?: string
  id?: string
  title: string
  squareImage?: string
  image?: string
  numberOfTracks?: number
  creator?: { id: number | string; name?: string }
}

// ---------- normalizers ----------

function normalizeTrack(raw: RawTrack): Track {
  const primaryArtist = raw.artist || raw.artists?.[0]
  return {
    id: String(raw.id),
    name: raw.title,
    artistName: primaryArtist?.name ?? 'Unknown',
    artistId: primaryArtist ? String(primaryArtist.id) : '',
    albumId: raw.album ? String(raw.album.id) : undefined,
    artworkUrl: pickTrackArtwork(raw),
    duration: raw.duration,
    explicit: raw.explicit,
    quality: raw.audioQuality,
    source: 'tidal',
  }
}

function normalizeAlbum(raw: RawAlbum, tracks: Track[] = []): Album {
  const primaryArtist = raw.artist || raw.artists?.[0]
  return {
    id: String(raw.id),
    name: raw.title,
    artistName: primaryArtist?.name ?? 'Unknown',
    artistId: primaryArtist ? String(primaryArtist.id) : '',
    artworkUrl: tidalCoverUrl(raw.cover),
    trackCount: raw.numberOfTracks ?? tracks.length,
    tracks,
    releaseDate: raw.releaseDate,
    source: 'tidal',
  }
}

function trackToMusicItem(t: Track): MusicItem {
  return {
    id: t.id,
    type: 'track',
    name: t.name,
    artistName: t.artistName,
    artistId: t.artistId,
    albumId: t.albumId,
    artworkUrl: t.artworkUrl,
    duration: t.duration,
    source: 'tidal',
  }
}

function albumToMusicItem(a: RawAlbum): MusicItem {
  const primaryArtist = a.artist || a.artists?.[0]
  return {
    id: String(a.id),
    type: 'album',
    name: a.title,
    artistName: primaryArtist?.name ?? 'Unknown',
    artistId: primaryArtist ? String(primaryArtist.id) : undefined,
    artworkUrl: tidalCoverUrl(a.cover),
    trackCount: a.numberOfTracks,
    source: 'tidal',
  }
}

function artistToMusicItem(a: RawArtist): MusicItem {
  return {
    id: String(a.id),
    type: 'artist',
    name: a.name,
    artistName: a.name,
    artistId: String(a.id),
    artworkUrl: tidalArtistImage(a.picture),
    source: 'tidal',
  }
}

// ---------- public API ----------

// Search tracks via /search/?s=
export async function searchTracks(query: string, limit = 25): Promise<Track[]> {
  if (!query?.trim()) return []
  const data = await safeProxyFetch<SearchResult>('/search/', {
    s: query.trim(),
    limit,
  })
  const items = data?.items || data?.tracks?.items || []
  return items.map(normalizeTrack)
}

// Search artists via /search/?a=  (top-hits ARTISTS,TRACKS)
export async function searchArtists(query: string, limit = 12): Promise<MusicItem[]> {
  if (!query?.trim()) return []
  const data = await safeProxyFetch<SearchResult>('/search/', {
    a: query.trim(),
    limit,
  })
  return (data?.artists?.items || []).map(artistToMusicItem)
}

// Search albums via /search/?al=
export async function searchAlbums(query: string, limit = 20): Promise<MusicItem[]> {
  if (!query?.trim()) return []
  const data = await safeProxyFetch<SearchResult>('/search/', {
    al: query.trim(),
    limit,
  })
  return (data?.albums?.items || []).map(albumToMusicItem)
}

// Combined search used by /search page.
export async function searchMusic(query: string): Promise<{
  tracks: MusicItem[]
  artists: MusicItem[]
  albums: MusicItem[]
}> {
  if (!query?.trim()) {
    return { tracks: [], artists: [], albums: [] }
  }
  const [tracks, artists, albums] = await Promise.all([
    searchTracks(query, 30),
    searchArtists(query, 12),
    searchAlbums(query, 20),
  ])
  return {
    tracks: tracks.map(trackToMusicItem),
    artists,
    albums,
  }
}

// Homepage "trending" — seeded from a curated query list.
export async function getTrendingTracks(
  genre?: string,
  limit = 20,
): Promise<MusicItem[]> {
  const query =
    genre && genre in HOMEPAGE_QUERIES
      ? HOMEPAGE_QUERIES[genre]
      : genre
        ? `${genre} hits`
        : HOMEPAGE_QUERIES.Trending
  const tracks = await searchTracks(query, limit)
  return tracks.map(trackToMusicItem)
}

// Alias used by older homepage code.
export const getUndergroundTrending = async (limit = 15): Promise<MusicItem[]> => {
  const tracks = await searchTracks('indie 2025', limit)
  return tracks.map(trackToMusicItem)
}

// ---------- single-item lookups ----------

export async function getTrackInfo(id: string): Promise<Track | null> {
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return null
  const data = await safeProxyFetch<RawTrack>('/info/', { id: numericId })
  if (!data) return null
  return normalizeTrack(data)
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return null
  const album = await safeProxyFetch<
    RawAlbum & { items?: Array<RawTrack | { item: RawTrack; type?: string }> }
  >('/album/', { id: numericId, limit: 100 })
  if (!album) return null
  // /album/ returns items as [{item: RawTrack, type: "track"}, ...]; unwrap.
  const rawTracks = (album.items ?? [])
    .map((entry): RawTrack | null => {
      if (entry && typeof entry === 'object' && 'item' in entry) {
        return (entry as { item: RawTrack }).item
      }
      return entry as RawTrack
    })
    .filter((t): t is RawTrack => !!t && !!t.id)
  return normalizeAlbum(album, rawTracks.map(normalizeTrack))
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return null

  // Primary call — HiFi proxy returns { version, artist, cover } (not the
  // standard { version, data } envelope), so proxyFetch can't auto-unwrap.
  const meta = await safeProxyFetch<{ artist?: RawArtist; cover?: string }>(
    '/artist/',
    { id: numericId },
  )
  const base = meta?.artist
  if (!base) return null

  // Aggregate call — /artist/?f=<id> returns { version, albums: { items }, tracks: [] }.
  const agg = await safeProxyFetch<{
    albums?: { items?: RawAlbum[] } | RawAlbum[]
    tracks?: RawTrack[]
  }>('/artist/', { f: numericId })
  const albumItems = Array.isArray(agg?.albums)
    ? agg!.albums
    : (agg?.albums?.items ?? [])
  const trackItems = agg?.tracks ?? []

  return {
    id: String(base.id),
    name: base.name,
    handle: base.handle ?? undefined,
    artworkUrl: tidalArtistImage(base.picture, 480),
    coverUrl: tidalArtistImage(base.picture, 1280),
    bio: undefined,
    isVerified: false,
    topTracks: trackItems.slice(0, 10).map(normalizeTrack),
    albums: albumItems.map((a) => normalizeAlbum(a)),
    source: 'tidal',
  }
}

// ---------- recommendations ----------

// Tracks similar to a given track id. Uses Tidal's /recommendations/ endpoint,
// which the HiFi proxy exposes directly.
export async function getRecommendations(
  seedTrackId: string,
  limit = 20,
): Promise<MusicItem[]> {
  const numericId = Number(seedTrackId)
  if (!Number.isFinite(numericId)) return []
  const data = await safeProxyFetch<{ items?: RawTrack[] }>(
    '/recommendations/',
    { id: numericId, limit },
  )
  return (data?.items ?? []).map(normalizeTrack).map(trackToMusicItem)
}

// Artists related to the given artist id.
export async function getSimilarArtists(
  artistId: string,
  limit = 12,
): Promise<MusicItem[]> {
  const numericId = Number(artistId)
  if (!Number.isFinite(numericId)) return []
  const data = await safeProxyFetch<{ items?: RawArtist[] }>(
    '/artist/similar/',
    { id: numericId, limit },
  )
  return (data?.items ?? []).map(artistToMusicItem)
}

// ---------- playback: resolve the actual CDN stream URL ----------

interface TidalPlaybackResponse {
  trackId?: number
  manifestMimeType?: string
  manifest?: string // base64
  audioQuality?: StreamQuality
}

interface DecodedManifest {
  mimeType?: string
  codecs?: string
  urls?: string[]
}

// Safely base64-decode a manifest in both browser (atob) and Node (Buffer).
function decodeBase64(b64: string): string {
  if (typeof atob === 'function') {
    try {
      // atob returns latin-1; convert to utf-8 string via escape/decodeURIComponent dance.
      const raw = atob(b64)
      // Ensure bytes are interpreted as UTF-8.
      try {
        const bytes = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff
        return new TextDecoder().decode(bytes)
      } catch {
        return raw
      }
    } catch {
      /* fall through */
    }
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8')
  }
  throw new Error('No base64 decoder available')
}

// Resolve a playable direct stream URL. Quality falls back if the browser
// can't handle what was asked for.
export async function resolveStream(
  trackId: string,
  quality: StreamQuality = 'LOSSLESS',
): Promise<StreamResolution | null> {
  const numericId = Number(trackId)
  if (!Number.isFinite(numericId)) return null

  const payload = await safeProxyFetch<TidalPlaybackResponse>('/track/', {
    id: numericId,
    quality,
  })
  if (!payload?.manifest) return null

  // Only the BTS mime type (plain urls[]) is playable in <audio>.
  // DASH manifests require an MSE player we don't ship — in that case fall
  // back to a lower quality one level down.
  if (payload.manifestMimeType !== 'application/vnd.tidal.bts') {
    if (quality === 'HI_RES_LOSSLESS') return resolveStream(trackId, 'LOSSLESS')
    if (quality === 'LOSSLESS') return resolveStream(trackId, 'HIGH')
    return null
  }

  try {
    const decoded = JSON.parse(decodeBase64(payload.manifest)) as DecodedManifest
    const url = decoded.urls?.[0]
    if (!url) return null
    return {
      url,
      mimeType: decoded.mimeType || 'audio/flac',
      quality,
      codecs: decoded.codecs,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[music-api] manifest decode failed', err)
    }
    return null
  }
}

// ---------- downloads ----------

// Trigger a client-side download of the currently resolved stream. Falls back
// to opening the URL in a new tab if the browser blocks the CORS fetch.
export async function downloadTrack(track: Track, quality: StreamQuality = 'LOSSLESS'): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const stream = await resolveStream(track.id, quality)
  if (!stream) return false

  const safeName = `${track.artistName} - ${track.name}`
    .replace(/[\\/:*?"<>|]+/g, '_')
    .slice(0, 180)
  const ext =
    stream.codecs === 'flac' || stream.mimeType?.includes('flac') ? 'flac' :
    stream.codecs === 'mp4a.40.2' || stream.mimeType?.includes('mp4') ? 'm4a' :
    'mp3'

  try {
    const res = await fetch(stream.url)
    if (!res.ok) throw new Error(`stream fetch ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `${safeName}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
    return true
  } catch {
    // CORS or network — open the signed URL directly. Browsers will prompt
    // to save it since the response Content-Type is audio/*.
    const a = document.createElement('a')
    a.href = stream.url
    a.download = `${safeName}.${ext}`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return true
  }
}

// Default export kept for historical compatibility.
export const musicAPI = {
  primary: 'Monochrome/HiFi',
  secondary: 'BiniLossless',
  downloadSupport: true,
}
