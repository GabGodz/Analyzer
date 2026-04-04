import { redis } from '@/app/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

function isAuthed(req: NextRequest) {
  return req.cookies.get('auth')?.value === process.env.DASHBOARD_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const keys = (await redis.keys('integrity:*')) as string[]
  const records = await Promise.all(
    keys.map(async k => {
      const hwid = k.replace('integrity:', '')
      const rec  = await redis.get<{ hash: string; registered: number }>(k)
      return { hwid, hash: rec?.hash ?? '', registered: rec?.registered ?? 0 }
    })
  )

  return NextResponse.json(records.sort((a, b) => b.registered - a.registered))
}
