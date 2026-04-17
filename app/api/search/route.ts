import { NextResponse } from 'next/server'
import { searchMusic } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const results = await searchMusic(q)
  return NextResponse.json(results)
}
