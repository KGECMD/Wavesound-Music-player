import { Suspense } from 'react'
import { Header } from '@/components/header'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import { getTrendingTracks, getUndergroundTrending, AUDIUS_GENRES } from '@/lib/music-api'
import { Spinner } from '@/components/ui/spinner'

async function TrendingSection() {
  const trending = await getTrendingTracks(undefined, 20)

  return (
    <section>
      <SectionHeader title="Trending Now" />
      <MusicGrid items={trending} />
    </section>
  )
}

async function UndergroundSection() {
  const underground = await getUndergroundTrending(15)

  return (
    <section>
      <SectionHeader title="Underground Picks" />
      <MusicGrid items={underground} />
    </section>
  )
}

async function GenreSection({ genre, title }: { genre: string; title: string }) {
  const items = await getTrendingTracks(genre, 10)

  return (
    <section>
      <SectionHeader title={title} href={`/search?genre=${encodeURIComponent(genre)}`} />
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
              Stream Full Songs, Free
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Discover independent artists on Audius. Stream full tracks for free, no subscriptions required.
              Support the artists you love directly.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {AUDIUS_GENRES.slice(0, 8).map((genre) => (
                <a
                  key={genre}
                  href={`/search?genre=${encodeURIComponent(genre)}`}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {genre}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Section */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <TrendingSection />
          </Suspense>
        </div>

        {/* Underground */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <UndergroundSection />
          </Suspense>
        </div>

        {/* Genre Sections */}
        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="Electronic" title="Electronic" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="Hip-Hop/Rap" title="Hip-Hop" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="Pop" title="Pop" />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
