// Domain types for the music player. All IDs are serialized as strings for
// React/URL convenience, even though the upstream Tidal proxy uses numbers.

export type StreamQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES_LOSSLESS'

export const QUALITY_LABELS: Record<StreamQuality, string> = {
  LOW: 'Low (AAC 96)',
  HIGH: 'High (AAC 320)',
  LOSSLESS: 'Lossless (FLAC)',
  HI_RES_LOSSLESS: 'Hi-Res (FLAC 24-bit)',
}

export type MusicSource = 'tidal'

export interface Track {
  id: string
  name: string
  artistName: string
  artistId: string
  albumId?: string
  artworkUrl: string
  duration?: number
  explicit?: boolean
  quality?: string // reported audio quality e.g. "LOSSLESS"
  source: MusicSource
}

export interface Album {
  id: string
  name: string
  artistName: string
  artistId: string
  artworkUrl: string
  trackCount: number
  tracks: Track[]
  releaseDate?: string
  description?: string
  source: MusicSource
}

export interface Artist {
  id: string
  name: string
  handle?: string
  artworkUrl?: string
  coverUrl?: string
  bio?: string
  followerCount?: number
  trackCount?: number
  isVerified?: boolean
  topTracks: Track[]
  albums: Album[]
  source: MusicSource
}

export interface MusicItem {
  id: string
  type: 'track' | 'album' | 'artist' | 'playlist'
  name: string
  artistName: string
  artistId?: string
  albumId?: string
  artworkUrl: string
  duration?: number
  trackCount?: number
  source: MusicSource
}

export interface StreamResolution {
  url: string
  mimeType: string
  quality: StreamQuality
  codecs?: string
}
