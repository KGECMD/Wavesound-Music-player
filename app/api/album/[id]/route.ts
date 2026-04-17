import { NextResponse } from 'next/server'
import { getAlbumById } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const album = await getAlbumById(id)
  if (!album) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(album)
}
