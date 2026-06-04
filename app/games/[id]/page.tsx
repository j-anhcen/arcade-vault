import Link from 'next/link'
import { getGame, getTopScoresByGame, type RouteParams, type Score } from '@/lib/data'

function rowClass(rank: number) {
  if (rank === 1) return 'lb-row top1'
  if (rank === 2) return 'lb-row top2'
  if (rank === 3) return 'lb-row top3'
  return 'lb-row'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default async function DetallePage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params
  const game = await getGame(id)

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

  const scores = await getTopScoresByGame(game.id)

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
              <div className="l">PARTIDAS</div>
              <div className="v" style={{ fontSize: 20 }}>
                {game.plays}
              </div>
            </div>
            <div>
              <div className="l">MEJOR GLOBAL</div>
              <div
                className="v"
                style={{
                  color: 'var(--magenta)',
                  textShadow: '0 0 6px rgba(255,0,110,0.5)',
                  fontSize: 18,
                }}
              >
                {game.best.toLocaleString('es')}
              </div>
            </div>
            <div>
              <div className="l">DIFICULTAD</div>
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      color: '#F5FF00',
                      fontSize: 16,
                      opacity: i < game.difficulty ? 1 : 0.25,
                      textShadow: i < game.difficulty ? '0 0 8px rgba(245,255,0,0.7)' : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p>{game.long}</p>

          <div className="detail-actions">
            <Link
              href={`/games/${game.slug}/play`}
              className="btn lg"
              style={{ flex: 1, justifyContent: 'center', gap: 10 }}
            >
              ► JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost" style={{ padding: '16px 24px' }}>
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      {/* Right column: leaderboard */}
      <div className="leaderboard">
        <h3>MEJORES SCORES</h3>

        {scores.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
            }}
          >
            <p
              className="pixel"
              style={{
                fontSize: 10,
                color: 'var(--cyan)',
                textShadow: '0 0 8px rgba(0,240,255,0.4)',
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              SÉ EL PRIMERO EN ENTRAR
            </p>
            <p className="pixel" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>
              No hay scores aún. ¡Juega y reclama el #1!
            </p>
          </div>
        ) : (
          scores.map((row: Score, idx: number) => {
            const rank = idx + 1
            return (
              <div key={row.id} className={rowClass(rank)}>
                <span className="rk">#{rank}</span>
                <span className="pl">{row.player_name}</span>
                <span className="sc">{row.score.toLocaleString('es')}</span>
                <span
                  className="dt"
                  style={{ fontSize: 10, color: 'var(--ink-faint)', marginLeft: 'auto' }}
                >
                  {formatDate(row.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
