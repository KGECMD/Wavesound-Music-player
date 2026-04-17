'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Track } from '@/lib/types'

interface AudioPlayerContextType {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  isLoading: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  togglePlay: () => void
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loadTokenRef = useRef(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume
    audioRef.current.preload = 'auto'

    const audio = audioRef.current

    const handleTimeUpdate = () => setProgress(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
      console.error('Audio playback error')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('error', handleError)
      audio.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const play = useCallback(
    async (track: Track) => {
      if (!audioRef.current) return

      // Already playing this track — just resume.
      // Skip the resume path if the source hasn't been set yet (initial load in progress);
      // the pending fetch below will finish and start playback on its own.
      if (currentTrack?.id === track.id) {
        if (loadingRef.current) return
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (err) {
          console.error('Play error:', err)
        }
        return
      }

      loadingRef.current = true
      setIsLoading(true)
      setCurrentTrack(track)
      setProgress(0)
      setDuration(track.duration || 0)

      const token = ++loadTokenRef.current

      // If the track already has a resolved streamUrl (from search), use it directly.
      let streamUrl: string | null | undefined = track.streamUrl
      if (!streamUrl) {
        try {
          const res = await fetch(`/api/stream?id=${encodeURIComponent(track.id)}`, {
            cache: 'no-store',
          })
          if (res.ok) {
            const data = (await res.json()) as { url: string | null }
            streamUrl = data.url
          }
        } catch (err) {
          console.error('Stream URL fetch error:', err)
        }
      }

      // If the user started a different track while we were resolving, bail out.
      if (token !== loadTokenRef.current) return

      if (!streamUrl) {
        loadingRef.current = false
        setIsLoading(false)
        setIsPlaying(false)
        console.error('No stream URL available for track', track.id)
        return
      }

      audioRef.current.src = streamUrl
      loadingRef.current = false
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Play error:', err)
        setIsLoading(false)
      }
    },
    [currentTrack?.id],
  )

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(console.error)
    setIsPlaying(true)
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setVolumeState(newVolume)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      resume()
    }
  }, [isPlaying, pause, resume])

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        duration,
        volume,
        play,
        pause,
        resume,
        seek,
        setVolume,
        togglePlay,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}
