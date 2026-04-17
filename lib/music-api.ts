import type { AudiusTrack, AudiusUser, AudiusPlaylist, Track, Album, Artist, MusicItem } from './types'

// Audius API - Free full songs
const AUDIUS_API_HOST = 'https://discoveryprovider.audius.co'
const AUDIUS_APP_NAME = 'soundwave'

function getAudiusArtwork(artwork: AudiusTrack['artwork'] | AudiusUser['profile_picture'], size: '150x150' | '480x480' | '1000x1000' = '480x480'): string {
  if (!artwork) return '/placeholder-album.jpg'
  return artwork[size] || artwork['480x480'] || artwork['150x150'] || '/placeholder-album.jpg'
}

function audiusTrackToTrack(track: AudiusTrack): Track {
  return {
    id: track.id,
    name: track.title,
    artistName: track.user.name,
    artistId: track.user.id,
    artworkUrl: getAudiusArtwork(track.artwork),
    streamUrl: `${AUDIUS_API_HOST}/v1/tracks/${track.id}/stream?app_name=${AUDIUS_APP_NAME}`,
    duration: track.duration,
    playCount: track.play_count,
    genre: track.genre,
    source: 'audius',
  }
}

function audiusTrackToMusicItem(track: AudiusTrack): MusicItem {
  return {
    id: track.id,
    type: 'track',
    name: track.title,
    artistName: track.user.name,
    artistId: track.user.id,
    artworkUrl: getAudiusArtwork(track.artwork),
    streamUrl: `${AUDIUS_API_HOST}/v1/tracks/${track.id}/stream?app_name=${AUDIUS_APP_NAME}`,
    duration: track.duration,
    playCount: track.play_count,
    genre: track.genre,
    source: 'audius',
  }
}

function audiusUserToMusicItem(user: AudiusUser): MusicItem {
  return {
    id: user.id,
    type: 'artist',
    name: user.name,
    artistName: user.name,
    artistId: user.id,
    artworkUrl: getAudiusArtwork(user.profile_picture),
    source: 'audius',
  }
}

function audiusPlaylistToMusicItem(playlist: AudiusPlaylist): MusicItem {
  return {
    id: playlist.id,
    type: 'album',
    name: playlist.playlist_name,
    artistName: playlist.user.name,
    artistId: playlist.user.id,
    artworkUrl: getAudiusArtwork(playlist.artwork),
    trackCount: playlist.track_count,
    source: 'audius',
  }
}

export async function searchTracks(query: string, limit: number = 20): Promise<MusicItem[]> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(audiusTrackToMusicItem)
  } catch {
    return []
  }
}

export async function searchUsers(query: string, limit: number = 10): Promise<MusicItem[]> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/users/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(audiusUserToMusicItem)
  } catch {
    return []
  }
}

export async function searchPlaylists(query: string, limit: number = 10): Promise<MusicItem[]> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/playlists/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).filter((p: AudiusPlaylist) => p.is_album).map(audiusPlaylistToMusicItem)
  } catch {
    return []
  }
}

export async function searchMusic(query: string): Promise<{ tracks: MusicItem[]; artists: MusicItem[]; albums: MusicItem[] }> {
  const [tracks, artists, albums] = await Promise.all([
    searchTracks(query, 15),
    searchUsers(query, 8),
    searchPlaylists(query, 8),
  ])
  return { tracks, artists, albums }
}

export async function getTrendingTracks(genre?: string, limit: number = 20): Promise<MusicItem[]> {
  try {
    const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : ''
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/tracks/trending?limit=${limit}${genreParam}&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(audiusTrackToMusicItem)
  } catch {
    return []
  }
}

export async function getUndergroundTrending(limit: number = 20): Promise<MusicItem[]> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/tracks/trending/underground?limit=${limit}&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(audiusTrackToMusicItem)
  } catch {
    return []
  }
}

export async function getTrackById(trackId: string): Promise<Track | null> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/tracks/${trackId}?app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return audiusTrackToTrack(data.data)
  } catch {
    return null
  }
}

export async function getArtistById(userId: string): Promise<Artist | null> {
  try {
    // Fetch user info
    const userRes = await fetch(
      `${AUDIUS_API_HOST}/v1/users/${userId}?app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!userRes.ok) return null
    const userData = await userRes.json()
    const user: AudiusUser = userData.data

    // Fetch user's tracks
    const tracksRes = await fetch(
      `${AUDIUS_API_HOST}/v1/users/${userId}/tracks?limit=20&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    const tracksData = await tracksRes.json()
    const tracks: AudiusTrack[] = tracksData.data || []

    // Fetch user's albums (playlists that are albums)
    const albumsRes = await fetch(
      `${AUDIUS_API_HOST}/v1/users/${userId}/albums?limit=10&app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    const albumsData = await albumsRes.json()
    const playlists: AudiusPlaylist[] = albumsData.data || []

    return {
      id: user.id,
      name: user.name,
      handle: user.handle,
      artworkUrl: getAudiusArtwork(user.profile_picture, '1000x1000'),
      coverUrl: user.cover_photo?.['2000x'] || user.cover_photo?.['640x'],
      bio: user.bio,
      followerCount: user.follower_count,
      trackCount: user.track_count,
      isVerified: user.is_verified,
      topTracks: tracks.map(audiusTrackToTrack),
      albums: playlists.map((p) => ({
        id: p.id,
        name: p.playlist_name,
        artistName: user.name,
        artistId: user.id,
        artworkUrl: getAudiusArtwork(p.artwork),
        trackCount: p.track_count,
        tracks: [],
        source: 'audius' as const,
      })),
      source: 'audius',
    }
  } catch {
    return null
  }
}

export async function getAlbumById(playlistId: string): Promise<Album | null> {
  try {
    const res = await fetch(
      `${AUDIUS_API_HOST}/v1/playlists/${playlistId}?app_name=${AUDIUS_APP_NAME}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const playlist: AudiusPlaylist = data.data[0]

    if (!playlist) return null

    return {
      id: playlist.id,
      name: playlist.playlist_name,
      artistName: playlist.user.name,
      artistId: playlist.user.id,
      artworkUrl: getAudiusArtwork(playlist.artwork, '1000x1000'),
      trackCount: playlist.track_count,
      description: playlist.description,
      tracks: (playlist.tracks || []).map(audiusTrackToTrack),
      source: 'audius',
    }
  } catch {
    return null
  }
}

// Spotify Embed URLs
export function getSpotifyEmbedUrl(spotifyUri: string): string {
  // Convert spotify:track:xxx to embed URL
  const parts = spotifyUri.split(':')
  if (parts.length >= 3) {
    const type = parts[1]
    const id = parts[2]
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
  }
  return ''
}

export function getSpotifyTrackUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`
}

// Genre mappings for Audius
export const AUDIUS_GENRES = [
  'Electronic',
  'Hip-Hop/Rap', 
  'Pop',
  'R&B/Soul',
  'Rock',
  'Metal',
  'Alternative',
  'Jazz',
  'Classical',
  'Ambient',
  'House',
  'Techno',
  'Dubstep',
  'Drum & Bass',
  'Trap',
  'Lo-Fi',
  'World',
  'Reggae',
  'Country',
  'Folk',
] as const
