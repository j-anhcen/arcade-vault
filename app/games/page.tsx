import Link from 'next/link'
import { getGames, type Game } from '@/lib/data'

function DifficultyStars({ level }: { level: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < level ? 'var(--yellow)' : 'var(--ink-faint)',
            textShadow: i < level ? '0 0 6px rgba(245,255,0,0.6)' : 'none',
            fontSize: 13,
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function ActionCell({ game }: { game: Game }) {
  if (game.slug === 'asteroids') {
    return (
      <Link
        href="/games/asteroids/play"
        className="btn"
        style={{ fontSize: 11, padding: '8px 16px' }}
      >
        ► JUGAR
      </Link>
    )
  }
  return (
    <span
      className="pixel"
      style={{
        fontSize: 9,
        color: 'var(--ink-faint)',
        letterSpacing: '0.12em',
        opacity: 0.5,
      }}
    >
      PRÓXIMAMENTE
    </span>
  )
}

export default async function BibliotecaPage() {
  const games = await getGames()

  return (
    <>
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERT COIN &nbsp;<span className="blink">▮</span>&nbsp; SELECT YOUR GAME
        </p>
      </section>

      <div style={{ padding: '0 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            border: '1px solid rgba(0,240,255,0.15)',
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          {/* Table header */}
          <div
            className="pixel"
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.2fr 0.8fr 1fr',
              padding: '10px 20px',
              fontSize: 9,
              letterSpacing: '0.15em',
              color: 'var(--ink-faint)',
              borderBottom: '1px solid rgba(0,240,255,0.12)',
              background: 'rgba(0,240,255,0.03)',
            }}
          >
            <span>NOMBRE</span>
            <span>CATEGORÍA</span>
            <span>DIFICULTAD</span>
            <span>BEST SCORE</span>
            <span>PARTIDAS</span>
            <span>ACCIÓN</span>
          </div>

          {/* Rows */}
          {games.map((game, idx) => (
            <div
              key={game.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.2fr 0.8fr 1fr',
                padding: '14px 20px',
                alignItems: 'center',
                borderBottom: idx < games.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(0,240,255,0.04)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              {/* Nombre */}
              <span
                className="pixel"
                style={{
                  fontSize: 12,
                  color: game.slug === 'asteroids' ? 'var(--cyan)' : 'var(--ink)',
                  textShadow: game.slug === 'asteroids' ? '0 0 8px rgba(0,240,255,0.4)' : 'none',
                  letterSpacing: '0.08em',
                }}
              >
                {game.title}
              </span>

              {/* Categoría */}
              <span
                className="pixel"
                style={{
                  fontSize: 9,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.1em',
                }}
              >
                {game.cat}
              </span>

              {/* Dificultad */}
              <DifficultyStars level={game.difficulty} />

              {/* Best Score */}
              <span
                className="pixel"
                style={{
                  fontSize: 12,
                  color: 'var(--magenta)',
                  textShadow: '0 0 6px rgba(255,0,110,0.4)',
                  letterSpacing: '0.05em',
                }}
              >
                {game.best.toLocaleString('es')}
              </span>

              {/* Partidas */}
              <span
                className="pixel"
                style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.05em' }}
              >
                {game.plays}
              </span>

              {/* Acción */}
              <span>
                <ActionCell game={game} />
              </span>
            </div>
          ))}

          {games.length === 0 && (
            <p
              className="pixel"
              style={{
                fontSize: 11,
                color: 'var(--ink-faint)',
                padding: '32px 20px',
                textAlign: 'center',
              }}
            >
              SIN JUEGOS DISPONIBLES
            </p>
          )}
        </div>
      </div>
    </>
  )
}
