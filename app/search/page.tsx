import { Suspense } from 'react'
import { Header } from '@/components/header'
import { MusicGrid } from '@/components/music-grid'
import { SectionHeader } from '@/components/section-header'
import { searchMusic } from '@/lib/music-api'
import { Spinner } from '@/components/ui/spinner'
import { Search } from 'lucide-react'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

async function SearchResults({ query }: { query: string }) {
  const [songs, albums, artists] = await Promise.all([
    searchMusic(query, 'song', 15),
    searchMusic(query, 'album', 10),
    searchMusic(query, 'musicArtist', 6),
  ])

  if (songs.length === 0 && albums.length === 0 && artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
        <p className="text-muted-foreground">
          {`We couldn't find anything for "${query}". Try a different search.`}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {songs.length > 0 && (
        <section>
          <SectionHeader title="Songs" />
          <MusicGrid items={songs} />
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <SectionHeader title="Albums" />
          <MusicGrid items={albums} />
        </section>
      )}

      {artists.length > 0 && (
        <section>
          <SectionHeader title="Artists" />
          <MusicGrid items={artists} showArtist={false} />
        </section>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground">Searching...</p>
      </div>
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {query ? (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-8">
              Results for &quot;{query}&quot;
            </h1>
            <Suspense key={query} fallback={<LoadingState />}>
              <SearchResults query={query} />
            </Suspense>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Search for music</h2>
            <p className="text-muted-foreground">
              Find songs, albums, and artists by typing in the search bar above.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
