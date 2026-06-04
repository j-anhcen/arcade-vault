'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GAMES, CATS, type Game } from '@/lib/data'

function GameCard({ game }: { game: Game }) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `translateY(-6px) rotateX(${(-y * 12).toFixed(1)}deg) rotateY(${(x * 12).toFixed(1)}deg)`
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div
      ref={ref}
      className="card"
      onClick={() => router.push(`/games/${game.id}`)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/games/${game.id}`)}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <span className="label">{game.cat}</span>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>RÉCORD</span>
            <b>{game.best.toLocaleString('es')}</b>
          </div>
          <div className="score-badge" style={{ textAlign: 'right' }}>
            <span>PARTIDAS</span>
            <b>{game.plays}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BibliotecaPage() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('TODOS')

  const filtered = GAMES.filter((g) => {
    const matchCat = cat === 'TODOS' || g.cat === cat
    const matchQuery =
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.short.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  })

  return (
    <>
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERT COIN &nbsp;<span className="blink">▮</span>&nbsp; SELECT YOUR GAME
        </p>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar juego"
          />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {filtered.length === 0 && (
          <p
            className="pixel"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              gridColumn: '1/-1',
              padding: '32px 0',
            }}
          >
            SIN RESULTADOS
          </p>
        )}
      </div>
    </>
  )
}
