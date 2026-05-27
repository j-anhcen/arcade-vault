'use client'

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { GAMES, type RouteParams } from "@/lib/data"

export default function PlayerPage({
  params,
}: {
  params: RouteParams<{ id: string }>
}) {
  const { id } = use(params)
  const game = GAMES.find((g) => g.id === id)

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)

  const level = Math.floor(score / 5000) + 1

  useEffect(() => {
    if (gameOver) return
    const timer = setInterval(() => {
      setScore((s) => {
        const lv = Math.floor(s / 5000) + 1
        return s + Math.floor(Math.random() * 80 + 20) * lv
      })
    }, 120)
    return () => clearInterval(timer)
  }, [gameOver])

  function handleEnd() {
    setGameOver(true)
  }

  function handleSave() {
    if (name) setSaved(true)
  }

  function handleReplay() {
    setScore(0)
    setLives(3)
    setGameOver(false)
    setSaved(false)
    setName("")
  }

  return (
    <div className="av-player">
      {/* HUD */}
      <div className="player-hud">
        <div className="hud-stat">
          <span className="l">SCORE</span>
          <span className="v">{score.toLocaleString("es")}</span>
        </div>
        <div className="hud-stat lives">
          <span className="l">VIDAS</span>
          <span className="v">{"♥".repeat(lives)}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">{String(level).padStart(2, "0")}</span>
        </div>
        {game && (
          <div className="hud-stat">
            <span className="l">JUEGO</span>
            <span className="v" style={{ fontSize: 10 }}>
              {game.title}
            </span>
          </div>
        )}
        <div className="hud-actions">
          <button className="btn magenta" onClick={handleEnd}>
            FIN
          </button>
        </div>
      </div>

      {/* CRT monitor */}
      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="player-ship" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">ARCADE VAULT</span>
          <span>{game?.title ?? "PLAYER"}</span>
          <span>NIVEL {String(level).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Game over modal */}
      {gameOver && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es")}</div>
            <div className="input-row">
              <input
                type="text"
                placeholder="TU NOMBRE"
                maxLength={12}
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
              />
              <button
                className="btn"
                onClick={handleSave}
                disabled={!name || saved}
              >
                OK
              </button>
            </div>
            {saved && <div className="toast-saved">¡SCORE GUARDADO!</div>}
            <div className="actions">
              <button className="btn yellow" onClick={handleReplay}>
                ↺ JUGAR DE NUEVO
              </button>
              <Link href={`/detalle/${id}`} className="btn ghost">
                ← DETALLE
              </Link>
              <Link href="/biblioteca" className="btn ghost">
                BIBLIOTECA
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
