'use client'

import Image from 'next/image'
import { Play, Pause, Heart } from 'lucide-react'
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

  const handlePlayClick = () => {
    if (!track.previewUrl) return

    if (isCurrentTrack && isPlaying) {
      pause()
    } else {
      play(track)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-secondary/50',
        isCurrentTrack && 'bg-secondary/50'
      )}
    >
      {/* Track Number / Play Button */}
      <div className="w-8 flex-shrink-0 text-center">
        {track.previewUrl ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayClick}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        ) : null}
        <span
          className={cn(
            'text-sm text-muted-foreground',
            track.previewUrl && 'group-hover:hidden',
            isCurrentTrack && 'text-primary'
          )}
        >
          {index !== undefined ? index + 1 : track.trackNumber}
        </span>
      </div>

      {/* Artwork */}
      {showArtwork && (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
          <Image
            src={track.artworkUrl}
            alt={track.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-medium',
            isCurrentTrack ? 'text-primary' : 'text-foreground'
          )}
        >
          {track.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">{track.artistName}</p>
      </div>

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleFavorite(track)}
        className={cn(
          'h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
          isFavorite(track.id) && 'opacity-100 text-primary'
        )}
      >
        <Heart className={cn('h-4 w-4', isFavorite(track.id) && 'fill-current')} />
      </Button>

      {/* Duration */}
      <span className="w-12 text-right text-sm text-muted-foreground flex-shrink-0">
        {formatDuration(track.duration)}
      </span>
    </div>
  )
}
