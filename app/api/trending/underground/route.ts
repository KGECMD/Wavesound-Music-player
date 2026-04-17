import { NextResponse } from 'next/server'
import { getUndergroundTrending } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') ?? '12')
  const tracks = await getUndergroundTrending(Number.isFinite(limit) ? limit : 12)
  return NextResponse.json(tracks)
}
