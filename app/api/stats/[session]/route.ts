import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
function variance(arr: number[]) {
  if (arr.length < 2) return null
  const m = mean(arr)
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)
}
function stdev(arr: number[]) {
  const v = variance(arr)
  return v !== null ? Math.sqrt(v) : null
}
function verdict(total: number, avgDur: number | null, avgGap: number | null, varGap: number | null) {
  if (total < 5 || avgDur === null || avgGap === null) return 'waiting'
  const v = varGap ?? 9999
  if (avgDur < 25 && avgGap < 40 && v < 200)         return 'macro'
  if (avgDur < 35 || (avgGap < 70 && v < 500))        return 'suspect'
  if (v > 800 && avgDur > 40)                         return 'human'
  return 'inconclusive'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  const auth = req.cookies.get('dashboard_auth')?.value
  if (auth !== process.env.DASHBOARD_PASSWORD)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { session } = await params
  const rawEvents = await redis.lrange<string>(`session:${session}:events`, 0, -1)
  const meta      = await redis.get<any>(`session:${session}:meta`)

  const events = rawEvents.map(e => typeof e === 'string' ? JSON.parse(e) : e).reverse()

  const durs: number[] = events.filter((e: any) => e.dur !== null && e.dur !== undefined).map((e: any) => e.dur)
  const gaps: number[] = events.filter((e: any) => e.gap !== null && e.gap !== undefined).map((e: any) => e.gap)

  const avgDur = durs.length ? Math.round(mean(durs)) : null
  const avgGap = gaps.length ? Math.round(mean(gaps)) : null
  const varGap = gaps.length > 1 ? Math.round(variance(gaps)!) : null
  const sdGap  = gaps.length > 1 ? Math.round(stdev(gaps)!)  : null

  return NextResponse.json({
    session,
    meta,
    events: events.slice(0, 100), // últimos 100 para o log
    stats: {
      total:    events.length,
      avg_dur:  avgDur,
      avg_gap:  avgGap,
      variance: varGap,
      stdev:    sdGap,
      verdict:  verdict(events.length, avgDur, avgGap, varGap),
    }
  })
}
