import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.DASHBOARD_PASSWORD)
    return NextResponse.json({ error: 'wrong password' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('dashboard_auth', password, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8h
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('dashboard_auth')
  return res
}
