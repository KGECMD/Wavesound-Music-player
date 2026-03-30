import type { iTunesSearchResponse, MusicItem, Album, Track, Artist } from './types'

const ITUNES_BASE_URL = 'https://itunes.apple.com'

function getHighResArtwork(url: string | undefined): string {
  if (!url) return '/placeholder-album.jpg'
  return url.replace('100x100', '500x500')
}

function formatDuration(ms: number | undefined): number | undefined {
  return ms ? Math.round(ms / 1000) : undefined
}

export async function searchMusic(
  term: string,
  entity: 'song' | 'album' | 'musicArtist' = 'song',
  limit: number = 25
): Promise<MusicItem[]> {
  const params = new URLSearchParams({
    term,
    entity,
    media: 'music',
    limit: limit.toString(),
  })

  const res = await fetch(`${ITUNES_BASE_URL}/search?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error('Failed to fetch music')

  const data: iTunesSearchResponse = await res.json()

  return data.results.map((item) => ({
    id: String(item.trackId || item.collectionId || item.artistId),
    type: item.wrapperType === 'track' ? 'track' : item.wrapperType === 'collection' ? 'album' : 'artist',
    name: item.trackName || item.collectionName || item.artistName,
    artistName: item.artistName,
    artworkUrl: getHighResArtwork(item.artworkUrl100),
    previewUrl: item.previewUrl,
    collectionId: item.collectionId,
    trackCount: item.trackCount,
    releaseDate: item.releaseDate,
    genre: item.primaryGenreName,
    duration: formatDuration(item.trackTimeMillis),
  }))
}

export async function getTrendingMusic(): Promise<MusicItem[]> {
  const queries = ['top hits 2024', 'popular music', 'new releases']
  const randomQuery = queries[Math.floor(Math.random() * queries.length)]
  return searchMusic(randomQuery, 'song', 20)
}

export async function getNewReleases(): Promise<MusicItem[]> {
  return searchMusic('new music 2024', 'album', 20)
}

export async function getFeaturedArtists(): Promise<MusicItem[]> {
  const artists = ['Taylor Swift', 'Drake', 'The Weeknd', 'Dua Lipa', 'Ed Sheeran', 'Billie Eilish']
  const randomArtist = artists[Math.floor(Math.random() * artists.length)]
  return searchMusic(randomArtist, 'musicArtist', 10)
}

export async function getAlbumDetails(albumId: string): Promise<Album | null> {
  const params = new URLSearchParams({
    id: albumId,
    entity: 'song',
  })

  const res = await fetch(`${ITUNES_BASE_URL}/lookup?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) return null

  const data: iTunesSearchResponse = await res.json()

  if (data.results.length === 0) return null

  const albumInfo = data.results[0]
  const tracks = data.results.slice(1).filter((item) => item.wrapperType === 'track')

  return {
    id: String(albumInfo.collectionId),
    name: albumInfo.collectionName || 'Unknown Album',
    artistName: albumInfo.artistName,
    artworkUrl: getHighResArtwork(albumInfo.artworkUrl100),
    trackCount: albumInfo.trackCount || tracks.length,
    releaseDate: albumInfo.releaseDate,
    genre: albumInfo.primaryGenreName,
    tracks: tracks.map((track) => ({
      id: String(track.trackId),
      name: track.trackName || 'Unknown Track',
      artistName: track.artistName,
      artworkUrl: getHighResArtwork(track.artworkUrl100),
      previewUrl: track.previewUrl,
      duration: formatDuration(track.trackTimeMillis),
      trackNumber: track.trackNumber,
      albumName: track.collectionName,
      albumId: String(track.collectionId),
    })),
  }
}

export async function getArtistDetails(artistId: string): Promise<Artist | null> {
  // Get artist info
  const artistRes = await fetch(`${ITUNES_BASE_URL}/lookup?id=${artistId}`, {
    next: { revalidate: 3600 },
  })

  if (!artistRes.ok) return null

  const artistData: iTunesSearchResponse = await artistRes.json()
  if (artistData.results.length === 0) return null

  const artistInfo = artistData.results[0]

  // Get artist albums
  const albumsRes = await fetch(
    `${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=album&limit=10`,
    { next: { revalidate: 3600 } }
  )
  const albumsData: iTunesSearchResponse = await albumsRes.json()
  const albums = albumsData.results.slice(1).filter((item) => item.wrapperType === 'collection')

  // Get artist top songs
  const songsRes = await fetch(
    `${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=song&limit=15`,
    { next: { revalidate: 3600 } }
  )
  const songsData: iTunesSearchResponse = await songsRes.json()
  const songs = songsData.results.slice(1).filter((item) => item.wrapperType === 'track')

  return {
    id: String(artistInfo.artistId),
    name: artistInfo.artistName,
    artworkUrl: songs[0] ? getHighResArtwork(songs[0].artworkUrl100) : undefined,
    genre: artistInfo.primaryGenreName,
    albums: albums.map((album) => ({
      id: String(album.collectionId),
      name: album.collectionName || 'Unknown Album',
      artistName: album.artistName,
      artworkUrl: getHighResArtwork(album.artworkUrl100),
      trackCount: album.trackCount || 0,
      releaseDate: album.releaseDate,
      genre: album.primaryGenreName,
      tracks: [],
    })),
    topTracks: songs.map((track) => ({
      id: String(track.trackId),
      name: track.trackName || 'Unknown Track',
      artistName: track.artistName,
      artworkUrl: getHighResArtwork(track.artworkUrl100),
      previewUrl: track.previewUrl,
      duration: formatDuration(track.trackTimeMillis),
      trackNumber: track.trackNumber,
      albumName: track.collectionName,
      albumId: String(track.collectionId),
    })),
  }
}
