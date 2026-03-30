'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Pause, Heart } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { useFavorites } from '@/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import type { MusicItem, Track } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MusicCardProps {
  item: MusicItem
  showArtist?: boolean
}

export function MusicCard({ item, showArtist = true }: MusicCardProps) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer()
  const { isFavorite, toggleFavorite } = useFavorites()

  const isCurrentTrack = currentTrack?.id === item.id
  const isTrack = item.type === 'track'
  const canPlay = isTrack && item.source === 'audius' && item.streamUrl

  const track: Track = {
    id: item.id,
    name: item.name,
    artistName: item.artistName,
    artistId: item.artistId || '',
    artworkUrl: item.artworkUrl,
    streamUrl: item.streamUrl,
    duration: item.duration,
    source: item.source,
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canPlay) return

    if (isCurrentTrack && isPlaying) {
      pause()
    } else {
      play(track)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(track)
  }

  const href =
    item.type === 'album'
      ? `/album/${item.id}`
      : item.type === 'artist'
        ? `/artist/${item.artistId || item.id}`
        : `/artist/${item.artistId}`

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-secondary/50 p-4 transition-all duration-300 hover:bg-secondary">
        {/* Artwork */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-md shadow-lg">
          <Image
            src={item.artworkUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Play Button Overlay */}
          {canPlay && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200',
                isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <Button
                size="icon"
                onClick={handlePlayClick}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 transition-transform shadow-xl"
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{item.name}</h3>
              {showArtist && (
                <p className="truncate text-sm text-muted-foreground">{item.artistName}</p>
              )}
              {item.playCount !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.playCount.toLocaleString()} plays
                </p>
              )}
            </div>
            {isTrack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteClick}
                className={cn(
                  'h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  isFavorite(item.id) && 'opacity-100 text-primary'
                )}
              >
                <Heart
                  className={cn('h-4 w-4', isFavorite(item.id) && 'fill-current')}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
