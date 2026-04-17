'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import type { Track } from '@/lib/types'

interface PlayOptions {
  /**
   * Replace the playback queue with this list of tracks. The `track` argument
   * passed to `play()` must appear in this list (by id). If it doesn't, it's
   * prepended.
   */
  queue?: Track[]
  /**
   * Start at this index in the queue. Only used if `queue` is provided.
   * Defaults to the index of `track` inside the queue.
   */
  startIndex?: number
}

interface AudioPlayerContextType {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  queue: Track[]
  queueIndex: number
  play: (track: Track, options?: PlayOptions) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  togglePlay: () => void
  playNext: () => void
  playPrev: () => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return context
}

function isPlayable(track: Track): boolean {
  return track.source === 'audius' && !!track.streamUrl
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeBeforeMuteRef = useRef<number>(0.7)

  const currentTrack = queueIndex >= 0 ? queue[queueIndex] ?? null : null

  // Keep refs to latest state/handlers so audio event listeners don't need to
  // be re-bound on every render.
  const stateRef = useRef({ queue, queueIndex, currentTrack })
  stateRef.current = { queue, queueIndex, currentTrack }

  // Mount audio element once
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const handleTimeUpdate = () => setProgress(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleEnded = () => {
      setProgress(0)
      const { queue: q, queueIndex: idx } = stateRef.current
      const next = idx + 1
      if (next < q.length) {
        setQueueIndex(next)
      } else {
        setIsPlaying(false)
      }
    }

    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
      const { currentTrack: ct } = stateRef.current
      console.error('Audio playback error', ct?.id)
      toast.error('Playback failed', {
        description: ct ? `Couldn't play "${ct.name}". The stream may be unavailable.` : undefined,
      })
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
    }
  }, [])

  // When the current track changes, load + play it.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!currentTrack) {
      audio.pause()
      audio.removeAttribute('src')
      setProgress(0)
      setDuration(0)
      setIsPlaying(false)
      setIsLoading(false)
      return
    }
    if (!isPlayable(currentTrack)) {
      // Non-playable source (e.g. Spotify embed). Clear audio element and show a toast.
      audio.pause()
      audio.removeAttribute('src')
      setIsPlaying(false)
      setIsLoading(false)
      toast.info(`"${currentTrack.name}" can't be streamed here`, {
        description: 'This track is available via its external source only.',
      })
      return
    }
    setIsLoading(true)
    setProgress(0)
    setDuration(currentTrack.duration || 0)
    audio.src = currentTrack.streamUrl!
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.catch((err) => {
        console.error('Play error:', err)
        setIsLoading(false)
        setIsPlaying(false)
      })
    }
    // currentTrack's id drives this effect — changing within the same track is a no-op.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  // Keep the audio element's volume / mute in sync with state.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = isMuted
  }, [volume, isMuted])

  const play = useCallback((track: Track, options?: PlayOptions) => {
    const providedQueue = options?.queue
    if (providedQueue && providedQueue.length > 0) {
      // Use the provided queue.
      let nextQueue = providedQueue
      let idx = options?.startIndex
      if (idx === undefined || idx < 0 || idx >= nextQueue.length) {
        idx = nextQueue.findIndex((t) => t.id === track.id)
      }
      if (idx < 0) {
        nextQueue = [track, ...nextQueue]
        idx = 0
      }
      setQueue(nextQueue)
      setQueueIndex(idx)
      return
    }
    // No queue given — if the track is already in the current queue, jump to it.
    // Otherwise replace the queue with just this track.
    setQueue((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === track.id)
      if (existingIdx >= 0) {
        setQueueIndex(existingIdx)
        return prev
      }
      setQueueIndex(0)
      return [track]
    })
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  const resume = useCallback(() => {
    if (!audioRef.current || !currentTrack) return
    audioRef.current.play().catch((err) => {
      console.error('Resume error:', err)
      setIsLoading(false)
      setIsPlaying(false)
    })
  }, [currentTrack])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clamped)
    if (clamped > 0) {
      setIsMuted(false)
      volumeBeforeMuteRef.current = clamped
    }
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        volumeBeforeMuteRef.current = volume > 0 ? volume : 0.7
      }
      return !prev
    })
  }, [volume])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    if (isPlaying) {
      pause()
    } else {
      resume()
    }
  }, [isPlaying, pause, resume, currentTrack])

  const playNext = useCallback(() => {
    setQueueIndex((idx) => {
      if (idx < 0) return idx
      return idx + 1 < queue.length ? idx + 1 : idx
    })
  }, [queue.length])

  const playPrev = useCallback(() => {
    // If we're more than 3s into the track, restart it instead of going back.
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      setProgress(0)
      return
    }
    setQueueIndex((idx) => (idx > 0 ? idx - 1 : idx))
  }, [])

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue((prev) => {
      const removeIdx = prev.findIndex((t) => t.id === trackId)
      if (removeIdx < 0) return prev
      const next = prev.filter((_, i) => i !== removeIdx)
      setQueueIndex((idx) => {
        if (idx < 0) return idx
        if (removeIdx < idx) return idx - 1
        if (removeIdx === idx) {
          // Stop playback if the current track was removed.
          return Math.min(idx, next.length - 1)
        }
        return idx
      })
      return next
    })
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setQueueIndex(-1)
  }, [])

  // Keyboard shortcuts: space = play/pause, ←/→ = seek 5s,
  // shift + ←/→ = prev/next, ↑/↓ = volume, m = mute.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return
        }
      }
      switch (e.key) {
        case ' ':
          if (currentTrack) {
            e.preventDefault()
            togglePlay()
          }
          break
        case 'ArrowLeft':
          if (!currentTrack) return
          e.preventDefault()
          if (e.shiftKey) {
            playPrev()
          } else {
            seek(Math.max(0, progress - 5))
          }
          break
        case 'ArrowRight':
          if (!currentTrack) return
          e.preventDefault()
          if (e.shiftKey) {
            playNext()
          } else {
            seek(Math.min(duration || progress + 5, progress + 5))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(volume + 0.05)
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(volume - 0.05)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentTrack,
    togglePlay,
    playPrev,
    playNext,
    seek,
    progress,
    duration,
    volume,
    setVolume,
    toggleMute,
  ])

  const value = useMemo<AudioPlayerContextType>(
    () => ({
      currentTrack: currentTrack ?? null,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      isMuted,
      queue,
      queueIndex,
      play,
      pause,
      resume,
      seek,
      setVolume,
      toggleMute,
      togglePlay,
      playNext,
      playPrev,
      removeFromQueue,
      clearQueue,
    }),
    [
      currentTrack,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      isMuted,
      queue,
      queueIndex,
      play,
      pause,
      resume,
      seek,
      setVolume,
      toggleMute,
      togglePlay,
      playNext,
      playPrev,
      removeFromQueue,
      clearQueue,
    ]
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}
