import { NextResponse } from 'next/server'
import { getTrendingTracks } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre') ?? 'all'
  const limit = Number(searchParams.get('limit') ?? '24')
  const tracks = await getTrendingTracks(genre, Number.isFinite(limit) ? limit : 24)
  return NextResponse.json(tracks)
}
