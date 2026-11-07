import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'

// 首頁的吃豆人小遊戲：一開始自己玩（展示模式），按方向鍵 / WASD 或點擊畫面就換你操控。
const MAP = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '#.......   .......#',
  '####.### # ###.####',
  '#....#...#...#....#',
  '#.##.#.#####.#.##.#',
  '#.................#',
  '#o##.###.#.###.##o#',
  '#........#........#',
  '###################',
]
const COLS = MAP[0].length
const ROWS = MAP.length
const CELL = 28
// 外圍牆線離格子邊緣有一段空白，裁掉讓畫面更緊湊
const PAD = 22
const VW = COLS * CELL - PAD * 2
const VH = ROWS * CELL - PAD * 2
const DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
]
const GHOST_COLORS = ['#d9534f', '#e59ab5', '#4fb0c6']

type Ent = { x: number; y: number; dx: number; dy: number }
type Ghost = Ent & { wait: number; eaten: boolean }

const wall = (x: number, y: number) => y < 0 || y >= ROWS || x < 0 || x >= COLS || MAP[y][x] === '#'

function advance(e: Ent, dist: number, choose: (e: Ent) => void) {
  let guard = 0
  while (dist > 1e-6 && guard++ < 8) {
    const cx = Math.round(e.x)
    const cy = Math.round(e.y)
    const atCenter = Math.abs(e.x - cx) < 1e-6 && Math.abs(e.y - cy) < 1e-6
    if (atCenter) {
      e.x = cx
      e.y = cy
      choose(e)
      if ((!e.dx && !e.dy) || wall(cx + e.dx, cy + e.dy)) {
        e.dx = 0
        e.dy = 0
        return
      }
    }
    if (!e.dx && !e.dy) return
    let d = 1
    if (!atCenter) {
      if (e.dx > 0) d = Math.ceil(e.x) - e.x
      else if (e.dx < 0) d = e.x - Math.floor(e.x)
      else if (e.dy > 0) d = Math.ceil(e.y) - e.y
      else d = e.y - Math.floor(e.y)
    }
    const m = Math.min(d, dist)
    e.x += e.dx * m
    e.y += e.dy * m
    dist -= m
    if (m === d) {
      e.x = Math.round(e.x)
      e.y = Math.round(e.y)
    }
  }
}

export function PacGame() {
  const { t } = useLang()
  const ref = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ score: 0, lives: 3, demo: true, over: false })

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = window.devicePixelRatio || 1
    canvas.width = VW * dpr
    canvas.height = VH * dpr
    ctx.setTransform(dpr, 0, 0, dpr, -PAD * dpr, -PAD * dpr)

    let dots: boolean[][] = []
    let pac: Ent = { x: 9, y: 11, dx: 0, dy: 0 }
    let want = { dx: 0, dy: 0 }
    let ghosts: Ghost[] = []
    let score = 0
    let lives = 3
    let demo = true
    let over = false
    let freeze = 0
    let scared = 0
    let mouth = 0
    let visible = true
    let raf = 0
    let last = 0
    let speedUp = 1

    const sync = () => setHud({ score, lives, demo, over })

    const resetDots = () => {
      dots = MAP.map((r) => [...r].map((c) => c === '.' || c === 'o'))
    }
    const resetPositions = () => {
      pac = { x: 9, y: 11, dx: 0, dy: 0 }
      want = { dx: 0, dy: 0 }
      ghosts = [0, 1, 2].map((i) => ({ x: 8 + i, y: 7, dx: 0, dy: 0, wait: i * 0.9, eaten: false }))
      scared = 0
      freeze = 0.8
    }
    const newGame = (isDemo: boolean) => {
      resetDots()
      resetPositions()
      score = 0
      lives = 3
      demo = isDemo
      over = false
      speedUp = 1
      sync()
    }

    const dotsLeft = () => dots.some((r) => r.some(Boolean))

    const choosePac = (e: Ent) => {
      if (demo) {
        // 展示模式：偏好有點點的方向，避開鬼
        const opts = DIRS.filter((d) => !wall(e.x + d.dx, e.y + d.dy))
        let best = opts[0]
        let bestScore = -1e9
        for (const d of opts) {
          const nx = e.x + d.dx
          const ny = e.y + d.dy
          let s = Math.random() * 2
          if (dots[ny]?.[nx]) s += 2
          if (d.dx === -e.dx && d.dy === -e.dy && (e.dx || e.dy)) s -= 3
          for (const g of ghosts) {
            if (g.wait > 0 || g.eaten) continue
            const dist = Math.abs(g.x - nx) + Math.abs(g.y - ny)
            if (scared > 0) s += Math.max(0, 6 - dist) * 0.6
            else if (dist < 4) s -= (4 - dist) * 3
          }
          if (s > bestScore) {
            bestScore = s
            best = d
          }
        }
        e.dx = best.dx
        e.dy = best.dy
        return
      }
      if (want.dx || want.dy) {
        if (!wall(e.x + want.dx, e.y + want.dy)) {
          e.dx = want.dx
          e.dy = want.dy
        }
      }
    }

    const chooseGhost = (g: Ghost) => (e: Ent) => {
      const opts = DIRS.filter((d) => !wall(e.x + d.dx, e.y + d.dy) && !(d.dx === -e.dx && d.dy === -e.dy && (e.dx || e.dy)))
      const list = opts.length ? opts : DIRS.filter((d) => !wall(e.x + d.dx, e.y + d.dy))
      if (!list.length) return
      let pick = list[Math.floor(Math.random() * list.length)]
      const chase = ghosts.indexOf(g) === 0 ? 0.75 : 0.45
      if (Math.random() < chase) {
        const sign = scared > 0 ? -1 : 1
        let best = 1e9
        for (const d of list) {
          const dist = Math.abs(pac.x - (e.x + d.dx)) + Math.abs(pac.y - (e.y + d.dy))
          if (dist * sign < best) {
            best = dist * sign
            pick = d
          }
        }
      }
      e.dx = pick.dx
      e.dy = pick.dy
    }

    const loseLife = () => {
      if (demo) {
        // 展示模式被抓到：整盤重來，每次看到的都是完整的一盤
        newGame(true)
        return
      }
      lives--
      if (lives <= 0) {
        over = true
        sync()
        return
      }
      resetPositions()
      sync()
    }

    const update = (dt: number) => {
      if (over) return
      if (freeze > 0) {
        freeze -= dt
        return
      }
      mouth += dt * 9
      if (scared > 0) scared -= dt
      advance(pac, 5.2 * speedUp * dt, choosePac)
      const px = Math.round(pac.x)
      const py = Math.round(pac.y)
      if (Math.abs(pac.x - px) < 0.35 && Math.abs(pac.y - py) < 0.35 && dots[py]?.[px]) {
        dots[py][px] = false
        if (MAP[py][px] === 'o') {
          scared = 6
          score += 50
        } else score += 10
        sync()
        if (!dotsLeft()) {
          resetDots()
          resetPositions()
          speedUp = Math.min(1.4, speedUp + 0.08)
        }
      }
      for (const g of ghosts) {
        if (g.wait > 0) {
          g.wait -= dt
          if (g.wait <= 0) g.eaten = false
        }
        // 剛被吃掉、正在重生的鬼看不見也碰不到；還沒出發的鬼站在原地，但碰得到
        if (g.eaten) continue
        if (g.wait <= 0) {
          const sp = scared > 0 ? 3 : 4.4 * speedUp
          advance(g, sp * dt, chooseGhost(g))
        }
        if (Math.hypot(g.x - pac.x, g.y - pac.y) < 0.6) {
          if (scared > 0) {
            score += 200
            g.x = 9
            g.y = 7
            g.dx = 0
            g.dy = 0
            g.wait = 2
            g.eaten = true
            sync()
          } else {
            loseLife()
            return
          }
        }
      }
    }

    const css = () => {
      const cs = getComputedStyle(document.documentElement)
      return {
        accent: cs.getPropertyValue('--accent').trim() || '#b4532a',
        muted: cs.getPropertyValue('--muted').trim() || '#6b6862',
        text: cs.getPropertyValue('--text').trim() || '#1d1c1a',
        bg: cs.getPropertyValue('--bg').trim() || '#fbfaf7',
      }
    }

    const drawGhost = (g: Ghost, i: number, c: ReturnType<typeof css>) => {
      if (g.eaten && g.wait > 0) return
      const x = g.x * CELL + CELL / 2
      const y = g.y * CELL + CELL / 2
      const r = CELL * 0.4
      const blink = scared > 0 && scared < 1.8 && Math.floor(scared * 5) % 2 === 0
      ctx.fillStyle = scared > 0 ? (blink ? c.bg : '#4a5cc8') : GHOST_COLORS[i]
      ctx.beginPath()
      ctx.arc(x, y - 1, r, Math.PI, 0)
      ctx.lineTo(x + r, y + r)
      const w = (r * 2) / 3
      for (let k = 0; k < 3; k++) {
        ctx.lineTo(x + r - w * (k + 0.5), y + r - 4)
        ctx.lineTo(x + r - w * (k + 1), y + r)
      }
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(x - 6, y - 5, 4, 5)
      ctx.fillRect(x + 2, y - 5, 4, 5)
      ctx.fillStyle = '#1d1c1a'
      ctx.fillRect(x - 5 + g.dx * 1.5, y - 3 + g.dy * 1.5, 2, 3)
      ctx.fillRect(x + 3 + g.dx * 1.5, y - 3 + g.dy * 1.5, 2, 3)
    }

    const draw = () => {
      const c = css()
      ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL)
      // 牆：只畫「牆與空地交界」的邊線，變成輪廓迷宮
      ctx.strokeStyle = c.muted
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 2
      ctx.lineCap = 'square'
      ctx.beginPath()
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          if (MAP[y][x] !== '#') continue
          const px = x * CELL
          const py = y * CELL
          const open = (xx: number, yy: number) => !wall(xx, yy)
          const i = 4
          if (open(x, y - 1)) { ctx.moveTo(px + i, py + i); ctx.lineTo(px + CELL - i, py + i) }
          if (open(x, y + 1)) { ctx.moveTo(px + i, py + CELL - i); ctx.lineTo(px + CELL - i, py + CELL - i) }
          if (open(x - 1, y)) { ctx.moveTo(px + i, py + i); ctx.lineTo(px + i, py + CELL - i) }
          if (open(x + 1, y)) { ctx.moveTo(px + CELL - i, py + i); ctx.lineTo(px + CELL - i, py + CELL - i) }
        }
      ctx.stroke()
      ctx.globalAlpha = 1
      // 點點
      const pulse = Math.floor(performance.now() / 350) % 2
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          if (!dots[y]?.[x]) continue
          const cx = x * CELL + CELL / 2
          const cy = y * CELL + CELL / 2
          if (MAP[y][x] === 'o') {
            ctx.fillStyle = c.accent
            const s = pulse ? 10 : 8
            ctx.fillRect(cx - s / 2, cy - s / 2, s, s)
          } else {
            ctx.fillStyle = c.muted
            ctx.fillRect(cx - 2, cy - 2, 4, 4)
          }
        }
      // 吃豆人
      const px = pac.x * CELL + CELL / 2
      const py = pac.y * CELL + CELL / 2
      const open = (Math.sin(mouth) + 1) / 2 * 0.55 + 0.05
      const face = pac.dx < 0 ? Math.PI : pac.dy > 0 ? Math.PI / 2 : pac.dy < 0 ? -Math.PI / 2 : 0
      ctx.fillStyle = c.accent
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.arc(px, py, CELL * 0.42, face + open, face + Math.PI * 2 - open)
      ctx.closePath()
      ctx.fill()
      ghosts.forEach((g, i) => drawGhost(g, i, c))
      if (over) {
        ctx.fillStyle = c.bg
        ctx.globalAlpha = 0.7
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
        ctx.globalAlpha = 1
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000 || 0)
      last = now
      if (!visible) return
      update(dt)
      draw()
    }

    newGame(true)
    if (reduce) {
      draw()
    } else {
      raf = requestAnimationFrame(frame)
    }

    const takeOver = (d: { dx: number; dy: number }) => {
      if (demo || over) newGame(false)
      want = d
      // 想反方向走時，立刻掉頭，不用等到下一個路口
      if (pac.dx === -d.dx && pac.dy === -d.dy && (pac.dx || pac.dy)) {
        pac.dx = d.dx
        pac.dy = d.dy
      }
    }

    // 用實體按鍵位置（code）判斷，注音等輸入法開著時 key 會變成 Process，WASD 就會失效
    const keys: Record<string, { dx: number; dy: number }> = {
      ArrowRight: DIRS[0], KeyD: DIRS[0],
      ArrowLeft: DIRS[1], KeyA: DIRS[1],
      ArrowDown: DIRS[2], KeyS: DIRS[2],
      ArrowUp: DIRS[3], KeyW: DIRS[3],
    }
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.code]
      if (!d || e.metaKey || e.ctrlKey || e.altKey || !visible) return
      const el = e.target as HTMLElement
      if (el && /INPUT|TEXTAREA|SELECT/.test(el.tagName)) return
      e.preventDefault()
      takeOver(d)
    }
    // 觸控 / 滑鼠：點在吃豆人的哪一側，就往那個方向
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const sx = (((e.clientX - r.left) / r.width) * VW + PAD) / CELL
      const sy = (((e.clientY - r.top) / r.height) * VH + PAD) / CELL
      const ddx = sx - (pac.x + 0.5)
      const ddy = sy - (pac.y + 0.5)
      takeOver(Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? DIRS[0] : DIRS[1]) : ddy > 0 ? DIRS[2] : DIRS[3])
    }
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting))
    io.observe(canvas)
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', onPointer)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <div className="pacgame">
      <div className="pacgame-hud">
        <span>
          {t('game.score')} {String(hud.score).padStart(5, '0')}
        </span>
        <span aria-hidden="true">{hud.demo ? 'DEMO' : '●'.repeat(hud.lives)}</span>
      </div>
      <canvas ref={ref} className="pacgame-canvas" aria-label={t('game.label')} />
      <p className="pacgame-hint">{hud.over ? t('game.over') : t('game.hint')}</p>
    </div>
  )
}
