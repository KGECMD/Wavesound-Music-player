'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Search, Music, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debouncedTerm.trim()) {
        router.push(`/search?q=${encodeURIComponent(debouncedTerm.trim())}`)
      }
    },
    [debouncedTerm, router]
  )

  // Auto-search on debounced term change
  useEffect(() => {
    if (debouncedTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(debouncedTerm.trim())}`)
    }
  }, [debouncedTerm, router])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:block text-xl font-bold text-foreground">Wavesound</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search songs, albums, artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </form>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/favorites">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Favorites</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
