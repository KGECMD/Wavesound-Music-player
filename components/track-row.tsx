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
  /**
   * Optional surrounding track list. When the user presses play, the whole
   * list becomes the playback queue so that "next" advances to the following
   * row instead of stopping.
   */
  queue?: Track[]
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
  const canPlay = track.source === 'audius' && track.streamUrl

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
        'group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-secondary/50',
        isCurrentTrack && 'bg-secondary/50'
      )}
    >
      {/* Track Number / Play Button */}
      <div className="w-8 flex-shrink-0 text-center relative">
        {canPlay ? (
          <>
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
                'text-sm text-muted-foreground group-hover:invisible',
                isCurrentTrack && 'text-primary'
              )}
            >
              {index !== undefined ? index + 1 : ''}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            {index !== undefined ? index + 1 : ''}
          </span>
        )}
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

      {/* Play count */}
      {track.playCount !== undefined && (
        <span className="hidden md:block text-sm text-muted-foreground flex-shrink-0">
          {track.playCount.toLocaleString()} plays
        </span>
      )}

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
