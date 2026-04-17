'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Music, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Header() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debouncedTerm.trim()) {
        router.push(`/search?q=${encodeURIComponent(debouncedTerm.trim())}`)
      }
    },
    [debouncedTerm, router],
  )

  useEffect(() => {
    if (debouncedTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(debouncedTerm.trim())}`)
    }
  }, [debouncedTerm, router])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-secondary/60"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-secondary/60"
              onClick={() => router.forward()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Link href="/" className="flex md:hidden items-center gap-2 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Wavesound</span>
          </Link>

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

          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/favorites">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Liked Songs</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
