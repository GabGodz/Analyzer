'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type IntegrityRecord = {
  hwid: string
  hash: string
  registered: number
}

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
  .row-in { animation: fadeIn .18s ease both; }
  .spin { animation: spin .7s linear infinite; display: inline-block; }
`

function fmt(ts: number) {
  return new Date(ts).toLocaleString('pt-BR')
}

export default function IntegrityPage() {
  const [records, setRecords]     = useState<IntegrityRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [resetting, setResetting] = useState<string | null>(null)
  const [confirm, setConfirm]     = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const load = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    try {
      const res = await fetch('/api/integrity-list')
      if (res.status === 401) { router.push('/'); return }
      setRecords(await res.json())
    } catch { setRecords([]) }
    finally {
      setLoading(false)
      if (showSpin) setTimeout(() => setRefreshing(false), 400)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  async function resetHash(hwid: string) {
    setResetting(hwid)
    await fetch(`/api/integrity/${encodeURIComponent(hwid)}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.hwid !== hwid))
    setResetting(null)
    setConfirm(null)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: 12 }}>← Sessões</Link>
              <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>
                INTEGRIDADE SHA-256
              </div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
              {loading ? 'carregando...' : `${records.length} HWIDs registrados`}
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 6, minWidth: 108 }}
          >
            <span className={refreshing ? 'spin' : ''} style={{ fontSize: 14 }}>↻</span>
            {refreshing ? 'Atualizando' : 'Atualizar'}
          </button>
        </div>

        <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div style={theadStyle}>
            <span>HWID</span>
            <span>Hash SHA-256</span>
            <span>Registrado</span>
            <span style={{ textAlign: 'right' }}>Ação</span>
          </div>

          {loading && (
            <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>Carregando...</div>
          )}

          {!loading && records.length === 0 && (
            <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
              Nenhum HWID registrado ainda.
            </div>
          )}

          {records.map((r, i) => (
            <div key={r.hwid} className="row-in" style={{
              ...rowStyle,
              borderBottom: i < records.length - 1 ? '0.5px solid var(--border)' : 'none',
              animationDelay: `${i * 0.04}s`,
            }}>
              <span style={{ color: 'var(--blue)', fontFamily: 'Courier New', fontSize: 11, fontWeight: 700, wordBreak: 'break-all' }}>
                {r.hwid}
              </span>
              <span style={{ color: 'var(--muted)', fontFamily: 'Courier New', fontSize: 10, wordBreak: 'break-all' }}>
                {r.hash.slice(0, 16)}…
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                {r.registered ? fmt(r.registered) : '—'}
              </span>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                {confirm === r.hwid ? (
                  <>
                    <button
                      onClick={() => resetHash(r.hwid)}
                      disabled={resetting === r.hwid}
                      style={confirmBtnStyle}
                    >
                      {resetting === r.hwid
                        ? <span className="spin" style={{ fontSize: 11 }}>↻</span>
                        : 'Confirmar reset'}
                    </button>
                    <button onClick={() => setConfirm(null)} style={cancelBtnStyle}>✕</button>
                  </>
                ) : (
                  <button onClick={() => setConfirm(r.hwid)} style={resetBtnStyle}>
                    Resetar hash
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, marginBottom: 8 }}>
            Como funciona
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
            Na primeira execução do GodEyeV4.exe em uma máquina, o SHA-256 do executável é registrado aqui vinculado ao HWID do usuário.
            Nas execuções seguintes, o hash calculado é comparado com o registrado — se divergir, uma notificação é enviada ao Discord e o programa é encerrado.
            <br /><br />
            Só clique em reset se eu lançar uma atualização do godeye.
          </div>
        </div>
      </div>
    </>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--panel)', border: '0.5px solid var(--border)',
  borderRadius: 6, color: 'var(--muted)', padding: '7px 14px', fontSize: 12, cursor: 'pointer',
}
const theadStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 140px 160px 140px',
  padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
  fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em',
}
const rowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 140px 160px 140px',
  padding: '11px 16px', alignItems: 'center', gap: 8,
}
const resetBtnStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: 'rgba(245,166,35,.08)', border: '0.5px solid rgba(245,166,35,.35)',
  borderRadius: 5, color: 'var(--amber)',
}
const confirmBtnStyle: React.CSSProperties = {
  padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: 'rgba(232,69,69,.2)', border: '0.5px solid var(--red)',
  borderRadius: 5, color: 'var(--red)', minWidth: 110,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
const cancelBtnStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 11, cursor: 'pointer',
  background: 'var(--panel)', border: '0.5px solid var(--border)',
  borderRadius: 5, color: 'var(--muted)',
}
