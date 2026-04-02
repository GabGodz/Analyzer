'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Session = {
  session: string
  started: number
  last_seen: number
}

const VERDICT_META: Record<string, { label: string; color: string }> = {
  macro:       { label: 'MACRO',       color: 'var(--red)'   },
  suspect:     { label: 'Suspeito',    color: 'var(--amber)' },
  human:       { label: 'Humano',      color: 'var(--green)' },
  inconclusive:{ label: 'Inconclusivo',color: 'var(--muted)' },
  waiting:     { label: 'Aguardando', color: 'var(--muted)'  },
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString('pt-BR')
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const router = useRouter()

  async function load() {
    const r = await fetch('/api/sessions')
    if (r.status === 401) { router.push('/'); return }
    const data = await r.json()
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>
            MACRO ANALYZER
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>
            {sessions.length} sessões registradas
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{
            background: 'var(--panel)', border: '0.5px solid var(--border)',
            borderRadius: 6, color: 'var(--muted)', padding: '7px 14px', fontSize: 12,
          }}>
            ↻ Atualizar
          </button>
          <button onClick={logout} style={{
            background: 'var(--panel)', border: '0.5px solid var(--border)',
            borderRadius: 6, color: 'var(--muted)', padding: '7px 14px', fontSize: 12,
          }}>
            Sair
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {/* table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '120px 1fr 1fr 110px',
          padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          <span>Sessão</span>
          <span>Início</span>
          <span>Último evento</span>
          <span>Ver</span>
        </div>

        {loading && (
          <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
            Carregando...
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
            Nenhuma sessão ainda. Inicie o programa nos clientes.
          </div>
        )}

        {sessions.map((s, i) => (
          <div key={s.session} style={{
            display: 'grid', gridTemplateColumns: '120px 1fr 1fr 110px',
            padding: '12px 16px',
            borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none',
            alignItems: 'center',
          }}>
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>{s.session}</span>
            <span style={{ color: 'var(--muted)' }}>{s.started ? fmt(s.started) : '—'}</span>
            <span style={{ color: 'var(--muted)' }}>{s.last_seen ? fmt(s.last_seen) : '—'}</span>
            <Link href={`/dashboard/${s.session}`} style={{
              display: 'inline-block', padding: '5px 12px',
              background: '#1e3a5f', border: '0.5px solid var(--blue)',
              borderRadius: 5, color: 'var(--blue)', fontSize: 11, fontWeight: 700,
            }}>
              Ver relatório →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
