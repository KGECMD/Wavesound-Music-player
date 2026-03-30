'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import type { Track } from '@/lib/types'

interface AudioPlayerContextType {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
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
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    const audio = audioRef.current

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [])

  const play = useCallback((track: Track) => {
    if (!audioRef.current || !track.previewUrl) return

    if (currentTrack?.id !== track.id) {
      audioRef.current.src = track.previewUrl
      setCurrentTrack(track)
      setProgress(0)
    }

    audioRef.current.play()
    setIsPlaying(true)
  }, [currentTrack?.id])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play()
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
