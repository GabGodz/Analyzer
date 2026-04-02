'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pw, setPw]           = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('Senha incorreta.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--panel)', border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '40px 36px', width: 340,
      }}>
        <div style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 15, marginBottom: 4, letterSpacing: '.06em' }}>
          MACRO ANALYZER
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 28 }}>
          Acesso restrito · dashboard
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Senha
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            required
            style={{
              display: 'block', width: '100%', marginTop: 6, marginBottom: 16,
              background: 'var(--bg)', border: '0.5px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '10px 12px',
              fontSize: 13, outline: 'none',
            }}
          />
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 0',
              background: '#1e3a5f', border: '0.5px solid var(--blue)',
              borderRadius: 6, color: 'var(--blue)', fontWeight: 700, fontSize: 13,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
