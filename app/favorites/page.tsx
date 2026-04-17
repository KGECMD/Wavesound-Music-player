'use client'

import { Header } from '@/components/header'
import { TrackRow } from '@/components/track-row'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useFavorites } from '@/hooks/use-favorites'
import { useAudioPlayer } from '@/components/audio-player-provider'
import { Heart, Play, Shuffle, Trash2 } from 'lucide-react'

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function FavoritesPage() {
  const { favorites, isLoaded, removeFavorite } = useFavorites()
  const { play } = useAudioPlayer()

  const playable = favorites.filter(
    (t) => t.source === 'audius' && !!t.streamUrl
  )

  const handlePlayAll = () => {
    if (playable.length === 0) return
    play(playable[0], { queue: playable, startIndex: 0 })
  }

  const handleShuffle = () => {
    if (playable.length === 0) return
    const shuffled = shuffleArray(playable)
    play(shuffled[0], { queue: shuffled, startIndex: 0 })
  }

  const handleClearAll = () => {
    if (favorites.length === 0) return
    if (!window.confirm('Remove all tracks from your favorites?')) return
    for (const t of favorites) removeFavorite(t.id)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
          <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 flex-shrink-0">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground fill-current" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Playlist
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1">
              Your Favorites
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLoaded
                ? `${favorites.length} track${favorites.length === 1 ? '' : 's'}`
                : 'Loading…'}
              {isLoaded && favorites.length > playable.length && (
                <span className="ml-1">
                  ({playable.length} streamable)
                </span>
              )}
            </p>
            {isLoaded && favorites.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  onClick={handlePlayAll}
                  disabled={playable.length === 0}
                  className="rounded-full"
                >
                  <Play className="h-4 w-4 mr-1 fill-current" />
                  Play all
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleShuffle}
                  disabled={playable.length === 0}
                  className="rounded-full"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Shuffle
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClearAll}
                  className="rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

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
              Start adding songs to your favorites by clicking the heart icon
              on any track.
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
      </main>
    </div>
  )
}
