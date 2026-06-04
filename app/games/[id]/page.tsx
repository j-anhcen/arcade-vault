'use client'

import { use } from 'react'
import Link from 'next/link'
import { GAMES, seededScores, type RouteParams } from '@/lib/data'

function rowClass(rank: number) {
  if (rank === 1) return 'lb-row top1'
  if (rank === 2) return 'lb-row top2'
  if (rank === 3) return 'lb-row top3'
  return 'lb-row'
}

export default function DetallePage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = use(params)
  const game = GAMES.find((g) => g.id === id)

  if (!game) {
    return (
      <div style={{ padding: '80px 32px', textAlign: 'center' }}>
        <p className="pixel" style={{ color: 'var(--magenta)', fontSize: 14 }}>
          JUEGO NO ENCONTRADO
        </p>
        <Link href="/games" className="btn" style={{ marginTop: 24, display: 'inline-flex' }}>
          ← VOLVER
        </Link>
      </div>
    )
  }

  const gameIdx = GAMES.findIndex((g) => g.id === id)
  const scores = seededScores((gameIdx + 1) * 997)

  return (
    <div className="av-detail">
      {/* Left column: cover + info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} style={{ position: 'absolute', inset: 0 }} />
        </div>

        <div className="detail-info" style={{ marginTop: 24 }}>
          <h2>{game.title}</h2>

          <div className="detail-tags">
            <span>{game.cat}</span>
            <span className={`neon-${game.color}`}>{game.color.toUpperCase()}</span>
          </div>

          <div className="stat-strip">
            <div>
              <div className="l">RÉCORD</div>
              <div className="v">{game.best.toLocaleString('es')}</div>
            </div>
            <div>
              <div className="l">PARTIDAS</div>
              <div className="v" style={{ fontSize: 13 }}>
                {game.plays}
              </div>
            </div>
            <div>
              <div className="l">TIPO</div>
              <div className="v" style={{ fontSize: 11 }}>
                {game.cat}
              </div>
            </div>
          </div>

          <p>{game.long}</p>

          <div className="detail-actions">
            <Link href="/games" className="btn ghost">
              ← VOLVER
            </Link>
          </div>
        </div>
      </div>

      {/* Right column: leaderboard */}
      <div className="leaderboard">
        <h3>MEJORES SCORES</h3>
        {scores.map((row) => (
          <div key={row.rank} className={rowClass(row.rank)}>
            <span className="rk">#{row.rank}</span>
            <span className="pl">{row.name}</span>
            <span className="sc">{row.score.toLocaleString('es')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
