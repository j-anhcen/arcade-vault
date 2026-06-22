'use client'

import { useEffect, useRef } from 'react'

interface ArkanoidGameProps {
  paused: boolean
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onGameOver: (score: number) => void
}

export default function ArkanoidGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: ArkanoidGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const cbRef = useRef({ onScoreChange, onLivesChange, onLevelChange, onGameOver })

  pausedRef.current = paused
  cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 800,
      H = 600

    // ── Audio ──────────────────────────────────────────────────────────────────
    const bounceSound = new Audio('/sounds/ball-bounce.mp3')
    const breakSound = new Audio('/sounds/break-sound.mp3')

    function playBounce() {
      try {
        ;(bounceSound.cloneNode() as HTMLAudioElement).play()
      } catch {
        /* autoplay policy */
      }
    }
    function playBreak() {
      try {
        ;(breakSound.cloneNode() as HTMLAudioElement).play()
      } catch {
        /* autoplay policy */
      }
    }

    // ── Levels ─────────────────────────────────────────────────────────────────
    interface BlockDef {
      col: number
      row: number
      color: string
    }
    interface Level {
      speed: number
      blocks: BlockDef[]
    }

    const LEVELS: Level[] = (() => {
      const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']
      const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green']
      const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red']

      const l1: BlockDef[] = []
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 10; col++) l1.push({ col, row, color: rowColors1[row] })

      const l2: BlockDef[] = []
      const pyStart = [4, 3, 2, 1, 0, 0]
      const pyEnd = [5, 6, 7, 8, 9, 9]
      for (let row = 0; row < 6; row++)
        for (let col = pyStart[row]; col <= pyEnd[row]; col++)
          l2.push({ col, row, color: rowColors2[row] })

      const l3: BlockDef[] = []
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 10; col++)
          if ((col + row) % 2 === 0) l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' })

      const gaps4 = [
        [2, 5, 8],
        [0, 4, 7, 9],
        [1, 3, 6],
        [2, 5, 8, 9],
        [0, 4, 7],
        [1, 3, 6, 9],
      ]
      const l4: BlockDef[] = []
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 10; col++)
          if (!gaps4[row].includes(col)) l4.push({ col, row, color: rowColors4[row] })

      const l5: BlockDef[] = []
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 10; col++) {
          const isFrame = col === 0 || col === 9 || row === 0 || row === 5
          const isCross = col === 4 || row === 2
          if (isFrame || isCross)
            l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' })
        }

      return [
        { speed: 1.0, blocks: l1 },
        { speed: 1.1, blocks: l2 },
        { speed: 1.21, blocks: l3 },
        { speed: 1.33, blocks: l4 },
        { speed: 1.46, blocks: l5 },
      ]
    })()

    // ── Constants ──────────────────────────────────────────────────────────────
    const PADDLE_SPEED = 400
    const BLOCK_COLS = 10
    const BLOCK_W = 64
    const BLOCK_H = 24
    const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2
    const BLOCKS_ORIGIN_Y = 80
    const BASE_BALL_VX = 200
    const BASE_BALL_VY = -300

    // ── Game objects ───────────────────────────────────────────────────────────
    const paddle = { x: 0, y: 560, w: 81, h: 14 }
    const ball = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 }

    interface Block {
      x: number
      y: number
      w: number
      h: number
      color: string
      alive: boolean
    }
    let blocks: Block[] = []
    let score = 0
    let lives = 3
    let level = 1
    let state: 'playing' | 'gameover' | 'win' = 'playing'
    let prevScore = -1,
      prevLives = -1,
      prevLevel = -1
    let gameOverFired = false

    // ── Input ──────────────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {}

    function onKeyDown(e: KeyboardEvent) {
      keys[e.code] = true
      if (['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = W / rect.width
      const mouseX = (e.clientX - rect.left) * scaleX
      paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2))
    }
    canvas.addEventListener('mousemove', onMouseMove)

    // ── Init helpers ───────────────────────────────────────────────────────────
    function initPaddle() {
      paddle.x = (W - paddle.w) / 2
    }

    function initBall() {
      const speed = LEVELS[level - 1].speed
      ball.x = paddle.x + (paddle.w - ball.w) / 2
      ball.y = paddle.y - ball.h
      ball.vx = BASE_BALL_VX * speed
      ball.vy = BASE_BALL_VY * speed
    }

    function loadLevel(n: number) {
      level = n
      const lvl = LEVELS[n - 1]
      blocks = lvl.blocks.map((b) => ({
        x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
        y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: b.color,
        alive: true,
      }))
      ball.x = paddle.x + (paddle.w - ball.w) / 2
      ball.y = paddle.y - ball.h
      ball.vx = BASE_BALL_VX * lvl.speed
      ball.vy = BASE_BALL_VY * lvl.speed
    }

    function collideAABB(block: Block): boolean {
      return (
        ball.x < block.x + block.w &&
        ball.x + ball.w > block.x &&
        ball.y < block.y + block.h &&
        ball.y + ball.h > block.y
      )
    }

    // ── Callbacks ──────────────────────────────────────────────────────────────
    function notifyCallbacks() {
      if (score !== prevScore) {
        cbRef.current.onScoreChange(score)
        prevScore = score
      }
      if (lives !== prevLives) {
        cbRef.current.onLivesChange(lives)
        prevLives = lives
      }
      if (level !== prevLevel) {
        cbRef.current.onLevelChange(level)
        prevLevel = level
      }
      if ((state === 'gameover' || state === 'win') && !gameOverFired) {
        gameOverFired = true
        cbRef.current.onGameOver(score)
      }
    }

    // ── Update ─────────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (state !== 'playing') return

      if (keys['ArrowLeft']) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt)
      if (keys['ArrowRight']) paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt)

      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      // Wall bounces
      if (ball.x <= 0) {
        ball.x = 0
        ball.vx = Math.abs(ball.vx)
        playBounce()
      }
      if (ball.x + ball.w >= W) {
        ball.x = W - ball.w
        ball.vx = -Math.abs(ball.vx)
        playBounce()
      }
      if (ball.y <= 0) {
        ball.y = 0
        ball.vy = Math.abs(ball.vy)
        playBounce()
      }

      // Paddle bounce
      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h
        ball.vy = -Math.abs(ball.vy)
        playBounce()
      }

      // Block collisions — one block per frame
      for (const block of blocks) {
        if (!block.alive) continue
        if (collideAABB(block)) {
          block.alive = false
          score += 10
          ball.vy = -ball.vy
          playBreak()
          if (blocks.every((b) => !b.alive)) {
            if (level < 5) loadLevel(level + 1)
            else state = 'win'
          }
          break
        }
      }

      // Ball lost — no dead state, reset immediately
      if (ball.y > H) {
        lives--
        if (lives <= 0) {
          lives = 0
          state = 'gameover'
        } else {
          initBall()
        }
      }
    }

    // ── Draw ───────────────────────────────────────────────────────────────────
    const COLOR_MAP: Record<string, string> = {
      red: '#ff4444',
      yellow: '#ffdd00',
      cyan: '#00eeff',
      magenta: '#ff00ff',
      hotpink: '#ff69b4',
      green: '#00ff88',
      gray: '#888888',
    }

    function drawBlock(block: Block) {
      const color = COLOR_MAP[block.color] ?? '#ffffff'
      ctx.fillStyle = color
      ctx.fillRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(block.x + 2, block.y + 2, block.w - 4, 4)
    }

    function drawPaddle() {
      ctx.shadowColor = '#00eeff'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#00eeff'
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h)
      ctx.shadowBlur = 0
    }

    function drawBall() {
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(ball.x, ball.y, ball.w, ball.h)
      ctx.shadowBlur = 0
    }

    function drawOverlay(title: string, sub: string) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, W, H)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 46px monospace'
      ctx.fillText(title, W / 2, H / 2 - 18)
      ctx.font = '18px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.fillText(sub, W / 2, H / 2 + 22)
    }

    function draw() {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      for (const block of blocks) {
        if (block.alive) drawBlock(block)
      }
      drawPaddle()
      drawBall()
      if (state === 'gameover') drawOverlay('GAME OVER', `SCORE: ${score}`)
      if (state === 'win') drawOverlay('YOU WIN!', `SCORE: ${score}`)
    }

    // ── Loop ───────────────────────────────────────────────────────────────────
    let rafId: number
    let lastTime: number | null = null

    function loop(ts: number) {
      if (!pausedRef.current) {
        const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05)
        lastTime = ts
        update(dt)
        notifyCallbacks()
      } else {
        lastTime = null
      }
      draw()
      rafId = requestAnimationFrame(loop)
    }

    initPaddle()
    loadLevel(1)
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block' }} />
}
