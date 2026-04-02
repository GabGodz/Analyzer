'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Event  = { key: string; dur: number | null; gap: number | null; ts: number }
type Stats  = { total: number; avg_dur: number | null; avg_gap: number | null; variance: number | null; stdev: number | null; verdict: string }
type Report = { session: string; events: Event[]; stats: Stats; meta: any }

// ── helpers ────────────────────────────────────────────────────────────────
function classify(dur: number | null, gap: number | null) {
  if (dur === null) return { label: '—', cls: '' }
  if (dur < 20 && gap !== null && gap < 35) return { label: 'MACRO',    cls: 'macro'   }
  if (dur < 35 || (gap !== null && gap < 50)) return { label: 'Suspeito', cls: 'suspect' }
  return { label: 'Humano', cls: 'human' }
}

const VERDICT_CFG: Record<string, { icon: string; text: string; color: string }> = {
  macro:       { icon: '⚠', text: 'Alta probabilidade de MACRO — hold muito curto + intervalos rígidos.',   color: 'var(--red)'   },
  suspect:     { icon: '⚡', text: 'Suspeito — padrões sugerem automação. Colete mais amostras.',            color: 'var(--amber)' },
  human:       { icon: '✓', text: 'Padrão humano — variância alta e hold natural.',                         color: 'var(--green)' },
  inconclusive:{ icon: '?', text: 'Inconclusivo — continue monitorando.',                                   color: 'var(--muted)' },
  waiting:     { icon: '⏳',text: 'Aguardando amostras (mín. 5 teclas)...',                                 color: 'var(--muted)' },
}

function colorFor(val: number | null, low: number, mid: number, invert = false) {
  if (val === null) return 'var(--text)'
  if (invert) return val < low ? 'var(--red)' : val < mid ? 'var(--amber)' : 'var(--green)'
  return val < low ? 'var(--red)' : val < mid ? 'var(--amber)' : 'var(--green)'
}

// ── Histogram ──────────────────────────────────────────────────────────────
function Histogram({ gaps }: { gaps: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const W = c.offsetWidth; const H = c.offsetHeight
    c.width = W; c.height = H
    ctx.clearRect(0, 0, W, H)

    const BINS = 12, MAX = 600
    const bs = MAX / BINS
    const bins = Array(BINS).fill(0)
    gaps.forEach(g => { const i = Math.min(Math.floor(g / bs), BINS - 1); bins[i]++ })
    const maxB = Math.max(...bins, 1)
    const PL = 36, PR = 10, PB = 28, PT = 16
    const cw = W - PL - PR, ch = H - PB - PT
    const bw = cw / BINS

    // grid
    ctx.strokeStyle = '#252a3a'; ctx.lineWidth = 1
    ;[.25, .5, .75, 1].forEach(f => {
      const y = PT + ch - f * ch
      ctx.beginPath(); ctx.setLineDash([3, 4])
      ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke()
      ctx.fillStyle = '#6b7280'; ctx.font = '9px Courier New'; ctx.textAlign = 'right'
      ctx.fillText(String(Math.round(f * maxB)), PL - 4, y + 3)
    })
    ctx.setLineDash([])

    bins.forEach((count, i) => {
      if (!count) return
      const bh = (count / maxB) * ch
      const x = PL + i * bw + 2; const y = PT + ch - bh
      const start = i * bs
      ctx.fillStyle = start < 40 ? '#e84545' : start < 100 ? '#f5a623' : '#4a9eff'
      ctx.beginPath()
      ctx.roundRect(x, y, bw - 4, bh, [3, 3, 0, 0])
      ctx.fill()
      if (bh > 14) {
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '9px Courier New'
        ctx.fillText(String(count), x + (bw - 4) / 2, y + 10)
      }
    })

    // labels
    ctx.fillStyle = '#6b7280'; ctx.textAlign = 'center'; ctx.font = '9px Courier New'
    for (let i = 0; i <= BINS; i += 2)
      ctx.fillText(String(Math.round(i * bs)), PL + i * bw, H - 8)

    // axes
    ctx.strokeStyle = '#252a3a'; ctx.lineWidth = 1; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, H - PB); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PL, H - PB); ctx.lineTo(W - PR, H - PB); ctx.stroke()
  }, [gaps])

  return (
    <canvas ref={ref} style={{ width: '100%', flex: 1, display: 'block', minHeight: 180 }} />
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const params  = useParams()
  const session = params.session as string
  const router  = useRouter()

  const [data, setData]   = useState<Report | null>(null)
  const [error, setError] = useState('')
  const intervalRef       = useRef<NodeJS.Timeout>()

  const load = useCallback(async () => {
    const r = await fetch(`/api/stats/${session}`)
    if (r.status === 401) { router.push('/'); return }
    if (!r.ok) { setError('Sessão não encontrada.'); return }
    setData(await r.json())
  }, [session, router])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 3000) // poll a cada 3s
    return () => clearInterval(intervalRef.current)
  }, [load])

  if (error) return (
    <div style={{ padding: 40, color: 'var(--red)' }}>{error} <Link href="/dashboard">← Voltar</Link></div>
  )
  if (!data) return (
    <div style={{ padding: 40, color: 'var(--muted)' }}>Carregando...</div>
  )

  const { stats, events } = data
  const gaps = events.filter(e => e.gap !== null).map(e => e.gap as number)
  const vc   = VERDICT_CFG[stats.verdict] ?? VERDICT_CFG.waiting

  const s: React.CSSProperties = { fontFamily: 'Courier New, monospace' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px', ...s }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: 12 }}>← Sessões</Link>
          <div>
            <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>
              MACRO ANALYZER
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
              sessão: <span style={{ color: 'var(--blue)' }}>{session}</span>
              {data.meta?.started ? ` · iniciada em ${new Date(data.meta.started).toLocaleString('pt-BR')}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
            display: 'inline-block', animation: 'pulse 1.6s infinite',
          }} />
          Atualizando a cada 3s
        </div>
      </div>

      {/* metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Teclas', val: String(stats.total), color: 'var(--text)' },
          { label: 'Hold médio', val: stats.avg_dur !== null ? `${stats.avg_dur} ms` : '—', color: colorFor(stats.avg_dur, 25, 50, true) },
          { label: 'Gap médio',  val: stats.avg_gap !== null ? `${stats.avg_gap} ms` : '—', color: colorFor(stats.avg_gap, 40, 100, true) },
          { label: 'Variância',  val: stats.variance !== null ? String(stats.variance) : '—', color: colorFor(stats.variance, 200, 1000, true) },
          { label: 'Desvio pad.',val: stats.stdev !== null ? `${stats.stdev} ms` : '—', color: colorFor(stats.stdev, 15, 35, true) },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--panel)', border: '0.5px solid var(--border)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* verdict */}
      <div style={{
        background: 'var(--panel)', border: '0.5px solid var(--border)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 12,
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{vc.icon}</span>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
            Diagnóstico
          </div>
          <div style={{ fontWeight: 700, color: vc.color }}>{vc.text}</div>
        </div>
      </div>

      {/* log + histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 10 }}>
        {/* log */}
        <div style={{ background: 'var(--panel)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '12px 14px 8px', borderBottom: '0.5px solid var(--border)' }}>
            Log de eventos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 90px 90px 1fr', padding: '6px 14px', fontSize: 10, color: 'var(--muted)', borderBottom: '0.5px solid var(--border)' }}>
            <span>KEY</span><span>HOLD</span><span>GAP</span><span>ANÁLISE</span>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 420 }}>
            {events.map((ev, i) => {
              const { label, cls } = classify(ev.dur, ev.gap)
              const badgeColor = cls === 'macro' ? 'var(--red)' : cls === 'suspect' ? 'var(--amber)' : cls === 'human' ? 'var(--green)' : 'var(--muted)'
              const badgeBg    = cls === 'macro' ? 'rgba(232,69,69,.15)' : cls === 'suspect' ? 'rgba(245,166,35,.12)' : cls === 'human' ? 'rgba(62,207,142,.1)' : 'transparent'
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '40px 90px 90px 1fr',
                  padding: '4px 14px',
                  borderBottom: i < events.length - 1 ? '0.5px solid rgba(37,42,58,.5)' : 'none',
                }}>
                  <span style={{ color: ev.key === 'z' ? 'var(--blue)' : 'var(--purple)', fontWeight: 700 }}>
                    {ev.key.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{ev.dur !== null ? `${ev.dur} ms` : '—'}</span>
                  <span style={{ color: 'var(--muted)' }}>{ev.gap !== null ? `${ev.gap} ms` : 'primeiro'}</span>
                  <span>
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 4,
                      background: badgeBg, color: badgeColor,
                    }}>
                      {label}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* histogram */}
        <div style={{
          background: 'var(--panel)', border: '0.5px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '12px 14px 8px', borderBottom: '0.5px solid var(--border)' }}>
            Distribuição dos gaps (ms)
          </div>
          <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column' }}>
            <Histogram gaps={gaps} />
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  )
}
