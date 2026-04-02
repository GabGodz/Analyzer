import { redis } from '@/app/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    api_key: string
    session: string
    key: string
    dur: number | null
    gap: number | null
  }

  if (body.api_key !== process.env.API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { session, key, dur, gap } = body
  if (!session || !key) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const ts = Date.now()
  const eventJson = JSON.stringify({ key, dur, gap, ts })
  const sessionKey = `s:${session}:events`
  const metaKey    = `s:${session}:meta`
  const ttl        = 60 * 60 * 24

  await redis.lpush(sessionKey, eventJson)
  await redis.ltrim(sessionKey, 0, 499)
  await redis.expire(sessionKey, ttl)
  await redis.zadd('sessions', { score: ts, member: session })

  const existing = await redis.get<{ started: number }>(metaKey)
  await redis.set(metaKey, { session, last_seen: ts, started: existing?.started ?? ts }, { ex: ttl })

  return NextResponse.json({ ok: true })
}