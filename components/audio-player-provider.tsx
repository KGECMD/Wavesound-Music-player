'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { StreamQuality, Track } from '@/lib/types'
import {
  downloadTrack as downloadViaApi,
  resolveStream,
} from '@/lib/music-api'
import {
  getPreferredQuality,
  loadQueue,
  recordPlay,
  saveQueue,
  setPreferredQuality,
} from '@/lib/library-db'

interface AudioPlayerContextType {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  isLoading: boolean
  quality: StreamQuality
  queue: Track[]
  queueIndex: number
  play: (track: Track, queue?: Track[]) => Promise<void>
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  togglePlay: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  setQuality: (q: StreamQuality) => Promise<void>
  download: () => Promise<boolean>
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return context
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [quality, setQualityState] = useState<StreamQuality>('LOSSLESS')
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Ref mirror of queueIndex/queue so the `ended` handler sees the latest value.
  const queueIndexRef = useRef(queueIndex)
  const queueRef = useRef(queue)
  const qualityRef = useRef(quality)
  queueIndexRef.current = queueIndex
  queueRef.current = queue
  qualityRef.current = quality

  // ---------- init audio element once ----------
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.volume = volume
    audioRef.current = audio

    const onTime = () => setProgress(audio.currentTime)
    const onDur = () => setDuration(audio.duration || 0)
    const onEnd = () => {
      setIsPlaying(false)
      setProgress(0)
      // Advance to next track in queue (if any).
      const nextIdx = queueIndexRef.current + 1
      const next = queueRef.current[nextIdx]
      if (next) void playResolved(next, nextIdx)
    }
    const onCanPlay = () => setIsLoading(false)
    const onWait = () => setIsLoading(true)
    const onErr = () => {
      setIsLoading(false)
      setIsPlaying(false)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('audio error', audio.error)
      }
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('waiting', onWait)
    audio.addEventListener('error', onErr)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('waiting', onWait)
      audio.removeEventListener('error', onErr)
      audio.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- hydrate preferred quality + saved queue ----------
  useEffect(() => {
    void (async () => {
      const q = await getPreferredQuality()
      setQualityState(q)
      const savedQueue = await loadQueue()
      if (savedQueue.length) setQueue(savedQueue)
    })()
  }, [])

  // Persist queue on change so a reload keeps the up-next list.
  useEffect(() => {
    void saveQueue(queue)
  }, [queue])

  // ---------- core playback ----------

  const playResolved = useCallback(
    async (track: Track, index: number) => {
      const audio = audioRef.current
      if (!audio) return
      setIsLoading(true)
      setCurrentTrack(track)
      setQueueIndex(index)
      setProgress(0)
      setDuration(track.duration || 0)

      const stream = await resolveStream(track.id, qualityRef.current)
      if (!stream) {
        setIsLoading(false)
        setIsPlaying(false)
        return
      }
      audio.src = stream.url
      try {
        await audio.play()
        setIsPlaying(true)
        void recordPlay(track)
      } catch (err) {
        setIsPlaying(false)
        setIsLoading(false)
        if (process.env.NODE_ENV !== 'production') {
          console.warn('play() rejected', err)
        }
      }
    },
    [],
  )

  const play = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      let effectiveQueue = queueRef.current
      let effectiveIndex = effectiveQueue.findIndex((t) => t.id === track.id)
      if (newQueue && newQueue.length) {
        effectiveQueue = newQueue
        effectiveIndex = newQueue.findIndex((t) => t.id === track.id)
        if (effectiveIndex === -1) {
          effectiveQueue = [track, ...newQueue]
          effectiveIndex = 0
        }
        setQueue(effectiveQueue)
      } else if (effectiveIndex === -1) {
        effectiveQueue = [...effectiveQueue, track]
        effectiveIndex = effectiveQueue.length - 1
        setQueue(effectiveQueue)
      }
      await playResolved(track, effectiveIndex)
    },
    [playResolved],
  )

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false)
    })
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) audioRef.current.volume = newVolume
    setVolumeState(newVolume)
  }, [])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    if (isPlaying) pause()
    else resume()
  }, [currentTrack, isPlaying, pause, resume])

  const next = useCallback(async () => {
    const idx = queueIndexRef.current + 1
    const nextTrack = queueRef.current[idx]
    if (nextTrack) await playResolved(nextTrack, idx)
  }, [playResolved])

  const previous = useCallback(async () => {
    // Mimic Spotify: first 3s of track rewinds to 0, otherwise go to prev track.
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      setProgress(0)
      return
    }
    const idx = Math.max(queueIndexRef.current - 1, 0)
    const prev = queueRef.current[idx]
    if (prev) await playResolved(prev, idx)
  }, [playResolved])

  const setQuality = useCallback(async (q: StreamQuality) => {
    setQualityState(q)
    await setPreferredQuality(q)

    // If something is currently playing, re-resolve at the new quality while
    // preserving progress.
    const audio = audioRef.current
    const track = currentTrack
    if (!audio || !track) return
    const wasPlaying = !audio.paused
    const at = audio.currentTime
    const stream = await resolveStream(track.id, q)
    if (!stream) return
    audio.src = stream.url
    audio.currentTime = at
    if (wasPlaying) {
      try {
        await audio.play()
      } catch {
        /* ignore */
      }
    }
  }, [currentTrack])

  const download = useCallback(async () => {
    if (!currentTrack) return false
    return downloadViaApi(currentTrack, qualityRef.current)
  }, [currentTrack])

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        duration,
        volume,
        quality,
        queue,
        queueIndex,
        play,
        pause,
        resume,
        seek,
        setVolume,
        togglePlay,
        next,
        previous,
        setQuality,
        download,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
