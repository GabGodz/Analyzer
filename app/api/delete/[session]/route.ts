import { redis } from '@/app/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

function isAuthed(req: NextRequest) {
  return req.cookies.get('auth')?.value === process.env.DASHBOARD_PASSWORD
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  if (!isAuthed(req))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { session } = await params

  await redis.del(`s:${session}:events`)
  await redis.del(`s:${session}:meta`)
  await redis.zrem('sessions', session)

  return NextResponse.json({ ok: true })
}
