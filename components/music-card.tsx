'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Pause, Play } from 'lucide-react'
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

  const isTrack = item.type === 'track'
  const isCurrentTrack = isTrack && currentTrack?.id === item.id

  const track: Track = {
    id: item.id,
    name: item.name,
    artistName: item.artistName,
    artistId: item.artistId || '',
    albumId: item.albumId,
    artworkUrl: item.artworkUrl,
    duration: item.duration,
    source: 'tidal',
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isTrack) return
    if (isCurrentTrack && isPlaying) pause()
    else void play(track)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(track)
  }

  const href =
    item.type === 'album'
      ? `/album/${encodeURIComponent(item.id)}`
      : item.type === 'artist'
        ? `/artist/${encodeURIComponent(item.artistId || item.id)}`
        : `/artist/${encodeURIComponent(item.artistId || '')}`

  const isArtist = item.type === 'artist'

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-secondary/30 p-4 transition-all duration-300 hover:bg-secondary/70">
        <div
          className={cn(
            'relative aspect-square mb-4 overflow-hidden shadow-lg',
            isArtist ? 'rounded-full' : 'rounded-md',
          )}
        >
          <Image
            src={item.artworkUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {isTrack && (
            <div
              className={cn(
                'absolute inset-0 flex items-end justify-end p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200',
                isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              <Button
                size="icon"
                onClick={handlePlayClick}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 transition-transform shadow-xl"
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{item.name}</h3>
              {showArtist && !isArtist && (
                <p className="truncate text-sm text-muted-foreground">{item.artistName}</p>
              )}
              {item.trackCount !== undefined && item.type === 'album' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.trackCount} tracks
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
                  isFavorite(item.id) && 'opacity-100 text-primary',
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
