import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = req.cookies.get('dashboard_auth')?.value
  if (auth !== process.env.DASHBOARD_PASSWORD)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // pega as 50 sessões mais recentes
  const sessions = await kv.zrange<string>('sessions', 0, -1, { rev: true }) as string[]
  const top50 = sessions.slice(0, 50)

  const metas = await Promise.all(
    top50.map(s => kv.get<any>(`session:${s}:meta`))
  )

  return NextResponse.json(
    top50.map((s, i) => ({ session: s, ...(metas[i] || {}) }))
  )
}
