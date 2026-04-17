'use client'

import { Play } from 'lucide-react'
import { useAudioPlayer } from './audio-player-provider'
import { Button } from '@/components/ui/button'
import type { Track } from '@/lib/types'

interface PlayAllButtonProps {
  tracks: Track[]
  label?: string
}

export function PlayAllButton({ tracks, label = 'Play' }: PlayAllButtonProps) {
  const { play } = useAudioPlayer()

  if (!tracks.length) return null

  return (
    <Button
      onClick={() => void play(tracks[0], tracks)}
      size="lg"
      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform gap-2 px-6"
    >
      <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
      {label}
    </Button>
  )
}
