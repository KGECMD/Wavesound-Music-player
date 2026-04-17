'use client'

import { useEffect, useState } from 'react'
import { Library as LibraryIcon } from 'lucide-react'
import { Header } from '@/components/header'
import { SectionHeader } from '@/components/section-header'
import { TrackRow } from '@/components/track-row'
import { Spinner } from '@/components/ui/spinner'
import {
  getRecentlyPlayed,
  getTopPlayed,
  type PlayCount,
} from '@/lib/library-db'
import { useFavorites } from '@/hooks/use-favorites'
import type { Track } from '@/lib/types'

export default function LibraryPage() {
  const [recent, setRecent] = useState<Track[]>([])
  const [top, setTop] = useState<PlayCount[]>([])
  const [loading, setLoading] = useState(true)
  const { favorites } = useFavorites()

  useEffect(() => {
    void (async () => {
      const [r, t] = await Promise.all([
        getRecentlyPlayed(30),
        getTopPlayed(20),
      ])
      setRecent(r)
      setTop(t)
      setLoading(false)
    })()
  }, [])

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary/70 to-primary/30 shadow-lg">
            <LibraryIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Library</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">
              On This Device
            </h1>
            <p className="text-muted-foreground mt-1">
              Recently played, top tracks, and liked songs are stored locally in
              your browser (IndexedDB).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : (
          <>
            {recent.length > 0 && (
              <section>
                <SectionHeader title="Recently Played" />
                <div className="rounded-lg bg-secondary/30 divide-y divide-border">
                  {recent.map((t, i) => (
                    <TrackRow key={`${t.id}-${i}`} track={t} index={i} queue={recent} />
                  ))}
                </div>
              </section>
            )}

            {top.length > 0 && (
              <section>
                <SectionHeader title="Your Top Tracks" />
                <div className="rounded-lg bg-secondary/30 divide-y divide-border">
                  {top.map((pc, i) => (
                    <TrackRow
                      key={`${pc.id}-${i}`}
                      track={pc.track}
                      index={i}
                      queue={top.map((x) => x.track)}
                    />
                  ))}
                </div>
              </section>
            )}

            {favorites.length > 0 && (
              <section>
                <SectionHeader title="Liked Songs" href="/favorites" />
                <div className="rounded-lg bg-secondary/30 divide-y divide-border">
                  {favorites.slice(0, 10).map((t, i) => (
                    <TrackRow
                      key={`${t.id}-${i}`}
                      track={t}
                      index={i}
                      queue={favorites}
                    />
                  ))}
                </div>
              </section>
            )}

            {recent.length === 0 &&
              top.length === 0 &&
              favorites.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <LibraryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Nothing here yet
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Play a track or like a song — it will show up here and stick
                    around next time you open the app.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </>
  )
}
