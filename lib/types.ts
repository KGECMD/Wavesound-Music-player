// Audius API Types
export interface AudiusUser {
  id: string
  handle: string
  name: string
  profile_picture?: {
    '150x150'?: string
    '480x480'?: string
    '1000x1000'?: string
  }
  cover_photo?: {
    '640x'?: string
    '2000x'?: string
  }
  bio?: string
  follower_count: number
  followee_count: number
  track_count: number
  is_verified: boolean
}

export interface AudiusTrack {
  id: string
  title: string
  user: AudiusUser
  artwork?: {
    '150x150'?: string
    '480x480'?: string
    '1000x1000'?: string
  }
  description?: string
  genre: string
  mood?: string
  duration: number
  play_count: number
  favorite_count: number
  repost_count: number
  permalink: string
  is_streamable: boolean
  release_date?: string
}

export interface AudiusPlaylist {
  id: string
  playlist_name: string
  user: AudiusUser
  artwork?: {
    '150x150'?: string
    '480x480'?: string
    '1000x1000'?: string
  }
  description?: string
  track_count: number
  total_play_count: number
  is_album: boolean
  tracks?: AudiusTrack[]
}

// App Types
export interface Track {
  id: string
  name: string
  artistName: string
  artistId: string
  artworkUrl: string
  streamUrl?: string
  spotifyUri?: string
  duration?: number
  playCount?: number
  genre?: string
  source: 'audius' | 'spotify' | 'hifi'
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
  source: 'audius' | 'spotify' | 'hifi'
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
  source: 'audius' | 'spotify' | 'hifi'
}

export interface MusicItem {
  id: string
  type: 'track' | 'album' | 'artist'
  name: string
  artistName: string
  artistId?: string
  artworkUrl: string
  streamUrl?: string
  spotifyUri?: string
  duration?: number
  playCount?: number
  genre?: string
  trackCount?: number
  source: 'audius' | 'spotify' | 'hifi'
}
