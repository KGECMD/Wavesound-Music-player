'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Library, Music, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Your Library', icon: Library },
  { href: '/favorites', label: 'Liked Songs', icon: Heart },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <Link href="/" className="flex items-center gap-2 px-6 h-16">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Music className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Wavesound</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <p>Hi-Fi streaming — FLAC / Hi-Res.</p>
        <p className="mt-1">Powered by community Tidal proxies.</p>
      </div>
    </aside>
  )
}
