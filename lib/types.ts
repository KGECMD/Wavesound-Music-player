export interface iTunesResult {
  wrapperType: 'track' | 'collection' | 'artist'
  kind?: string
  artistId: number
  collectionId?: number
  trackId?: number
  artistName: string
  collectionName?: string
  trackName?: string
  collectionCensoredName?: string
  trackCensoredName?: string
  artistViewUrl?: string
  collectionViewUrl?: string
  trackViewUrl?: string
  previewUrl?: string
  artworkUrl30?: string
  artworkUrl60?: string
  artworkUrl100?: string
  collectionPrice?: number
  trackPrice?: number
  releaseDate?: string
  collectionExplicitness?: string
  trackExplicitness?: string
  discCount?: number
  discNumber?: number
  trackCount?: number
  trackNumber?: number
  trackTimeMillis?: number
  country?: string
  currency?: string
  primaryGenreName?: string
  isStreamable?: boolean
}

export interface iTunesSearchResponse {
  resultCount: number
  results: iTunesResult[]
}

export interface MusicItem {
  id: string
  type: 'track' | 'album' | 'artist'
  name: string
  artistName: string
  artworkUrl: string
  previewUrl?: string
  collectionId?: number
  trackCount?: number
  releaseDate?: string
  genre?: string
  duration?: number
}

export interface Album {
  id: string
  name: string
  artistName: string
  artworkUrl: string
  trackCount: number
  releaseDate?: string
  genre?: string
  tracks: Track[]
}

export interface Track {
  id: string
  name: string
  artistName: string
  artworkUrl: string
  previewUrl?: string
  duration?: number
  trackNumber?: number
  albumName?: string
  albumId?: string
}

export interface Artist {
  id: string
  name: string
  artworkUrl?: string
  genre?: string
  albums: Album[]
  topTracks: Track[]
}
