import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export async function GET(req: NextRequest) {
  const auth = req.cookies.get('dashboard_auth')?.value
  if (auth !== process.env.DASHBOARD_PASSWORD)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sessions = (await redis.zrange('sessions', 0, -1, { rev: true })) as unknown as string[]
  const top50 = sessions.slice(0, 50)

  const metas = await Promise.all(
    top50.map(s => redis.get<any>(`session:${s}:meta`))
  )

  return NextResponse.json(
    top50.map((s, i) => ({ session: s, ...(metas[i] || {}) }))
  )
}
