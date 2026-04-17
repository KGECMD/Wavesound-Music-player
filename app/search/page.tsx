'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { MusicGrid } from '@/components/music-grid'
import { SectionHeader } from '@/components/section-header'
import { Spinner } from '@/components/ui/spinner'
import { searchMusic, getTrendingTracks, AUDIUS_GENRES } from '@/lib/music-api'
import type { MusicItem } from '@/lib/types'
import { Search } from 'lucide-react'

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
          setTracks(genreTracks)
          setArtists([])
          setAlbums([])
        } else {
          const results = await searchMusic(query)
          setTracks(results.tracks)
          setArtists(results.artists)
          setAlbums(results.albums)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [query, genre])

  const displayTitle = genre || query

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Genre Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {AUDIUS_GENRES.map((g) => (
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
          <p className="mt-4 text-muted-foreground">Searching...</p>
        </div>
      ) : hasSearched ? (
        <div className="space-y-12">
          {displayTitle && (
            <h1 className="text-3xl font-bold text-foreground">
              {genre ? `${genre} Music` : `Results for "${query}"`}
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
              <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
              <p className="text-muted-foreground">
                Try searching for something else or browse by genre
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Search for Music</h2>
          <p className="text-muted-foreground">
            Find your favorite artists, tracks, and albums across the Tidal Hi-Fi catalog
          </p>
        </div>
      )}
    </main>
  )
}

function SearchPageFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading search...</p>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <Suspense fallback={<SearchPageFallback />}>
        <SearchPageContent />
      </Suspense>
    </div>
  )
}
