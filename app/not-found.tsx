import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
        <Music className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          {`The page you're looking for doesn't exist or has been moved.`}
        </p>
        <Button asChild size="lg">
          <Link href="/">Go Back Home</Link>
        </Button>
      </main>
    </div>
  )
}
