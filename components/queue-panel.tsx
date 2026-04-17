'use client'

import Image from 'next/image'
import { ListMusic, Play, X, Trash2 } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function QueueButton() {
  const { queue } = useAudioPlayer()
  const count = queue.length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open queue"
          className="relative"
        >
          <ListMusic className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SheetTitle>Up Next</SheetTitle>
              <SheetDescription>
                {count === 0
                  ? 'Nothing queued'
                  : `${count} track${count === 1 ? '' : 's'} in queue`}
              </SheetDescription>
            </div>
            <ClearQueueButton />
          </div>
        </SheetHeader>
        <QueueList />
      </SheetContent>
    </Sheet>
  )
}

function ClearQueueButton() {
  const { queue, clearQueue } = useAudioPlayer()
  if (queue.length === 0) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearQueue}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4 mr-1" />
      Clear
    </Button>
  )
}

function QueueList() {
  const { queue, queueIndex, play, removeFromQueue } = useAudioPlayer()

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center text-muted-foreground">
        <ListMusic className="h-10 w-10" />
        <p className="text-sm">Add tracks to play them next.</p>
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto py-2">
      {queue.map((track, index) => {
        const isCurrent = index === queueIndex
        return (
          <li
            key={`${track.id}-${index}`}
            className={cn(
              'group flex items-center gap-3 px-4 py-2 hover:bg-secondary/60',
              isCurrent && 'bg-secondary/60'
            )}
          >
            <button
              type="button"
              onClick={() => play(track, { queue, startIndex: index })}
              className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
              aria-label={`Play ${track.name}`}
            >
              <Image
                src={track.artworkUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
                  isCurrent && 'opacity-100'
                )}
              >
                <Play className="h-4 w-4 text-white fill-current" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-medium',
                  isCurrent ? 'text-primary' : 'text-foreground'
                )}
              >
                {track.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {track.artistName}
              </p>
            </div>
            <span className="hidden sm:block text-xs text-muted-foreground tabular-nums">
              {formatDuration(track.duration)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${track.name} from queue`}
              onClick={() => removeFromQueue(track.id)}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
