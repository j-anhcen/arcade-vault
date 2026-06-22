'use client'

import { useEffect, useRef } from 'react'

interface TetrisGameProps {
  paused: boolean
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onGameOver: (score: number) => void
}

export default function TetrisGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const cbRef = useRef({ onScoreChange, onLivesChange, onLevelChange, onGameOver })

  // Sync refs on every render so the rAF loop never reads stale props
  pausedRef.current = paused
  cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver }

  useEffect(() => {
    const canvas = canvasRef.current
    const nextCanvas = nextCanvasRef.current
    if (!canvas || !nextCanvas) return
    const ctx = canvas.getContext('2d')!
    const nextCtx = nextCanvas.getContext('2d')!

    const COLS = 10
    const ROWS = 20
    const BLOCK = 30
    const NB = 30

    // Retro skin colors (indices 1–8, index 0 = empty)
    const SKIN_COLORS: (string | null)[] = [
      null,
      '#4dd0e1', // I
      '#ffd54f', // O
      '#ba68c8', // T
      '#81c784', // S
      '#e57373', // Z
      '#90caf9', // J
      '#ffb74d', // L
      '#9e9e9e', // N
    ]

    const PIECES: (number[][] | null)[] = [
      null,
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [2, 2],
        [2, 2],
      ],
      [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0],
      ],
      [
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0],
      ],
      [
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0],
      ],
      [
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0],
      ],
      [
        [0, 0, 7],
        [7, 7, 7],
        [0, 0, 0],
      ],
      [
        [8, 8, 8],
        [8, 0, 8],
        [8, 8, 8],
      ],
    ]

    const LINE_SCORES = [0, 100, 300, 500, 800]

    type Piece = { type: number; shape: number[][]; x: number; y: number }

    // ── Game state (closure variables) ────────────────────────────────────────
    let board: number[][]
    let current: Piece
    let next: Piece
    let score: number
    let lines: number
    let level: number
    let dropInterval: number
    let dropAccum: number
    let state: 'playing' | 'gameover'
    let prevScore = -1,
      prevLives = -1,
      prevLevel = -1
    let gameOverFired = false

    // ── Helpers ───────────────────────────────────────────────────────────────
    function createBoard(): number[][] {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 8) + 1
      const shape = (PIECES[type] as number[][]).map((row) => [...row])
      return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }
    }

    function collide(shape: number[][], ox: number, oy: number): boolean {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue
          const nx = ox + c
          const ny = oy + r
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true
          if (ny >= 0 && board[ny][nx]) return true
        }
      }
      return false
    }

    function rotateCW(shape: number[][]): number[][] {
      const rows = shape.length,
        cols = shape[0].length
      const result = Array.from({ length: cols }, () => new Array(rows).fill(0))
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c]
      return result
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape)
      const kicks = [0, -1, 1, -2, 2]
      for (const kick of kicks) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated
          current.x += kick
          return
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c]) board[current.y + r][current.x + c] = current.shape[r][c]
    }

    function clearLines() {
      let cleared = 0
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1)
          board.unshift(new Array(COLS).fill(0))
          cleared++
          r++
        }
      }
      if (cleared) {
        lines += cleared
        score += (LINE_SCORES[cleared] ?? 0) * level
        level = Math.floor(lines / 10) + 1
        dropInterval = Math.max(100, 1000 - (level - 1) * 90)
      }
    }

    function ghostY(): number {
      let gy = current.y
      while (!collide(current.shape, current.x, gy + 1)) gy++
      return gy
    }

    function hardDrop() {
      const gy = ghostY()
      score += (gy - current.y) * 2
      current.y = gy
      lockPiece()
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++
        score += 1
      } else {
        lockPiece()
      }
    }

    function lockPiece() {
      merge()
      clearLines()
      spawn()
    }

    function spawn() {
      current = next
      next = randomPiece()
      if (collide(current.shape, current.x, current.y)) {
        state = 'gameover'
      }
      drawNext()
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function drawBlock(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      colorIndex: number,
      size: number,
      alpha = 1
    ) {
      if (!colorIndex) return
      const color = SKIN_COLORS[colorIndex] as string
      context.globalAlpha = alpha
      context.fillStyle = color
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2)
      context.fillStyle = 'rgba(255,255,255,0.12)'
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4)
      context.globalAlpha = 1
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath()
        ctx.moveTo(c * BLOCK, 0)
        ctx.lineTo(c * BLOCK, ROWS * BLOCK)
        ctx.stroke()
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath()
        ctx.moveTo(0, r * BLOCK)
        ctx.lineTo(COLS * BLOCK, r * BLOCK)
        ctx.stroke()
      }
    }

    function draw() {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK)
      drawGrid()

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK)

      if (state === 'playing') {
        const gy = ghostY()
        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++)
            if (current.shape[r][c])
              drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2)

        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++)
            drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK)
      }
    }

    function drawNext() {
      nextCtx.fillStyle = '#000'
      nextCtx.fillRect(0, 0, NB * 4, NB * 4)
      const shape = next.shape
      const offX = Math.floor((4 - shape[0].length) / 2)
      const offY = Math.floor((4 - shape.length) / 2)
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB)
    }

    // ── Callbacks ─────────────────────────────────────────────────────────────
    function notifyCallbacks() {
      if (score !== prevScore) {
        cbRef.current.onScoreChange(score)
        prevScore = score
      }
      if (1 !== prevLives) {
        cbRef.current.onLivesChange(1)
        prevLives = 1
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

    // ── Input ─────────────────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code))
        e.preventDefault()
      if (pausedRef.current || state === 'gameover') return
      switch (e.code) {
        case 'ArrowLeft':
          if (!collide(current.shape, current.x - 1, current.y)) current.x--
          break
        case 'ArrowRight':
          if (!collide(current.shape, current.x + 1, current.y)) current.x++
          break
        case 'ArrowDown':
          softDrop()
          break
        case 'ArrowUp':
        case 'KeyX':
          tryRotate()
          break
        case 'Space':
          hardDrop()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)

    // ── Init ──────────────────────────────────────────────────────────────────
    function initGame() {
      board = createBoard()
      score = 0
      lines = 0
      level = 1
      dropInterval = 1000
      dropAccum = 0
      state = 'playing'
      prevScore = -1
      prevLives = -1
      prevLevel = -1
      gameOverFired = false
      next = randomPiece()
      spawn()
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let rafId: number
    let lastTime: number | null = null

    function loop(ts: number) {
      if (!pausedRef.current) {
        const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50)
        lastTime = ts

        if (state === 'playing') {
          dropAccum += dt
          if (dropAccum >= dropInterval) {
            dropAccum = 0
            if (!collide(current.shape, current.x, current.y + 1)) {
              current.y++
            } else {
              lockPiece()
            }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={600}
        style={{ display: 'block', background: '#000' }}
      />
      <canvas
        ref={nextCanvasRef}
        width={120}
        height={120}
        style={{ display: 'block', background: '#000' }}
      />
    </div>
  )
}
