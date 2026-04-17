'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SpotifyEmbedProps {
  trackId: string
  onClose?: () => void
}

export function SpotifyEmbed({ trackId, onClose }: SpotifyEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-muted-foreground">
            Playing via Spotify - Full playback requires Spotify account
          </span>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="pb-3">
          <iframe
            src={`https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className={`rounded-xl transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>
    </div>
  )
}

interface SpotifySearchLinkProps {
  query: string
  className?: string
}

export function SpotifySearchLink({ query, className }: SpotifySearchLinkProps) {
  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`
  
  return (
    <a
      href={spotifySearchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Search on Spotify
    </a>
  )
}
