import { redis } from '@/app/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

function isAuthed(req: NextRequest) {
  return req.cookies.get('auth')?.value === process.env.DASHBOARD_PASSWORD
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hwid: string }> }
) {
  const apiKey = req.nextUrl.searchParams.get('api_key')
  if (apiKey !== process.env.API_KEY && !isAuthed(req))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { hwid } = await params
  const record = await redis.get<{ hash: string; registered: number }>(`integrity:${hwid}`)

  if (!record)
    return NextResponse.json({ status: 'not_found' })

  return NextResponse.json({ status: 'ok', hash: record.hash, registered: record.registered })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ hwid: string }> }
) {
  if (!isAuthed(req))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { hwid } = await params
  await redis.del(`integrity:${hwid}`)

  return NextResponse.json({ ok: true })
}
