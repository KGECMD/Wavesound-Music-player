import { Suspense } from 'react'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Header } from '@/components/header'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import {
  getTrendingTracks,
  getUndergroundTrending,
  FEATURED_GENRES,
} from '@/lib/music-api'
import { Spinner } from '@/components/ui/spinner'
import { Sparkles } from 'lucide-react'

async function TrendingSection() {
  const trending = await getTrendingTracks(undefined, 20)
  if (trending.length === 0) return null
  return (
    <section>
      <SectionHeader title="Trending Now" />
      <MusicGrid items={trending} />
    </section>
  )
}

async function UndergroundSection() {
  const underground = await getUndergroundTrending(15)
  if (underground.length === 0) return null
  return (
    <section>
      <SectionHeader title="Underground Picks" />
      <MusicGrid items={underground} />
    </section>
  )
}

async function GenreSection({ genre, title }: { genre: string; title: string }) {
  const items = await getTrendingTracks(genre, 10)
  if (items.length === 0) return null
  return (
    <section>
      <SectionHeader
        title={title}
        href={`/search?genre=${encodeURIComponent(genre)}`}
      />
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
  const heroGenres = FEATURED_GENRES.slice(0, 10)

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/25 via-secondary to-secondary/40 p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 backdrop-blur text-xs font-medium text-primary ring-1 ring-primary/30 mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Hi-Res lossless streaming
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4 text-balance">
                Stream music in studio quality.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
                Wavesound pulls from Monochrome&apos;s Tidal-compatible mirrors and the
                DAB Hi-Res catalogue to deliver lossless tracks, full albums, and deep
                artist catalogues — all in one player.
              </p>
              <div className="flex flex-wrap gap-2 mt-7">
                {heroGenres.map((genre) => (
                  <a
                    key={genre.id}
                    href={`/search?genre=${encodeURIComponent(genre.id)}`}
                    className="px-3.5 py-1.5 text-sm rounded-full bg-background/60 text-foreground ring-1 ring-border hover:bg-primary hover:text-primary-foreground hover:ring-primary transition-colors"
                  >
                    {genre.label}
                  </a>
                ))}
              </div>
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
            <GenreSection genre="electronic" title="Electronic" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="hip-hop" title="Hip-Hop" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="pop" title="Pop" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="rock" title="Rock" />
          </Suspense>
        </div>

        <div className="mb-12">
          <Suspense fallback={<LoadingSection />}>
            <GenreSection genre="jazz" title="Jazz" />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
