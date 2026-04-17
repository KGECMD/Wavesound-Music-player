'use client'

import { Heart } from 'lucide-react'
import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { useFavorites } from '@/hooks/use-favorites'
import { Spinner } from '@/components/ui/spinner'
import { PlayAllButton } from '@/components/play-all-button'

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites()

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg">
            <Heart className="h-10 w-10 text-primary-foreground fill-current" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Playlist</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">
              Liked Songs
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoaded ? `${favorites.length} songs` : 'Loading…'}
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="mb-6">
            <PlayAllButton tracks={favorites} />
          </div>
        )}

        {!isLoaded ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No favorites yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              Tap the heart on any track to save it here. Your library stays on
              this device (IndexedDB) — no account needed.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-secondary/30 divide-y divide-border">
            {favorites.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                queue={favorites}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
