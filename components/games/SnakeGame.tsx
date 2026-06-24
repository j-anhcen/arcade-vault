'use client'

import { useEffect, useRef } from 'react'

interface SnakeGameProps {
  paused: boolean
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onGameOver: (score: number) => void
}

const CELL = 20
const COLS = 30
const ROWS = 30

// Sprite coords from references/source-assets/snake-assets/sprites.js (row y=136, h=160)
const FRUIT_ATLAS = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  { x: 378, y: 136, w: 110, h: 160 }, // grape
  { x: 894, y: 136, w: 110, h: 160 }, // strawberry
  { x: 1066, y: 136, w: 110, h: 160 }, // cherry
  { x: 1734, y: 136, w: 150, h: 160 }, // watermelon
  { x: 2786, y: 136, w: 110, h: 160 }, // apple
  { x: 2948, y: 136, w: 130, h: 160 }, // tomato
  { x: 3110, y: 136, w: 150, h: 160 }, // berries
] as const

export default function SnakeGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const cbRef = useRef({ onScoreChange, onLivesChange, onLevelChange, onGameOver })

  // Sync refs on every render so the rAF loop never reads stale props
  pausedRef.current = paused
  cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // Load sprite sheet once outside the loop
    const fruitImg = new Image()
    fruitImg.src = '/images/snake-fruits.png'

    type Vec = { x: number; y: number }
    type FruitSprite = (typeof FRUIT_ATLAS)[number]

    // ── Game state (closure variables) ────────────────────────────────────────
    let snake: Vec[] = []
    let dir: Vec = { x: 1, y: 0 }
    let nextDir: Vec = { x: 1, y: 0 }
    let food: Vec = { x: 0, y: 0 }
    let foodSprite: FruitSprite = FRUIT_ATLAS[0]
    let score = 0
    let level = 1
    let fruitsEaten = 0
    let tickInterval = 150
    let tickAccum = 0
    let state: 'playing' | 'gameover' = 'playing'
    let gameOverFired = false
    let prevScore = -1
    let prevLevel = -1

    // ── Input ─────────────────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault()
          if (dir.y !== 1) nextDir = { x: 0, y: -1 }
          break
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault()
          if (dir.y !== -1) nextDir = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault()
          if (dir.x !== 1) nextDir = { x: -1, y: 0 }
          break
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault()
          if (dir.x !== -1) nextDir = { x: 1, y: 0 }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)

    // ── Helpers ───────────────────────────────────────────────────────────────
    function randomEmptyCell(): Vec {
      const occupied = new Set(snake.map((s) => `${s.x},${s.y}`))
      let x: number, y: number
      do {
        x = Math.floor(Math.random() * COLS)
        y = Math.floor(Math.random() * ROWS)
      } while (occupied.has(`${x},${y}`))
      return { x, y }
    }

    function spawnFood() {
      food = randomEmptyCell()
      foodSprite = FRUIT_ATLAS[Math.floor(Math.random() * FRUIT_ATLAS.length)]
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function initGame() {
      const cx = Math.floor(COLS / 2)
      const cy = Math.floor(ROWS / 2)
      snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ]
      dir = { x: 1, y: 0 }
      nextDir = { x: 1, y: 0 }
      score = 0
      level = 1
      fruitsEaten = 0
      tickInterval = 150
      tickAccum = 0
      state = 'playing'
      gameOverFired = false
      prevScore = -1
      prevLevel = -1
      spawnFood()
      cbRef.current.onLivesChange(1)
    }

    // ── Tick (movement step) ──────────────────────────────────────────────────
    function tick() {
      dir = nextDir
      const head: Vec = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

      // Wall collision → game over
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        state = 'gameover'
        return
      }
      // Self collision → game over
      for (const seg of snake) {
        if (seg.x === head.x && seg.y === head.y) {
          state = 'gameover'
          return
        }
      }

      snake.unshift(head)

      if (head.x === food.x && head.y === food.y) {
        score += 10
        fruitsEaten++
        if (fruitsEaten % 5 === 0) {
          level++
          tickInterval = Math.max(60, tickInterval - 10)
        }
        spawnFood()
      } else {
        snake.pop()
      }
    }

    // ── Callbacks ─────────────────────────────────────────────────────────────
    function notifyCallbacks() {
      if (score !== prevScore) {
        cbRef.current.onScoreChange(score)
        prevScore = score
      }
      if (level !== prevLevel) {
        cbRef.current.onLevelChange(level)
        prevLevel = level
      }
      if (state === 'gameover' && !gameOverFired) {
        gameOverFired = true
        cbRef.current.onGameOver(score)
      }
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function draw() {
      const W = COLS * CELL
      const H = ROWS * CELL

      ctx.fillStyle = '#090910'
      ctx.fillRect(0, 0, W, H)

      // Subtle grid
      ctx.strokeStyle = 'rgba(0,255,136,0.04)'
      ctx.lineWidth = 0.5
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath()
        ctx.moveTo(c * CELL, 0)
        ctx.lineTo(c * CELL, H)
        ctx.stroke()
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath()
        ctx.moveTo(0, r * CELL)
        ctx.lineTo(W, r * CELL)
        ctx.stroke()
      }

      // Food: sprite from atlas, fallback to magenta square
      if (fruitImg.complete && fruitImg.naturalWidth > 0) {
        ctx.drawImage(
          fruitImg,
          foodSprite.x,
          foodSprite.y,
          foodSprite.w,
          foodSprite.h,
          food.x * CELL + 1,
          food.y * CELL + 1,
          CELL - 2,
          CELL - 2
        )
      } else {
        ctx.fillStyle = '#ff00ff'
        ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6)
      }

      // Snake: draw tail-to-head so head renders on top
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i]
        if (i === 0) {
          ctx.shadowColor = 'rgba(0,255,136,0.9)'
          ctx.shadowBlur = 10
          ctx.fillStyle = '#00ff88'
        } else {
          ctx.shadowBlur = 0
          const g = Math.max(80, 220 - i * 3)
          const a = Math.max(0.5, 1 - i * 0.012)
          ctx.fillStyle = `rgba(0,${g},60,${a})`
        }
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
      }
      ctx.shadowBlur = 0
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let rafId: number
    let lastTime: number | null = null

    function loop(ts: number) {
      if (!pausedRef.current) {
        const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.1)
        lastTime = ts
        if (state === 'playing') {
          tickAccum += dt * 1000
          while (tickAccum >= tickInterval) {
            tickAccum -= tickInterval
            tick()
            if ((state as 'playing' | 'gameover') === 'gameover') break
          }
        }
        notifyCallbacks()
      } else {
        lastTime = null
      }
      draw()
      rafId = requestAnimationFrame(loop)
    }

    initGame()
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return <canvas ref={canvasRef} width={600} height={600} style={{ display: 'block' }} />
}
