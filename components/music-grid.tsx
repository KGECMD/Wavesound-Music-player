import { MusicCard } from './music-card'
import type { MusicItem } from '@/lib/types'

interface MusicGridProps {
  items: MusicItem[]
  showArtist?: boolean
}

export function MusicGrid({ items, showArtist = true }: MusicGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <MusicCard key={item.id} item={item} showArtist={showArtist} />
      ))}
    </div>
  )
}
