import { NextResponse } from 'next/server'
import { getArtistById } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const artist = await getArtistById(id)
  if (!artist) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(artist)
}
