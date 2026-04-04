'use client'
import { useEffect, useState, useCallback } from 'react'
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

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
  @keyframes pulse-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.4; } }
  .row-in { animation: fadeIn 0.2s ease both; }
  .spin { animation: spin 0.7s linear infinite; display: inline-block; }
  .blink { animation: blink 1.2s ease infinite; }
`

export default function DashboardPage() {
  const [sessions, setSessions]     = useState<SessionMeta[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const router = useRouter()

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/sessions')
      if (res.status === 401) { router.push('/'); return }
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
      if (showRefresh) setTimeout(() => setRefreshing(false), 400)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/login', { method: 'DELETE' })
    router.push('/')
  }

  async function deleteSession(session: string) {
    setDeleting(session)
    await fetch(`/api/delete/${session}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.session !== session))
    setDeleting(null)
    setConfirmDel(null)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>
              MACRO ANALYZER
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
              {loading
                ? <span className="blink">carregando...</span>
                : `${sessions.length} sessões registradas`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dashboard/integrity" style={{ ...btnStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              SHA-256
            </Link>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ ...btnStyle, minWidth: 108, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <span className={refreshing ? 'spin' : ''} style={{ fontSize: 14, lineHeight: 1 }}>↻</span>
              {refreshing ? 'Atualizando' : 'Atualizar'}
            </button>
            <button
              onClick={logout}
              disabled={loggingOut}
              style={{ ...btnStyle, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {loggingOut ? <><span className="spin" style={{ fontSize: 11 }}>↻</span> Saindo</> : 'Sair'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={theadStyle}>
            <span>Sessão</span>
            <span>Início</span>
            <span>Último evento</span>
            <span style={{ textAlign: 'right' }}>Ações</span>
          </div>

          {loading && (
            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 160px', gap: 12, opacity: 1 - i * 0.28 }}>
                  {[80, 130, 130, 90].map((w, j) => (
                    <div key={j} style={{
                      height: 11, borderRadius: 4,
                      background: 'var(--border)', width: w,
                      animation: `blink ${1 + j * 0.15}s ease infinite`,
                    }} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div style={emptyStyle}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display: 'inline-block', width: 7, height: 7,
                    borderRadius: '50%', background: 'var(--muted)',
                    animation: `pulse-dot 1.4s ease ${i * 0.22}s infinite`,
                  }} />
                ))}
              </div>
              Aguardando sessões. Inicie o GodEye nos clientes.
            </div>
          )}

          {sessions.map((s, i) => (
            <div
              key={s.session}
              className="row-in"
              style={{
                ...rowStyle,
                borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <span style={{ color: 'var(--blue)', fontWeight: 700, fontFamily: 'Courier New, monospace', fontSize: 12 }}>
                {s.session}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{s.started ? fmt(s.started) : '—'}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{s.last_seen ? fmt(s.last_seen) : '—'}</span>

              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                <Link href={`/dashboard/${s.session}`} style={linkBtnStyle}>Ver →</Link>

                {confirmDel === s.session ? (
                  <>
                    <button
                      onClick={() => deleteSession(s.session)}
                      disabled={deleting === s.session}
                      style={deleteBtnConfirmStyle}
                    >
                      {deleting === s.session
                        ? <span className="spin" style={{ fontSize: 11 }}>↻</span>
                        : 'Confirmar'}
                    </button>
                    <button onClick={() => setConfirmDel(null)} style={cancelBtnStyle}>✕</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDel(s.session)} style={deleteBtnStyle}>
                    Deletar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--panel)', border: '0.5px solid var(--border)',
  borderRadius: 6, color: 'var(--muted)', padding: '7px 14px', fontSize: 12,
  cursor: 'pointer',
}
const theadStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '110px 1fr 1fr 160px',
  padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
  fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em',
}
const rowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '110px 1fr 1fr 160px',
  padding: '11px 16px', alignItems: 'center',
}
const emptyStyle: React.CSSProperties = {
  padding: '32px 24px', color: 'var(--muted)', textAlign: 'center', fontSize: 13,
}
const linkBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
  background: '#1e3a5f', border: '0.5px solid var(--blue)',
  borderRadius: 5, color: 'var(--blue)', fontSize: 11, fontWeight: 700,
  textDecoration: 'none',
}
const deleteBtnStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: 'rgba(232,69,69,.08)', border: '0.5px solid rgba(232,69,69,.35)',
  borderRadius: 5, color: 'var(--red)',
}
const deleteBtnConfirmStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: 'rgba(232,69,69,.2)', border: '0.5px solid var(--red)',
  borderRadius: 5, color: 'var(--red)', minWidth: 76,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
const cancelBtnStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 11, cursor: 'pointer',
  background: 'var(--panel)', border: '0.5px solid var(--border)',
  borderRadius: 5, color: 'var(--muted)',
}
