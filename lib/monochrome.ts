// Monochrome / Tidal-compatible proxy client (server-side only).
// Mirrors the approach used in KGECMD/monochrome (js/api.js, js/storage.js).
// Note: this module should only be invoked from server-side code paths
// (Route Handlers, Server Components, or via the `isServer()` check in
// lib/music-api.ts).
import type { Album, Artist, MusicItem, Track } from './types'

// Default Monochrome/Tidal-proxy instances. These are public mirrors that
// historically respond with a `{version, data|artist|albums|...}` envelope.
export const DEFAULT_MONOCHROME_INSTANCES = [
  'https://wolf.qqdl.site',
  'https://maus.qqdl.site',
  'https://vogel.qqdl.site',
  'https://katze.qqdl.site',
  'https://hund.qqdl.site',
  'https://tidal.401658.xyz',
  'https://ohio.monochrome.tf',
  'https://virginia.monochrome.tf',
  'https://oregon.monochrome.tf',
  'https://california.monochrome.tf',
  'https://frankfurt.monochrome.tf',
  'https://singapore.monochrome.tf',
  'https://tokyo.monochrome.tf',
  'https://jakarta.monochrome.tf',
]

function getInstances(): string[] {
  const override = process.env.MONOCHROME_INSTANCES
  if (override && override.trim().length > 0) {
    return override
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean)
  }
  return DEFAULT_MONOCHROME_INSTANCES
}

const FETCH_TIMEOUT_MS = 7000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timer)
  }
}

// Try each instance in order and return the first JSON response that matches
// the caller's shape check (if provided).
async function fetchJsonFromInstances<T>(
  path: string,
  validate?: (json: unknown) => boolean,
): Promise<T> {
  let lastError: unknown = null
  for (const base of getInstances()) {
    const url = `${base}${path}`
    try {
      const res = await fetchWithTimeout(url)
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`)
        continue
      }
      const json = (await res.json()) as unknown
      if (validate && !validate(json)) {
        lastError = new Error(`Unexpected response shape from ${url}`)
        continue
      }
      return json as T
    } catch (err) {
      lastError = err
      continue
    }
  }
  throw lastError ?? new Error('All Monochrome instances failed')
}

// ---------- Response helpers ----------

interface MonoEnvelope {
  version?: string
  data?: unknown
  artist?: unknown
  albums?: unknown
  tracks?: unknown
  cover?: unknown
}

function unwrap(json: MonoEnvelope): any {
  // Tidal-compatible proxies wrap payloads under "data", but search/artist
  // endpoints sometimes return `{artist, cover}` or `{albums, tracks}`.
  if (json?.data !== undefined) return json.data
  return json
}

export function coverUrl(id: string | undefined | null, size: 80 | 160 | 320 | 640 | 1280 = 640): string {
  if (!id) return ''
  const formatted = String(id).replace(/-/g, '/')
  return `https://resources.tidal.com/images/${formatted}/${size}x${size}.jpg`
}

// ---------- Normalizers ----------

function normalizeTrack(raw: any, albumFallback?: any): Track {
  const artist = raw.artist ?? raw.artists?.[0] ?? {}
  const album = raw.album ?? albumFallback ?? {}
  return {
    id: `mono_${raw.id}`,
    name: raw.title ?? 'Unknown Track',
    artistName: artist?.name ?? 'Unknown Artist',
    artistId: artist?.id ? `mono_${artist.id}` : '',
    albumId: album?.id ? `mono_${album.id}` : undefined,
    albumName: album?.title,
    artworkUrl: coverUrl(album?.cover),
    duration: raw.duration,
    trackNumber: raw.trackNumber,
    explicit: raw.explicit,
    popularity: raw.popularity,
    audioQuality: raw.audioQuality,
    isHiRes: raw?.mediaMetadata?.tags?.includes?.('HIRES_LOSSLESS') ?? false,
    releaseDate: raw.streamStartDate ?? raw.releaseDate,
    source: 'monochrome',
  }
}

function normalizeAlbum(raw: any): Album {
  const artist = raw.artist ?? raw.artists?.[0] ?? {}
  return {
    id: `mono_${raw.id}`,
    name: raw.title ?? 'Unknown Album',
    artistName: artist?.name ?? 'Unknown Artist',
    artistId: artist?.id ? `mono_${artist.id}` : '',
    artworkUrl: coverUrl(raw.cover),
    trackCount: raw.numberOfTracks ?? 0,
    tracks: [],
    releaseDate: raw.releaseDate,
    audioQuality: raw.audioQuality,
    isHiRes: raw?.mediaMetadata?.tags?.includes?.('HIRES_LOSSLESS') ?? false,
    source: 'monochrome',
  }
}

function normalizeArtist(raw: any): Artist {
  return {
    id: `mono_${raw.id}`,
    name: raw.name ?? 'Unknown Artist',
    artworkUrl: coverUrl(raw.picture, 640),
    coverUrl: coverUrl(raw.picture, 1280),
    isVerified: false,
    topTracks: [],
    albums: [],
    source: 'monochrome',
  }
}

function trackToItem(t: Track): MusicItem {
  return {
    id: t.id,
    type: 'track',
    name: t.name,
    artistName: t.artistName,
    artistId: t.artistId,
    albumId: t.albumId,
    artworkUrl: t.artworkUrl,
    streamUrl: t.streamUrl,
    duration: t.duration,
    popularity: t.popularity,
    isHiRes: t.isHiRes,
    source: t.source,
  }
}

function albumToItem(a: Album): MusicItem {
  return {
    id: a.id,
    type: 'album',
    name: a.name,
    artistName: a.artistName,
    artistId: a.artistId,
    artworkUrl: a.artworkUrl,
    trackCount: a.trackCount,
    isHiRes: a.isHiRes,
    source: a.source,
  }
}

function artistToItem(ar: Artist): MusicItem {
  return {
    id: ar.id,
    type: 'artist',
    name: ar.name,
    artistName: ar.name,
    artistId: ar.id,
    artworkUrl: ar.artworkUrl || '',
    source: ar.source,
  }
}

// ---------- Public API ----------

export async function monoSearchTracks(query: string, limit = 20): Promise<MusicItem[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const json = await fetchJsonFromInstances<MonoEnvelope>(
      `/search/?s=${encodeURIComponent(q)}`,
    )
    const data = unwrap(json)
    const items: any[] = data?.items ?? data?.tracks?.items ?? []
    return items
      .slice(0, limit)
      .map((raw) => trackToItem(normalizeTrack(raw)))
  } catch (err) {
    console.error('[monochrome] searchTracks failed:', err)
    return []
  }
}

export async function monoSearchArtists(query: string, limit = 20): Promise<MusicItem[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const json = await fetchJsonFromInstances<MonoEnvelope>(
      `/search/?a=${encodeURIComponent(q)}`,
    )
    const data = unwrap(json)
    const items: any[] = data?.items ?? data?.artists?.items ?? []
    return items
      .slice(0, limit)
      .map((raw) => artistToItem(normalizeArtist(raw)))
  } catch (err) {
    console.error('[monochrome] searchArtists failed:', err)
    return []
  }
}

export async function monoSearchAlbums(query: string, limit = 20): Promise<MusicItem[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const json = await fetchJsonFromInstances<MonoEnvelope>(
      `/search/?al=${encodeURIComponent(q)}`,
    )
    const data = unwrap(json)
    const items: any[] = data?.items ?? data?.albums?.items ?? []
    return items
      .slice(0, limit)
      .map((raw) => albumToItem(normalizeAlbum(raw)))
  } catch (err) {
    console.error('[monochrome] searchAlbums failed:', err)
    return []
  }
}

export async function monoGetAlbum(id: string): Promise<Album | null> {
  const cleanId = id.replace(/^mono_/, '')
  try {
    const json = await fetchJsonFromInstances<MonoEnvelope>(`/album/?id=${encodeURIComponent(cleanId)}`)
    const entries = Array.isArray(json) ? json : [json]
    let album: Album | null = null
    const tracks: Track[] = []
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const data = unwrap(entry as MonoEnvelope)
      if (!album && data && 'numberOfTracks' in data) {
        album = normalizeAlbum(data)
      }
      if (Array.isArray(data?.items)) {
        for (const itemWrapper of data.items) {
          const t = itemWrapper.item ?? itemWrapper
          tracks.push(normalizeTrack(t, album ?? undefined))
        }
      }
    }
    if (!album) return null
    album.tracks = tracks
    return album
  } catch (err) {
    console.error('[monochrome] getAlbum failed:', err)
    return null
  }
}

export async function monoGetArtist(id: string): Promise<Artist | null> {
  const cleanId = id.replace(/^mono_/, '')
  try {
    const [primary, content] = await Promise.all([
      fetchJsonFromInstances<MonoEnvelope>(`/artist/?id=${encodeURIComponent(cleanId)}`),
      fetchJsonFromInstances<MonoEnvelope>(`/artist/?f=${encodeURIComponent(cleanId)}`),
    ])
    const artistRaw = (primary as any)?.artist ?? unwrap(primary)
    if (!artistRaw) return null
    const artist = normalizeArtist(artistRaw)

    const contentEntries = Array.isArray(content) ? content : [content]
    const albumsMap = new Map<string, Album>()
    const tracksMap = new Map<string, Track>()
    for (const entry of contentEntries) {
      if (!entry) continue
      const albumItems: any[] = (entry as any).albums?.items ?? []
      for (const a of albumItems) {
        const alb = normalizeAlbum(a)
        if (!albumsMap.has(alb.id)) albumsMap.set(alb.id, alb)
      }
      const trackItems: any[] = (entry as any).tracks?.items ?? []
      for (const t of trackItems) {
        const track = normalizeTrack(t)
        if (!tracksMap.has(track.id)) tracksMap.set(track.id, track)
      }
    }

    artist.albums = Array.from(albumsMap.values()).slice(0, 24)
    artist.topTracks = Array.from(tracksMap.values()).slice(0, 10)
    artist.trackCount = tracksMap.size
    return artist
  } catch (err) {
    console.error('[monochrome] getArtist failed:', err)
    return null
  }
}

function decodeManifestUrl(manifest: string): string | null {
  try {
    const decoded = Buffer.from(manifest, 'base64').toString('utf-8')
    try {
      const parsed = JSON.parse(decoded)
      if (Array.isArray(parsed?.urls) && parsed.urls[0]) return parsed.urls[0]
    } catch {
      const match = decoded.match(/https?:\/\/[^"\s]+/)
      return match ? match[0] : null
    }
  } catch {
    return null
  }
  return null
}

export async function monoGetStreamUrl(id: string, quality = 'LOSSLESS'): Promise<string | null> {
  const cleanId = id.replace(/^mono_/, '')
  try {
    const json = await fetchJsonFromInstances<MonoEnvelope>(
      `/track/?id=${encodeURIComponent(cleanId)}&quality=${encodeURIComponent(quality)}`,
    )
    const entries = Array.isArray(json) ? json : [json]
    let originalTrackUrl: string | null = null
    let manifest: string | null = null
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const data = unwrap(entry as MonoEnvelope)
      if (!originalTrackUrl && typeof (data as any)?.OriginalTrackUrl === 'string') {
        originalTrackUrl = (data as any).OriginalTrackUrl
      }
      if (!manifest && typeof (data as any)?.manifest === 'string') {
        manifest = (data as any).manifest
      }
    }
    if (originalTrackUrl) return originalTrackUrl
    if (manifest) return decodeManifestUrl(manifest)
    return null
  } catch (err) {
    console.error('[monochrome] getStreamUrl failed:', err)
    return null
  }
}
