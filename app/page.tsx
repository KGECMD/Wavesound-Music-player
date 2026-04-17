import { Suspense } from 'react'
import { Header } from '@/components/header'
import { SectionHeader } from '@/components/section-header'
import { MusicGrid } from '@/components/music-grid'
import { Spinner } from '@/components/ui/spinner'
import { GENRES, getTrendingTracks } from '@/lib/music-api'
import { RecentlyPlayedRow } from '@/components/recently-played-row'

async function Row({
  title,
  genre,
  limit = 15,
}: {
  title: string
  genre?: string
  limit?: number
}) {
  const items = await getTrendingTracks(genre, limit)
  if (!items.length) return null
  return (
    <section>
      <SectionHeader
        title={title}
        href={genre ? `/search?genre=${encodeURIComponent(genre)}` : undefined}
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
  return (
    <>
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/30 via-secondary to-secondary/40 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
            Lossless, Hi-Res, Free.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
            Search any artist, play full tracks in FLAC or 24-bit Hi-Res, download
            for offline, and build a library that sticks around on this device.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {GENRES.slice(0, 10).map((g) => (
              <a
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="px-3 py-1.5 text-sm rounded-full bg-secondary/70 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {g}
              </a>
            ))}
          </div>
        </section>

        {/* Client-rendered recently played row (IndexedDB) */}
        <RecentlyPlayedRow />

        <Suspense fallback={<LoadingSection />}>
          <Row title="Trending Now" />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Row title="Pop Hits" genre="Pop" />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Row title="Hip-Hop Essentials" genre="Hip-Hop" />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Row title="Electronic" genre="Electronic" />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Row title="Indie / Alt" genre="Indie" />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Row title="Lo-Fi" genre="Lo-Fi" />
        </Suspense>
      </div>
    </>
  )
}
