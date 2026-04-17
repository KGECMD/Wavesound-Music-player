'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Pause, Play } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { useFavorites } from '@/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import type { Track } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrackRowProps {
  track: Track
  index?: number
  showArtwork?: boolean
  queue?: Track[]
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TrackRow({ track, index, showArtwork = true, queue }: TrackRowProps) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer()
  const { isFavorite, toggleFavorite } = useFavorites()

  const isCurrentTrack = currentTrack?.id === track.id

  const handlePlayClick = () => {
    if (isCurrentTrack && isPlaying) pause()
    else void play(track, queue)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-secondary/50',
        isCurrentTrack && 'bg-secondary/50',
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
            'text-sm text-muted-foreground group-hover:invisible',
            isCurrentTrack && 'text-primary',
          )}
        >
          {index !== undefined ? index + 1 : ''}
        </span>
      </div>

      {showArtwork && (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
          <Image src={track.artworkUrl} alt={track.name} fill className="object-cover" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-medium',
            isCurrentTrack ? 'text-primary' : 'text-foreground',
          )}
        >
          {track.name}
        </p>
        {track.artistId ? (
          <Link
            href={`/artist/${encodeURIComponent(track.artistId)}`}
            className="truncate text-sm text-muted-foreground hover:text-primary transition-colors block"
          >
            {track.artistName}
          </Link>
        ) : (
          <p className="truncate text-sm text-muted-foreground">{track.artistName}</p>
        )}
      </div>

      {track.quality && (
        <span className="hidden md:inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
          {track.quality === 'HI_RES_LOSSLESS' ? 'Hi-Res' : track.quality === 'LOSSLESS' ? 'FLAC' : track.quality}
        </span>
      )}

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

      <span className="w-12 text-right text-sm text-muted-foreground flex-shrink-0">
        {formatDuration(track.duration)}
      </span>
    </div>
  )
}
