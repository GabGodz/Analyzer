import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

function isAuthed(req: NextRequest) {
  return req.cookies.get('auth')?.value === process.env.DASHBOARD_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const all  = (await redis.zrange('sessions', 0, -1, { rev: true })) as string[]
  const top  = all.slice(0, 50)
  const metas = await Promise.all(top.map(s => redis.get(`s:${s}:meta`)))

  return NextResponse.json(
    top.map((s, i) => ({ session: s, ...(metas[i] as object ?? {}) }))
  )
}
