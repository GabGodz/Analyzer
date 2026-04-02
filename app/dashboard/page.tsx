'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type SessionMeta = {
  session: string
  started: number
  last_seen: number
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString('pt-BR')
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [loading, setLoading]   = useState(true)
  const router = useRouter()

  async function load() {
    const res = await fetch('/api/sessions')
    if (res.status === 401) { router.push('/'); return }
    setSessions(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>
            MACRO ANALYZER
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>
            {sessions.length} sessões registradas
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnStyle}>↻ Atualizar</button>
          <button onClick={logout} style={btnStyle}>Sair</button>
        </div>
      </div>

      <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={theadStyle}>
          <span>Sessão</span><span>Início</span><span>Último evento</span><span>Ação</span>
        </div>

        {loading && <div style={emptyStyle}>Carregando...</div>}
        {!loading && sessions.length === 0 && (
          <div style={emptyStyle}>Nenhuma sessão ainda. Inicie o programa nos clientes.</div>
        )}

        {sessions.map((s, i) => (
          <div key={s.session} style={{
            ...rowStyle,
            borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none',
          }}>
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{s.session}</span>
            <span style={{ color: 'var(--muted)' }}>{s.started ? fmt(s.started) : '—'}</span>
            <span style={{ color: 'var(--muted)' }}>{s.last_seen ? fmt(s.last_seen) : '—'}</span>
            <Link href={`/dashboard/${s.session}`} style={linkBtnStyle}>
              Ver relatório →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--panel)', border: '0.5px solid var(--border)',
  borderRadius: 6, color: 'var(--muted)', padding: '7px 14px', fontSize: 12,
}
const theadStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '110px 1fr 1fr 120px',
  padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
  fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em',
}
const rowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '110px 1fr 1fr 120px',
  padding: '12px 16px', alignItems: 'center',
}
const emptyStyle: React.CSSProperties = {
  padding: 24, color: 'var(--muted)', textAlign: 'center',
}
const linkBtnStyle: React.CSSProperties = {
  display: 'inline-block', padding: '5px 12px',
  background: '#1e3a5f', border: '0.5px solid var(--blue)',
  borderRadius: 5, color: 'var(--blue)', fontSize: 11, fontWeight: 700,
}
