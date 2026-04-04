import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hwid: string }> }
) {
  const apiKey = req.nextUrl.searchParams.get('api_key')
  if (apiKey !== process.env.API_KEY)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { hwid } = await params
  const record = await redis.get<{ hash: string; registered: number }>(`integrity:${hwid}`)

  if (!record)
    return NextResponse.json({ status: 'not_found' })

  return NextResponse.json({ status: 'ok', hash: record.hash, registered: record.registered })
}
