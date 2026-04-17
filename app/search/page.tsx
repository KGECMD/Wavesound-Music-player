'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Header } from '@/components/header'
import { MusicGrid } from '@/components/music-grid'
import { SectionHeader } from '@/components/section-header'
import { Spinner } from '@/components/ui/spinner'
import { GENRES, getTrendingTracks, searchMusic } from '@/lib/music-api'
import type { MusicItem } from '@/lib/types'

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-10 w-10 text-primary" />
          </div>
        </>
      }
    >
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const genre = searchParams.get('genre') || ''

  const [tracks, setTracks] = useState<MusicItem[]>([])
  const [artists, setArtists] = useState<MusicItem[]>([])
  const [albums, setAlbums] = useState<MusicItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function performSearch() {
      if (!query && !genre) {
        setTracks([])
        setArtists([])
        setAlbums([])
        setHasSearched(false)
        return
      }
      setIsLoading(true)
      setHasSearched(true)
      try {
        if (genre) {
          const genreTracks = await getTrendingTracks(genre, 40)
          if (cancelled) return
          setTracks(genreTracks)
          setArtists([])
          setAlbums([])
        } else {
          const results = await searchMusic(query)
          if (cancelled) return
          setTracks(results.tracks)
          setArtists(results.artists)
          setAlbums(results.albums)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    performSearch()
    return () => {
      cancelled = true
    }
  }, [query, genre])

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((g) => (
            <a
              key={g}
              href={`/search?genre=${encodeURIComponent(g)}`}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                genre === g
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {g}
            </a>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="h-10 w-10 text-primary" />
            <p className="mt-4 text-muted-foreground">Searching…</p>
          </div>
        ) : hasSearched ? (
          <div className="space-y-12">
            <h1 className="text-3xl font-bold text-foreground">
              {genre ? `${genre} Music` : `Results for "${query}"`}
            </h1>

            {tracks.length > 0 && (
              <section>
                <SectionHeader title="Tracks" />
                <MusicGrid items={tracks} />
              </section>
            )}
            {artists.length > 0 && (
              <section>
                <SectionHeader title="Artists" />
                <MusicGrid items={artists} showArtist={false} />
              </section>
            )}
            {albums.length > 0 && (
              <section>
                <SectionHeader title="Albums" />
                <MusicGrid items={albums} />
              </section>
            )}

            {tracks.length === 0 && artists.length === 0 && albums.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No results found
                </h2>
                <p className="text-muted-foreground">
                  Try a different search or browse by genre.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Search for Music
            </h2>
            <p className="text-muted-foreground">
              Find your favorite artists, tracks, and albums in Hi-Fi.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
