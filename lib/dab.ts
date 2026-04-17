// Dab Music API client (server-side only).
// Mirrors the approach used in KGECMD/Freedify/app/dab_service.py.
//
// DAB sits behind Cloudflare, so an authenticated `session` cookie and
// `visitor_id` cookie are required to make requests succeed. When the
// env vars below are not present, these helpers degrade to `null`/`[]`.
// Note: this module should only be invoked from server-side code paths
// (Route Handlers, Server Components, or via the `isServer()` check in
// lib/music-api.ts). It reads from `process.env` for DAB credentials.
import type { Album, Artist, MusicItem, Track } from './types'

const DAB_BASE_URL = 'https://dabmusic.xyz/api'
const DAB_FETCH_TIMEOUT_MS = 10000

function buildHeaders(): HeadersInit | null {
  const session = process.env.DAB_SESSION ?? ''
  const visitor = process.env.DAB_VISITOR_ID ?? ''
  if (!session) {
    return null
  }
  const cookieParts = [`session=${session}`]
  if (visitor) cookieParts.push(`visitor_id=${visitor}`)
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://dabmusic.xyz/',
    Origin: 'https://dabmusic.xyz',
    Accept: 'application/json, text/plain, */*',
    Cookie: cookieParts.join('; '),
  }
}

export function dabConfigured(): boolean {
  return !!process.env.DAB_SESSION
}

async function dabFetch(path: string): Promise<Response | null> {
  const headers = buildHeaders()
  if (!headers) return null
  const url = `${DAB_BASE_URL}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DAB_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' })
    return res
  } catch (err) {
    console.error('[dab] request failed:', err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---------- Normalizers ----------

function dabCover(raw: any, albumInfo?: any): string {
  const images = raw?.images
  if (images && typeof images === 'object') {
    return images.large || images.medium || images.small || ''
  }
  if (typeof raw?.cover === 'string') return raw.cover
  if (typeof raw?.albumCover === 'string') return raw.albumCover
  if (raw?.album?.cover) return raw.album.cover
  if (albumInfo?.images?.large) return albumInfo.images.large
  if (albumInfo?.cover) return albumInfo.cover
  return ''
}

function dabArtist(raw: any, albumInfo?: any): { name: string; id: string } {
  const artist = raw?.artist ?? albumInfo?.artist
  if (Array.isArray(artist) && artist.length > 0) {
    return { name: artist[0]?.name ?? '', id: artist[0]?.id ? `dab_${artist[0].id}` : '' }
  }
  if (artist && typeof artist === 'object') {
    return { name: artist.name ?? '', id: artist.id ? `dab_${artist.id}` : '' }
  }
  return { name: typeof artist === 'string' ? artist : raw?.artistName ?? '', id: '' }
}

function normalizeDabTrack(raw: any, albumInfo?: any): Track {
  const artist = dabArtist(raw, albumInfo)
  const audioQuality = raw?.audioQuality ?? {}
  return {
    id: `dab_${raw.id}`,
    name: raw.title ?? 'Unknown Track',
    artistName: artist.name || 'Unknown Artist',
    artistId: artist.id,
    albumId: raw.albumId ? `dab_${raw.albumId}` : albumInfo?.id ? `dab_${albumInfo.id}` : undefined,
    albumName: raw.albumTitle ?? raw.album?.title ?? albumInfo?.title,
    artworkUrl: dabCover(raw, albumInfo),
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    trackNumber: raw.trackNumber,
    explicit: raw.explicit,
    audioQuality: typeof audioQuality === 'string' ? audioQuality : 'LOSSLESS',
    isHiRes: !!audioQuality?.isHiRes,
    releaseDate: raw.releaseDate ?? raw.release_date ?? albumInfo?.releaseDate,
    source: 'dab',
  }
}

function normalizeDabAlbum(raw: any): Album {
  const artist = dabArtist(raw)
  const audioQuality = raw?.audioQuality ?? {}
  return {
    id: `dab_${raw.id}`,
    name: raw.title ?? 'Unknown Album',
    artistName: artist.name || 'Unknown Artist',
    artistId: artist.id,
    artworkUrl: dabCover(raw),
    trackCount: raw.trackCount ?? raw.tracksCount ?? 0,
    tracks: [],
    releaseDate: raw.releaseDate ?? raw.release_date ?? raw.date,
    isHiRes: !!audioQuality?.isHiRes,
    source: 'dab',
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

// ---------- Public API ----------

export async function dabSearchTracks(query: string, limit = 20): Promise<MusicItem[]> {
  const q = query.trim()
  if (!q) return []
  const res = await dabFetch(
    `/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`,
  )
  if (!res || !res.ok) return []
  try {
    const data = await res.json()
    const items: any[] = Array.isArray(data?.tracks) ? data.tracks : []
    return items
      .filter((x) => x && typeof x === 'object')
      .map((t) => trackToItem(normalizeDabTrack(t)))
  } catch {
    return []
  }
}

export async function dabSearchAlbums(query: string, limit = 10): Promise<MusicItem[]> {
  const q = query.trim()
  if (!q) return []
  const res = await dabFetch(
    `/search?q=${encodeURIComponent(q)}&type=album&limit=${limit}`,
  )
  if (!res || !res.ok) return []
  try {
    const data = await res.json()
    const items: any[] = Array.isArray(data?.albums) ? data.albums : []
    return items
      .filter((x) => x && typeof x === 'object')
      .map((a) => albumToItem(normalizeDabAlbum(a)))
  } catch {
    return []
  }
}

export async function dabGetAlbum(id: string): Promise<Album | null> {
  const cleanId = id.replace(/^dab_/, '')
  let res = await dabFetch(`/getAlbum?albumId=${encodeURIComponent(cleanId)}`)
  if (!res || !res.ok) {
    res = await dabFetch(`/album?albumId=${encodeURIComponent(cleanId)}`)
  }
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    const albumData = data?.album ?? data
    const album = normalizeDabAlbum(albumData)
    let rawTracks: any[] = []
    if (Array.isArray(albumData?.tracks)) rawTracks = albumData.tracks
    else if (Array.isArray(albumData?.tracks?.items)) rawTracks = albumData.tracks.items
    album.tracks = rawTracks.map((t: any) => normalizeDabTrack(t, albumData))
    if (!album.trackCount && album.tracks.length) album.trackCount = album.tracks.length
    return album
  } catch {
    return null
  }
}

export async function dabGetTrack(id: string): Promise<Track | null> {
  const cleanId = id.replace(/^dab_/, '')
  let res = await dabFetch(`/getTrack?trackId=${encodeURIComponent(cleanId)}`)
  if (!res || !res.ok) {
    res = await dabFetch(`/track?trackId=${encodeURIComponent(cleanId)}`)
  }
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    const trackData = data?.track ?? data
    return normalizeDabTrack(trackData)
  } catch {
    return null
  }
}

export async function dabGetStreamUrl(id: string, quality = '27'): Promise<string | null> {
  const cleanId = id.replace(/^dab_/, '')
  const res = await dabFetch(
    `/stream?trackId=${encodeURIComponent(cleanId)}&quality=${encodeURIComponent(quality)}`,
  )
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    return typeof data?.url === 'string' ? data.url : null
  } catch {
    return null
  }
}

// DAB does not expose an artist endpoint that matches our shape, so we map
// an artist-id back to search results for that artist's name. Consumers
// should prefer Monochrome for artist pages.
export async function dabGetArtist(_id: string): Promise<Artist | null> {
  return null
}
