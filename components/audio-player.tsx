'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  SkipBack,
  SkipForward,
  Heart,
} from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { useFavorites } from '@/hooks/use-favorites'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { QueueButton } from './queue-panel'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrev,
  } = useAudioPlayer()
  const { isFavorite, toggleFavorite } = useFavorites()

  if (!currentTrack) return null

  const trackDuration = duration || currentTrack.duration || 0
  const canPrev = queueIndex > 0 || progress > 3
  const canNext = queueIndex >= 0 && queueIndex < queue.length - 1

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      {/* Mobile progress bar on top */}
      <div className="md:hidden px-4 pt-2">
        <Slider
          value={[progress]}
          max={trackDuration || 100}
          step={0.1}
          onValueChange={([value]) => seek(value)}
          aria-label="Seek"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 tabular-nums">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 md:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-1">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {currentTrack.name}
              </p>
              <Link
                href={`/artist/${currentTrack.artistId}`}
                className="truncate text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {currentTrack.artistName}
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(currentTrack)}
              aria-label={
                isFavorite(currentTrack.id)
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }
              className={cn(
                'h-8 w-8 flex-shrink-0 hidden sm:inline-flex',
                isFavorite(currentTrack.id) && 'text-primary'
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4',
                  isFavorite(currentTrack.id) && 'fill-current'
                )}
              />
            </Button>
            {currentTrack.source === 'audius' && (
              <a
                href={`https://audius.co/tracks/${currentTrack.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                aria-label="Open on Audius"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">
                  AUDIUS
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 md:flex-1 md:max-w-md">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrev}
                disabled={!canPrev}
                aria-label="Previous track"
                className="h-8 w-8 hidden sm:inline-flex"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <Spinner className="h-5 w-5" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                disabled={!canNext}
                aria-label="Next track"
                className="h-8 w-8 hidden sm:inline-flex"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            {/* Desktop progress bar */}
            <div className="hidden md:flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                {formatTime(progress)}
              </span>
              <Slider
                value={[progress]}
                max={trackDuration || 100}
                step={0.1}
                onValueChange={([value]) => seek(value)}
                aria-label="Seek"
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 tabular-nums">
                {formatTime(trackDuration)}
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 md:flex-1 justify-end">
            <QueueButton />
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                className="h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value / 100)}
                aria-label="Volume"
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
