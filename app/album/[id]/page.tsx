export const dynamic = 'force-dynamic'
export const revalidate = 0
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, Music } from 'lucide-react'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { getAlbumById } from '@/lib/music-api'

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

function formatTotalDuration(tracks: { duration?: number }[]): string {
  const totalSeconds = tracks.reduce((acc, track) => acc + (track.duration || 0), 0)
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

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main>
        {/* Album Header */}
        <div className="bg-gradient-to-b from-primary/15 via-secondary/40 to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
              <div className="relative h-56 w-56 md:h-64 md:w-64 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-border/60 bg-muted">
                {album.artworkUrl ? (
                  <Image
                    src={album.artworkUrl}
                    alt={album.name}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Album
                </p>
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                  {album.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link
                    href={`/artist/${album.artistId}`}
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
                  {album.isHiRes && (
                    <>
                      <span>•</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold tracking-wide">
                        HI-RES
                      </span>
                    </>
                  )}
                </div>

                {album.description && (
                  <p className="mt-4 text-muted-foreground max-w-2xl line-clamp-3">
                    {album.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-xl bg-secondary/30 divide-y divide-border ring-1 ring-border/40">
            {album.tracks.length > 0 ? (
              album.tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  showArtwork={false}
                />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No tracks available
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
