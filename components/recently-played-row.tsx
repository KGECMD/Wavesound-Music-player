'use client'

import { useEffect, useState } from 'react'
import { getRecentlyPlayed } from '@/lib/library-db'
import type { Track, MusicItem } from '@/lib/types'
import { MusicGrid } from './music-grid'
import { SectionHeader } from './section-header'

function trackToItem(t: Track): MusicItem {
  return {
    id: t.id,
    type: 'track',
    name: t.name,
    artistName: t.artistName,
    artistId: t.artistId,
    albumId: t.albumId,
    artworkUrl: t.artworkUrl,
    duration: t.duration,
    source: 'tidal',
  }
}

export function RecentlyPlayedRow() {
  const [items, setItems] = useState<MusicItem[]>([])

  useEffect(() => {
    void (async () => {
      const tracks = await getRecentlyPlayed(15)
      setItems(tracks.map(trackToItem))
    })()
  }, [])

  if (!items.length) return null

  return (
    <section>
      <SectionHeader title="Recently Played" href="/library" />
      <MusicGrid items={items} />
    </section>
  )
}
