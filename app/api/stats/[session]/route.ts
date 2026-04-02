import { redis } from '@/app/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

function isAuthed(req: NextRequest) {
  return req.cookies.get('auth')?.value === process.env.DASHBOARD_PASSWORD
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function sampleVariance(arr: number[]): number | null {
  if (arr.length < 2) return null
  const m = mean(arr)
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)
}

function calcVerdict(total: number, avgDur: number | null, avgGap: number | null, varGap: number | null): string {
  if (total < 5 || avgDur === null || avgGap === null) return 'waiting'
  const v = varGap ?? 9999
  if (avgDur < 25 && avgGap < 40 && v < 200) return 'macro'
  if (avgDur < 35 || (avgGap < 70 && v < 500)) return 'suspect'
  if (v > 800 && avgDur > 40) return 'human'
  return 'inconclusive'
}

type KeyEvent = { key: string; dur: number | null; gap: number | null; ts: number }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { session } = await params

  const raw  = (await redis.lrange(`s:${session}:events`, 0, -1)) as string[]
  const meta = await redis.get(`s:${session}:meta`)

  const events: KeyEvent[] = raw
    .map(e => (typeof e === 'string' ? JSON.parse(e) : e) as KeyEvent)
    .reverse()

  const durs = events.filter(e => e.dur !== null).map(e => e.dur as number)
  const gaps = events.filter(e => e.gap !== null).map(e => e.gap as number)

  const avgDur = durs.length ? Math.round(mean(durs)) : null
  const avgGap = gaps.length ? Math.round(mean(gaps)) : null
  const varGap = gaps.length > 1 ? Math.round(sampleVariance(gaps) ?? 0) : null
  const stdGap = varGap !== null ? Math.round(Math.sqrt(varGap)) : null

  return NextResponse.json({
    session,
    meta,
    events: events.slice(0, 100),
    stats: {
      total:    events.length,
      avg_dur:  avgDur,
      avg_gap:  avgGap,
      variance: varGap,
      stdev:    stdGap,
      verdict:  calcVerdict(events.length, avgDur, avgGap, varGap),
    },
  })
}
