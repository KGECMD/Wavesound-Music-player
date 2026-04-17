'use client'

import Image from 'next/image'
import { Play, Pause, Heart, Music as MusicIcon } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { useFavorites } from '@/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import type { Track } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrackRowProps {
  track: Track
  index?: number
  showArtwork?: boolean
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TrackRow({ track, index, showArtwork = true }: TrackRowProps) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer()
  const { isFavorite, toggleFavorite } = useFavorites()

  const isCurrentTrack = currentTrack?.id === track.id
  const canPlay = true

  const handlePlayClick = () => {
    if (!canPlay) return
    if (isCurrentTrack && isPlaying) {
      pause()
    } else {
      play(track)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-secondary/60',
        isCurrentTrack && 'bg-secondary/60',
      )}
    >
      {/* Track Number / Play Button */}
      <div className="w-8 flex-shrink-0 text-center relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayClick}
          className="h-8 w-8 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        <span
          className={cn(
            'text-sm text-muted-foreground group-hover:invisible tabular-nums',
            isCurrentTrack && 'text-primary',
          )}
        >
          {index !== undefined ? index + 1 : ''}
        </span>
      </div>

      {/* Artwork */}
      {showArtwork && (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
          {track.artworkUrl ? (
            <Image
              src={track.artworkUrl}
              alt={track.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MusicIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'truncate font-medium',
              isCurrentTrack ? 'text-primary' : 'text-foreground',
            )}
          >
            {track.name}
          </p>
          {track.explicit && (
            <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground font-semibold">
              E
            </span>
          )}
          {track.isHiRes && (
            <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold tracking-wide">
              HI-RES
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {track.artistName}
        </p>
      </div>

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleFavorite(track)}
        className={cn(
          'h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
          isFavorite(track.id) && 'opacity-100 text-primary',
        )}
      >
        <Heart className={cn('h-4 w-4', isFavorite(track.id) && 'fill-current')} />
      </Button>

      {/* Duration */}
      <span className="w-12 text-right text-sm text-muted-foreground flex-shrink-0 tabular-nums">
        {formatDuration(track.duration)}
      </span>
    </div>
  )
}
