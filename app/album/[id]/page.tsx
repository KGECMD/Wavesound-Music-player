import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { getAlbumDetails } from '@/lib/music-api'
import { Calendar, Music, Clock } from 'lucide-react'

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTotalDuration(tracks: { duration?: number }[]): string {
  const totalSeconds = tracks.reduce((acc, track) => acc + (track.duration || 0), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  return `${minutes} min`
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params
  const album = await getAlbumDetails(id)

  if (!album) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Artwork */}
          <div className="relative w-full md:w-64 lg:w-80 aspect-square flex-shrink-0">
            <Image
              src={album.artworkUrl}
              alt={album.name}
              fill
              className="object-cover rounded-lg shadow-2xl"
              priority
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Album
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              {album.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <Link
                href={`/search?q=${encodeURIComponent(album.artistName)}`}
                className="font-semibold text-foreground hover:underline"
              >
                {album.artistName}
              </Link>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(album.releaseDate)}
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                {album.trackCount} songs
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTotalDuration(album.tracks)}
              </span>
            </div>
            {album.genre && (
              <p className="mt-4 text-sm text-muted-foreground">
                Genre: <span className="text-foreground">{album.genre}</span>
              </p>
            )}
          </div>
        </div>

        {/* Track List */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Tracks</h2>
          <div className="rounded-lg bg-secondary/30 divide-y divide-border">
            {album.tracks.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} showArtwork={false} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
