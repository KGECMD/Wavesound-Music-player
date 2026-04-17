'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  addFavorite as dbAdd,
  listFavorites as dbList,
  removeFavorite as dbRemove,
} from '@/lib/library-db'
import type { Track } from '@/lib/types'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Track[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    void (async () => {
      const list = await dbList()
      setFavorites(list)
      setIsLoaded(true)
    })()
  }, [])

  const addFavorite = useCallback((track: Track) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === track.id)) return prev
      void dbAdd(track)
      return [...prev, track]
    })
  }, [])

  const removeFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => {
      if (!prev.some((f) => f.id === trackId)) return prev
      void dbRemove(trackId)
      return prev.filter((f) => f.id !== trackId)
    })
  }, [])

  const isFavorite = useCallback(
    (trackId: string) => favorites.some((f) => f.id === trackId),
    [favorites],
  )

  const toggleFavorite = useCallback(
    (track: Track) => {
      if (isFavorite(track.id)) removeFavorite(track.id)
      else addFavorite(track)
    },
    [isFavorite, addFavorite, removeFavorite],
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
