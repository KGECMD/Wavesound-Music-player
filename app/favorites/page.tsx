'use client'

import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { useFavorites } from '@/hooks/use-favorites'
import { Heart } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites()

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <Heart className="h-8 w-8 text-primary-foreground fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Favorites</h1>
            <p className="text-muted-foreground">
              {isLoaded ? `${favorites.length} songs` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Favorites List */}
        {!isLoaded ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground max-w-md">
              Start adding songs to your favorites by clicking the heart icon on any track.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-secondary/30 divide-y divide-border">
            {favorites.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
