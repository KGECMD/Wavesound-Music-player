import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { SectionHeader } from '@/components/section-header'
import { getArtistDetails } from '@/lib/music-api'
import { User } from 'lucide-react'

interface ArtistPageProps {
  params: Promise<{ id: string }>
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params
  const artist = await getArtistDetails(id)

  if (!artist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
          {/* Artist Image */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
            {artist.artworkUrl ? (
              <Image
                src={artist.artworkUrl}
                alt={artist.name}
                fill
                className="object-cover rounded-full shadow-2xl"
                priority
              />
            ) : (
              <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                <User className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Artist
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              {artist.name}
            </h1>
            {artist.genre && (
              <p className="text-muted-foreground">
                Genre: <span className="text-foreground">{artist.genre}</span>
              </p>
            )}
          </div>
        </div>

        {/* Popular Tracks */}
        {artist.topTracks.length > 0 && (
          <section className="mb-12">
            <SectionHeader title="Popular Tracks" />
            <div className="rounded-lg bg-secondary/30 divide-y divide-border">
              {artist.topTracks.slice(0, 10).map((track, index) => (
                <TrackRow key={track.id} track={track} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Albums */}
        {artist.albums.length > 0 && (
          <section>
            <SectionHeader title="Albums" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-lg bg-secondary/50 p-4 transition-all duration-300 hover:bg-secondary">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-md shadow-lg">
                      <Image
                        src={album.artworkUrl}
                        alt={album.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{album.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {album.releaseDate
                          ? new Date(album.releaseDate).getFullYear()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
