import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  href?: string
}

export function SectionHeader({ title, href }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
