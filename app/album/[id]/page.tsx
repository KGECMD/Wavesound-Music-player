import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, Music } from 'lucide-react'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import { getAlbumById, getRecommendations } from '@/lib/music-api'
import { PlayAllButton } from '@/components/play-all-button'

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

function formatTotalDuration(tracks: { duration?: number }[]): string {
  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours} hr ${minutes} min`
  return `${minutes} min`
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params
  const album = await getAlbumById(id)
  if (!album) notFound()

  const totalDuration = formatTotalDuration(album.tracks)
  const recommendations = album.tracks[0]
    ? await getRecommendations(album.tracks[0].id, 12)
    : []

  return (
    <>
      <Header />

      <div className="bg-gradient-to-b from-primary/20 via-secondary/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            <div className="relative h-56 w-56 md:h-64 md:w-64 flex-shrink-0 overflow-hidden rounded-lg shadow-2xl">
              <Image
                src={album.artworkUrl}
                alt={album.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">Album</p>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                {album.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={`/artist/${encodeURIComponent(album.artistId)}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {album.artistName}
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  {album.trackCount} tracks
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {totalDuration}
                </span>
                {album.releaseDate && (
                  <>
                    <span>•</span>
                    <span>{album.releaseDate.slice(0, 4)}</span>
                  </>
                )}
              </div>

              <div className="mt-6">
                <PlayAllButton tracks={album.tracks} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="rounded-lg bg-secondary/30 divide-y divide-border">
          {album.tracks.length > 0 ? (
            album.tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                showArtwork={false}
                queue={album.tracks}
              />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No tracks available
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <section>
            <SectionHeader title="You Might Also Like" />
            <MusicGrid items={recommendations} />
          </section>
        )}
      </div>
    </>
  )
}
