import { getTopScoresGlobal, type Score } from '@/lib/data'

type GlobalScore = Score & { game_slug: string }

function rowClass(rank: number) {
  if (rank === 1) return 'tr top1'
  if (rank === 2) return 'tr top2'
  if (rank === 3) return 'tr top3'
  return 'tr'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function gameSlugColor(slug: string): string {
  if (slug === 'asteroids') return 'var(--cyan)'
  return 'var(--ink-faint)'
}

export default async function SalonPage() {
  const scores = await getTopScoresGlobal()

  return (
    <div className="av-hall">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE ARCADE VAULT</p>
      </div>

      <div className="hall-table">
        <div className="th">
          <span>RANK</span>
          <span>JUGADOR</span>
          <span>JUEGO</span>
          <span>SCORE</span>
          <span>FECHA</span>
        </div>

        {scores.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p
              className="pixel"
              style={{
                fontSize: 12,
                color: 'var(--cyan)',
                textShadow: '0 0 10px rgba(0,240,255,0.5)',
                letterSpacing: '0.12em',
                marginBottom: 10,
              }}
            >
              AÚN NO HAY SCORES
            </p>
            <p
              className="pixel"
              style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em' }}
            >
              Juega y sé el primero en el ranking global
            </p>
          </div>
        ) : (
          scores.map((row: GlobalScore, idx: number) => {
            const rank = idx + 1
            return (
              <div
                key={row.id}
                className={rowClass(rank)}
                style={{ animationDelay: `${idx * 45}ms` }}
              >
                <span className="rk">#{rank}</span>
                <span className="pl">{row.player_name}</span>
                <span
                  className="pixel"
                  style={{
                    fontSize: 9,
                    color: gameSlugColor(row.game_slug),
                    letterSpacing: '0.1em',
                    textShadow:
                      row.game_slug === 'asteroids' ? '0 0 6px rgba(0,240,255,0.4)' : 'none',
                  }}
                >
                  {row.game_slug.toUpperCase()}
                </span>
                <span className="sc">{row.score.toLocaleString('es')}</span>
                <span className="dt">{formatDate(row.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
