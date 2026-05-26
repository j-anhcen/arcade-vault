'use client'

import { Fragment, useState } from "react"
import { GAMES, seededScores } from "@/lib/data"

const YOU_RANK = 4

function rowClass(rank: number) {
  if (rank === 1) return "tr top1"
  if (rank === 2) return "tr top2"
  if (rank === 3) return "tr top3"
  if (rank === YOU_RANK) return "tr you"
  return "tr"
}

export default function SalonPage() {
  const [activeIdx, setActiveIdx] = useState(0)

  const game = GAMES[activeIdx]
  const scores = seededScores((activeIdx + 1) * 997)

  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podium = [
    { row: scores[1], cls: "silver", label: "#2" },
    { row: scores[0], cls: "gold",   label: "#1" },
    { row: scores[2], cls: "bronze", label: "#3" },
  ]

  return (
    <div className="av-hall">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE ARCADE VAULT</p>
      </div>

      {/* Game tabs */}
      <div className="hall-tabs">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            className={`chip${activeIdx === i ? " active" : ""}`}
            onClick={() => setActiveIdx(i)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Podium — key forces remount so CSS animations replay on tab change */}
      <div className="podium" key={`podium-${activeIdx}`}>
        {podium.map(({ row, cls, label }) => (
          <div key={cls} className={`podium-slot ${cls}`}>
            <div className="rank-num">{label}</div>
            <div className="name">{row.name}</div>
            <div className="score">{row.score.toLocaleString("es")}</div>
            <div className="date">{row.date}</div>
          </div>
        ))}
      </div>

      {/* Full table — key replays row animations on tab change */}
      <div className="hall-table" key={`table-${activeIdx}`}>
        <div className="th">
          <span>RANK</span>
          <span>JUGADOR</span>
          <span>SCORE</span>
          <span>FECHA</span>
        </div>
        {scores.map((row) => (
          <Fragment key={row.rank}>
            {row.rank === YOU_RANK && (
              <div className="tr you-label">▶ TÚ ESTÁS AQUÍ</div>
            )}
            <div
              className={rowClass(row.rank)}
              style={{ animationDelay: `${(row.rank - 1) * 45}ms` }}
            >
              <span className="rk">#{row.rank}</span>
              <span className="pl">{row.name}</span>
              <span className="sc">{row.score.toLocaleString("es")}</span>
              <span className="dt">{row.date}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
