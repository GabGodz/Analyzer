import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    api_key: string
    hwid: string
    hash: string
  }

  if (body.api_key !== process.env.API_KEY)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!body.hwid || !body.hash)
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  await redis.set(`integrity:${body.hwid}`, {
    hash:       body.hash,
    registered: Date.now(),
  }, { ex: 60 * 60 * 24 * 90 }) // expira em 90 dias

  return NextResponse.json({ ok: true })
}
