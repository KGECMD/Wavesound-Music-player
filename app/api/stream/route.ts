import { NextResponse } from 'next/server'
import { getStreamUrl } from '@/lib/music-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ url: null }, { status: 400 })
  const url = await getStreamUrl(id)
  return NextResponse.json({ url })
}
