import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Music, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import { PlayAllButton } from '@/components/play-all-button'
import { getArtistById, getSimilarArtists } from '@/lib/music-api'

interface ArtistPageProps {
  params: Promise<{ id: string }>
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params
  const artist = await getArtistById(id)
  if (!artist) notFound()

  const similar = await getSimilarArtists(artist.id, 12)

  return (
    <>
      <Header />
      <div className="relative">
        <div className="h-64 md:h-80 w-full bg-gradient-to-b from-primary/30 to-background relative overflow-hidden">
          {artist.coverUrl && (
            <Image
              src={artist.coverUrl}
              alt={artist.name}
              fill
              className="object-cover opacity-50"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-end gap-6 pb-6">
            <div className="relative h-32 w-32 md:h-48 md:w-48 flex-shrink-0 overflow-hidden rounded-full shadow-2xl border-4 border-background">
              {artist.artworkUrl ? (
                <Image
                  src={artist.artworkUrl}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Music className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 mb-2">
                {artist.isVerified && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm text-muted-foreground">Artist</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground truncate text-balance">
                {artist.name}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {artist.followerCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {artist.followerCount.toLocaleString()} followers
                  </span>
                )}
                {artist.trackCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    {artist.trackCount} tracks
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {artist.bio && (
          <p className="text-muted-foreground max-w-3xl whitespace-pre-line">
            {artist.bio}
          </p>
        )}

        {artist.topTracks.length > 0 && (
          <div>
            <PlayAllButton tracks={artist.topTracks} label="Play Popular" />
          </div>
        )}

        {artist.topTracks.length > 0 && (
          <section>
            <SectionHeader title="Popular Tracks" />
            <div className="rounded-lg bg-secondary/30 divide-y divide-border">
              {artist.topTracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  queue={artist.topTracks}
                />
              ))}
            </div>
          </section>
        )}

        {artist.albums.length > 0 && (
          <section>
            <SectionHeader title="Albums" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${encodeURIComponent(album.id)}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg mb-3">
                    <Image
                      src={album.artworkUrl}
                      alt={album.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {album.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {album.trackCount} tracks
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <SectionHeader title="Fans Also Like" />
            <MusicGrid items={similar} showArtist={false} />
          </section>
        )}
      </div>
    </>
  )
}
