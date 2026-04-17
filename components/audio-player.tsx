'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioPlayer() {
  const { currentTrack, isPlaying, isLoading, progress, duration, volume, togglePlay, seek, setVolume } =
    useAudioPlayer()

  if (!currentTrack) return null

  const trackDuration = duration || currentTrack.duration || 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{currentTrack.name}</p>
              <Link 
                href={`/artist/${currentTrack.artistId}`}
                className="truncate text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {currentTrack.artistName}
              </Link>
            </div>
            {/* Audius badge */}
            {currentTrack.source === 'audius' && (
              <a 
                href={`https://audius.co/tracks/${encodeURIComponent(currentTrack.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">AUDIUS</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
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
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(progress)}
              </span>
              <Slider
                value={[progress]}
                max={trackDuration || 100}
                step={0.1}
                onValueChange={([value]) => seek(value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(trackDuration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
              className="h-8 w-8"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={([value]) => setVolume(value / 100)}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
