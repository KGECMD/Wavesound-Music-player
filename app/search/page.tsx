'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { MusicGrid } from '@/components/music-grid'
import { SectionHeader } from '@/components/section-header'
import { Spinner } from '@/components/ui/spinner'
import { searchMusic, getTrendingTracks, FEATURED_GENRES } from '@/lib/music-api'
import type { MusicItem } from '@/lib/types'
import { Search } from 'lucide-react'

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
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
          const genreTracks = await getTrendingTracks(genre, 30)
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
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    performSearch()
    return () => {
      cancelled = true
    }
  }, [query, genre])

  const currentGenre = FEATURED_GENRES.find((g) => g.id === genre)
  const displayTitle = currentGenre?.label || query

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Genre Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FEATURED_GENRES.map((g) => (
            <a
              key={g.id}
              href={`/search?genre=${encodeURIComponent(g.id)}`}
              className={`px-3.5 py-1.5 text-sm rounded-full transition-colors ring-1 ${
                genre === g.id
                  ? 'bg-primary text-primary-foreground ring-primary'
                  : 'bg-secondary text-foreground ring-border hover:bg-secondary/80'
              }`}
            >
              {g.label}
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
            {displayTitle && (
              <h1 className="text-3xl font-bold text-foreground">
                {currentGenre
                  ? `${currentGenre.label} Music`
                  : `Results for "${query}"`}
              </h1>
            )}

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
                  Try searching for something else or browse by genre
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
              Find your favourite artists, tracks and albums — powered by
              Monochrome &amp; DAB.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
