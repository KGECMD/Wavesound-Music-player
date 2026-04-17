'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Pause, Heart, Music as MusicIcon } from 'lucide-react'
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
  // Any track can be played — the audio provider will resolve a stream URL
  // on demand if one isn't embedded on the item already.
  const canPlay = isTrack

  const track: Track = {
    id: item.id,
    name: item.name,
    artistName: item.artistName,
    artistId: item.artistId || '',
    albumId: item.albumId,
    artworkUrl: item.artworkUrl,
    streamUrl: item.streamUrl,
    duration: item.duration,
    isHiRes: item.isHiRes,
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
        : item.albumId
          ? `/album/${item.albumId}`
          : item.artistId
            ? `/artist/${item.artistId}`
            : '#'

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-secondary/40 p-3 transition-all duration-300 hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
        {/* Artwork */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg shadow-md bg-muted">
          {item.artworkUrl ? (
            <Image
              src={item.artworkUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MusicIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {/* Hi-res badge */}
          {item.isHiRes && (
            <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground font-semibold tracking-wide">
              HI-RES
            </span>
          )}

          {/* Play Button Overlay */}
          {canPlay && (
            <div
              className={cn(
                'absolute inset-0 flex items-end justify-end p-3 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-200',
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

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {showArtist && (
                <p className="truncate text-sm text-muted-foreground">
                  {item.artistName}
                </p>
              )}
              {item.type === 'album' && item.trackCount !== undefined && (
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
