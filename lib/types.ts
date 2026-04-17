// Supported audio sources
export type MusicSource = 'monochrome' | 'dab'

export interface Track {
  id: string
  name: string
  artistName: string
  artistId: string
  albumId?: string
  albumName?: string
  artworkUrl: string
  streamUrl?: string
  duration?: number
  trackNumber?: number
  explicit?: boolean
  popularity?: number
  audioQuality?: string
  isHiRes?: boolean
  releaseDate?: string
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
  description?: string
  releaseDate?: string
  audioQuality?: string
  isHiRes?: boolean
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
  type: 'track' | 'album' | 'artist'
  name: string
  artistName: string
  artistId?: string
  albumId?: string
  artworkUrl: string
  streamUrl?: string
  duration?: number
  popularity?: number
  isHiRes?: boolean
  trackCount?: number
  source: MusicSource
}

export interface SearchResults {
  tracks: MusicItem[]
  artists: MusicItem[]
  albums: MusicItem[]
}
