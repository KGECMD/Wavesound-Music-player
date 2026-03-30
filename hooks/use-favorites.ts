'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Track } from '@/lib/types'

const FAVORITES_KEY = 'soundwave-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Track[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch {
        setFavorites([])
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const addFavorite = useCallback((track: Track) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === track.id)) return prev
      return [...prev, track]
    })
  }, [])

  const removeFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== trackId))
  }, [])

  const isFavorite = useCallback(
    (trackId: string) => favorites.some((f) => f.id === trackId),
    [favorites]
  )

  const toggleFavorite = useCallback(
    (track: Track) => {
      if (isFavorite(track.id)) {
        removeFavorite(track.id)
      } else {
        addFavorite(track)
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  )

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  }
}
