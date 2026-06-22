'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ArkanoidGame from '@/components/games/ArkanoidGame'
import { getGame, saveScore } from '@/lib/data'

export default function ArkanoidPlayPage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [paused, setPaused] = useState(false)
  const [isGameOver, setGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [gameId, setGameId] = useState<string | null>(null)

  useEffect(() => {
    getGame('arkanoid').then((g) => g && setGameId(g.id))
    setPlayerName(localStorage.getItem('arcade-vault-player-name') ?? '')
  }, [])

  const onScoreChange = useCallback((s: number) => setScore(s), [])
  const onLivesChange = useCallback((l: number) => setLives(l), [])
  const onLevelChange = useCallback((l: number) => setLevel(l), [])
  const onGameOver = useCallback((s: number) => {
    setFinalScore(s)
    setSaveError(null)
    setGameOver(true)
  }, [])

  function restart() {
    setScore(0)
    setLives(3)
    setLevel(1)
    setPaused(false)
    setGameOver(false)
    setFinalScore(0)
    setSaveError(null)
    setIsSaving(false)
    setGameKey((k) => k + 1)
  }

  async function confirmScore() {
    if (!playerName.trim() || !gameId) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveScore(gameId, playerName.trim(), finalScore)
      localStorage.setItem('arcade-vault-player-name', playerName.trim())
      router.push('/games/arkanoid')
    } catch {
      setSaveError('ERROR AL GUARDAR — Verifica tu conexión')
      setIsSaving(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 40px',
      }}
    >
      {/* ── HUD bar ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          marginBottom: 8,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: 4,
          backdropFilter: 'blur(6px)',
          gap: 12,
        }}
      >
        {/* Left: back */}
        <Link
          href="/games"
          style={{
            fontFamily: 'var(--pixel)',
            fontSize: 9,
            color: 'var(--ink-dim)',
            textDecoration: 'none',
            letterSpacing: '0.06em',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '6px 10px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--cyan)'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--cyan)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-dim)'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        >
          ← VOLVER
        </Link>

        {/* Center: title */}
        <span
          className="pixel neon-cyan"
          style={{ fontSize: 13, letterSpacing: '0.18em', flexShrink: 0 }}
        >
          ARKANOID
        </span>

        {/* Right: stats + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 7,
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}
            >
              SCORE
            </span>
            <span className="pixel neon-yellow" style={{ fontSize: 11 }}>
              {score.toLocaleString('es')}
            </span>
          </div>

          {/* Level */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 7,
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}
            >
              NIVEL
            </span>
            <span className="pixel" style={{ fontSize: 11, color: 'var(--green)' }}>
              {level}
            </span>
          </div>

          {/* Lives */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 7,
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}
            >
              VIDAS
            </span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', minWidth: 48 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 13,
                    lineHeight: 1,
                    color: i < lives ? 'var(--cyan)' : 'rgba(0,245,255,0.15)',
                    textShadow: i < lives ? '0 0 8px var(--cyan)' : 'none',
                    transition: 'color 0.2s, text-shadow 0.2s',
                  }}
                >
                  ▶
                </span>
              ))}
            </div>
          </div>

          {/* Pause */}
          <button
            onClick={() => !isGameOver && setPaused((p) => !p)}
            disabled={isGameOver}
            style={{
              fontFamily: 'var(--pixel)',
              fontSize: 11,
              background: 'transparent',
              border: '1px solid rgba(0,245,255,0.3)',
              color: paused ? 'var(--yellow)' : 'var(--cyan)',
              padding: '6px 10px',
              borderRadius: 3,
              cursor: isGameOver ? 'default' : 'pointer',
              letterSpacing: '0.04em',
              opacity: isGameOver ? 0.4 : 1,
              textShadow: paused ? '0 0 8px rgba(245,255,0,0.6)' : '0 0 8px rgba(0,245,255,0.6)',
              transition: 'color 0.15s, border-color 0.15s, text-shadow 0.15s',
            }}
          >
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      {/* ── Canvas wrapper ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 600,
          background: '#000',
          border: '1px solid rgba(0,245,255,0.2)',
          boxShadow: '0 0 40px rgba(0,245,255,0.07), 0 0 80px rgba(0,0,0,0.8)',
        }}
      >
        <ArkanoidGame
          key={gameKey}
          paused={paused}
          onScoreChange={onScoreChange}
          onLivesChange={onLivesChange}
          onLevelChange={onLevelChange}
          onGameOver={onGameOver}
        />

        {/* Pause overlay */}
        {paused && !isGameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
              gap: 16,
            }}
          >
            <span className="pixel neon-cyan" style={{ fontSize: 28, letterSpacing: '0.2em' }}>
              PAUSA
            </span>
            <span
              style={{
                fontFamily: 'var(--pixel)',
                fontSize: 9,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.12em',
              }}
            >
              PULSA ⏸ PARA CONTINUAR
            </span>
          </div>
        )}
      </div>

      {/* ── Game over modal ───────────────────────────────────────────────────── */}
      {isGameOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              padding: '48px 64px',
              border: '1px solid rgba(255,0,110,0.35)',
              background: 'rgba(0,0,0,0.7)',
              boxShadow: '0 0 60px rgba(255,0,110,0.15), inset 0 0 40px rgba(255,0,110,0.04)',
            }}
          >
            <span
              className="pixel neon-magenta"
              style={{
                fontSize: 32,
                letterSpacing: '0.16em',
                animation: 'flicker 4s infinite steps(1,end)',
              }}
            >
              GAME OVER
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--pixel)',
                  fontSize: 9,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.12em',
                }}
              >
                PUNTAJE FINAL
              </span>
              <span className="pixel neon-yellow" style={{ fontSize: 22 }}>
                {finalScore.toLocaleString('es')}
              </span>
            </div>

            {/* Player name input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--pixel)',
                  fontSize: 9,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.12em',
                }}
              >
                TU NOMBRE
              </span>
              <input
                type="text"
                value={playerName.toUpperCase()}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 10))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim() && !isSaving) confirmScore()
                }}
                placeholder="JUGADOR___"
                maxLength={10}
                autoFocus
                disabled={isSaving}
                style={{
                  fontFamily: 'var(--pixel)',
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(0,245,255,0.4)',
                  borderRadius: 3,
                  color: 'var(--cyan)',
                  padding: '10px 16px',
                  width: '100%',
                  outline: 'none',
                  caretColor: 'var(--cyan)',
                  boxShadow: '0 0 12px rgba(0,245,255,0.1)',
                  opacity: isSaving ? 0.5 : 1,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--cyan)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,245,255,0.25)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,245,255,0.4)'
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0,245,255,0.1)'
                }}
              />
              <button
                onClick={confirmScore}
                disabled={!playerName.trim() || isSaving || !gameId}
                style={{
                  fontFamily: 'var(--pixel)',
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  background:
                    playerName.trim() && !isSaving ? 'rgba(0,245,255,0.08)' : 'transparent',
                  border: `1px solid ${playerName.trim() && !isSaving ? 'rgba(0,245,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: playerName.trim() && !isSaving ? 'var(--cyan)' : 'rgba(255,255,255,0.2)',
                  padding: '8px 20px',
                  borderRadius: 3,
                  cursor: playerName.trim() && !isSaving && gameId ? 'pointer' : 'default',
                  width: '100%',
                  transition: 'all 0.2s',
                  textShadow:
                    playerName.trim() && !isSaving ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
                }}
              >
                {isSaving ? '...' : '✓ CONFIRMAR NOMBRE'}
              </button>

              {/* Error message */}
              {saveError && (
                <span
                  className="pixel"
                  style={{ fontSize: 8, color: 'var(--magenta)', letterSpacing: '0.08em' }}
                >
                  {saveError}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={restart}
                disabled={isSaving}
                className="btn yellow lg"
                style={{ fontSize: 10, letterSpacing: '0.1em', opacity: isSaving ? 0.5 : 1 }}
              >
                ▶ JUGAR DE NUEVO
              </button>
              <Link
                href="/games"
                className="btn ghost"
                style={{ fontSize: 10, letterSpacing: '0.1em' }}
              >
                ← BIBLIOTECA
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
