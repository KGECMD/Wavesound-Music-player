import { Suspense } from 'react'
import { Header } from '@/components/header'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import { getTrendingMusic, getNewReleases, searchMusic } from '@/lib/music-api'
import { Spinner } from '@/components/ui/spinner'

async function TrendingSection() {
  const trending = await getTrendingMusic()

  return (
    <section>
      <SectionHeader title="Trending Now" />
      <MusicGrid items={trending} />
    </section>
  )
}

async function NewReleasesSection() {
  const releases = await getNewReleases()

  return (
    <section>
      <SectionHeader title="New Releases" />
      <MusicGrid items={releases} />
    </section>
  )
}

async function GenreSection({ genre, title }: { genre: string; title: string }) {
  const items = await searchMusic(genre, 'song', 10)

  return (
    <section>
      <SectionHeader title={title} href={`/search?q=${encodeURIComponent(genre)}`} />
      <MusicGrid items={items} />
    </section>
  )
}

function LoadingSection() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-secondary/50 p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Discover Your Next Favorite Song
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Explore millions of tracks, albums, and artists. Preview songs instantly and build
              your personal collection.
            </p>
          </div>
        </section>

        {/* Trending Section */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <TrendingSection />
          </Suspense>
        </div>

        {/* New Releases */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <NewReleasesSection />
          </Suspense>
        </div>

        {/* Genre Sections */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="pop music" title="Pop" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="hip hop" title="Hip Hop" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="rock music" title="Rock" />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
