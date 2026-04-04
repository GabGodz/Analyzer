import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Keyboard Analyzer',
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117; --panel: #181c27; --border: #252a3a;
    --text: #e8eaf0; --muted: #6b7280;
    --blue: #4a9eff; --green: #3ecf8e; --amber: #f5a623;
    --red: #e84545; --purple: #a78bfa;
  }
  html, body { background: var(--bg); color: var(--text); font-family: 'Courier New', monospace; font-size: 13px; min-height: 100vh; }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
  button { font-family: inherit; cursor: pointer; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><style dangerouslySetInnerHTML={{ __html: css }} /></head>
      <body>{children}</body>
    </html>
  )
}
