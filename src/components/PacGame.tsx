import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'

// 首頁的吃豆人小遊戲：一開始自己玩（展示模式），按方向鍵 / WASD 或點擊畫面就換你操控。
// 迷宮的牆排成我的名字（KYLE / MO 兩行），尺寸和原本的迷宮一樣。
// # 牆（畫成空心輪廓）、X 排成名字的牆（畫成實心方塊）、. 點點、P 吃豆人起點、G 鬼起點、空白是走不到的地方（沒有點點）
const MAP = [
  '###################',
  '#.................#',
  '#.X.X.X.X.X...XXX.#',
  '#.X.X.X.X.X...X...#',
  '#.XX...X..X...XX..#',
  '#.X.X..X..X...X...#',
  '#.X.X..X..XXX.XXX.#',
  '#.......GGG.......#',
  '#..#.X...X.XXX.#..#',
  '#.##.XX.XX.X X.##.#',
  '#....X.X.X.X X....#',
  '#.##.X...X.X X.##.#',
  '#..#.X...X.XXX.#..#',
  '#........P........#',
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
// 能量豆是我的四個興趣：吉他、跳舞、閱讀、交朋友。每局隨機放在四個地方，用 8×8 像素圖示表示
const ICONS = [
  ['......##', '.....##.', '....##..', '...##...', '.####...', '######..', '##..##..', '.####...'], // 吉他
  ['#..##..#', '#..##..#', '.######.', '...##...', '...##...', '..#..#..', '.#....#.'], // 跳舞
  ['.#####.', '#....#.', '#.##.#.', '#....#.', '#.##.#.', '#....#.', '.#####.'], // 閱讀
  ['.##..##.', '.##..##.', '########', '.##..##.', '.##..##.', '.#....#.'], // 交朋友
]
// 吃到時浮出的字固定用英文（兩種語言都一樣，比較好看）
const PELLET_LABELS = ['Guitar', 'Dancing', 'Reading', 'Making friends']
const GHOST_COLORS = ['#d9534f', '#e59ab5', '#4fb0c6']

type Ent = { x: number; y: number; dx: number; dy: number }
type Ghost = Ent & { wait: number; eaten: boolean }

const wall = (x: number, y: number) => y < 0 || y >= ROWS || x < 0 || x >= COLS || MAP[y][x] === '#' || MAP[y][x] === 'X'

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
  const padRef = useRef<((d: { dx: number; dy: number }) => void) | null>(null)
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
    const find = (ch: string) => {
      const out: { x: number; y: number }[] = []
      MAP.forEach((r, y) => [...r].forEach((c, x) => c === ch && out.push({ x, y })))
      return out
    }
    const pacStart = find('P')[0]
    const ghostStarts = find('G')
    let pac: Ent = { x: pacStart.x, y: pacStart.y, dx: 0, dy: 0 }
    let want = { dx: 0, dy: 0 }
    let ghosts: Ghost[] = []
    let score = 0
    let lives = 3
    let demo = true
    let over = false
    let best = 0
    let record = false
    let freeze = 0
    let scared = 0
    let mouth = 0
    let facing = 0
    let pellets: { x: number; y: number; k: number }[] = []
    let toast: { text: string; x: number; y: number; life: number } | null = null
    let visible = true
    let raf = 0
    let last = 0
    let speedUp = 1

    const sync = () => setHud({ score, lives, demo, over })

    const resetDots = () => {
      dots = MAP.map((r) => [...r].map((c) => c === '.'))
      // 隨機挑四個彼此有距離、離起點和鬼屋也有距離的點點當能量豆
      const cells: { x: number; y: number }[] = []
      dots.forEach((row, y) => row.forEach((on, x) => on && cells.push({ x, y })))
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[cells[i], cells[j]] = [cells[j], cells[i]]
      }
      const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
      const picked: { x: number; y: number }[] = []
      for (const gap of [7, 5, 3, 0]) {
        for (const c of cells) {
          if (picked.length >= 4) break
          if (picked.includes(c)) continue
          if (dist(c, pacStart) < 4 || ghostStarts.some((g) => dist(c, g) < 3)) continue
          if (picked.every((q) => dist(c, q) >= gap)) picked.push(c)
        }
        if (picked.length >= 4) break
      }
      const kinds = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
      pellets = picked.map((c, i) => ({ ...c, k: kinds[i] }))
    }
    const resetPositions = () => {
      pac = { x: pacStart.x, y: pacStart.y, dx: 0, dy: 0 }
      want = { dx: 0, dy: 0 }
      ghosts = ghostStarts.map((p, i) => ({ x: p.x, y: p.y, dx: 0, dy: 0, wait: i * 0.9, eaten: false }))
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
      record = false
      toast = null
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
        try {
          best = Number(localStorage.getItem('pac-best')) || 0
          record = score > best
          if (record) {
            best = score
            localStorage.setItem('pac-best', String(score))
          }
        } catch {
          best = Math.max(best, score)
        }
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
      if (toast && (toast.life -= dt) <= 0) toast = null
      if (scared > 0) scared -= dt
      advance(pac, 5.2 * speedUp * dt, choosePac)
      const px = Math.round(pac.x)
      const py = Math.round(pac.y)
      if (Math.abs(pac.x - px) < 0.35 && Math.abs(pac.y - py) < 0.35 && dots[py]?.[px]) {
        dots[py][px] = false
        const pl = pellets.find((q) => q.x === px && q.y === py)
        if (pl) {
          scared = 6
          score += 50
          toast = { text: PELLET_LABELS[pl.k], x: px, y: py, life: 1.6 }
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
            const home = ghostStarts[ghosts.indexOf(g) % ghostStarts.length]
            g.x = home.x
            g.y = home.y
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

    // 內部的空心障礙：把「牆格的聯集」往內縮 4px 畫成連續的線，L 形才會是一個完整的形狀
    const layer = document.createElement('canvas')
    layer.width = canvas.width
    layer.height = canvas.height
    let layerColor = ''
    const isInner = (x: number, y: number) => x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && MAP[y][x] === '#'
    const drawLayer = (color: string) => {
      const l = layer.getContext('2d')!
      l.setTransform(1, 0, 0, 1, 0, 0)
      l.clearRect(0, 0, layer.width, layer.height)
      l.setTransform(dpr, 0, 0, dpr, -PAD * dpr, -PAD * dpr)
      const region = new Path2D()
      const edges = new Path2D()
      for (let y = 1; y < ROWS - 1; y++)
        for (let x = 1; x < COLS - 1; x++) {
          if (!isInner(x, y)) continue
          const px = x * CELL
          const py = y * CELL
          region.rect(px - 0.5, py - 0.5, CELL + 1, CELL + 1)
          if (!wall(x, y - 1)) { edges.moveTo(px, py); edges.lineTo(px + CELL, py) }
          if (!wall(x, y + 1)) { edges.moveTo(px, py + CELL); edges.lineTo(px + CELL, py + CELL) }
          if (!wall(x - 1, y)) { edges.moveTo(px, py); edges.lineTo(px, py + CELL) }
          if (!wall(x + 1, y)) { edges.moveTo(px + CELL, py); edges.lineTo(px + CELL, py + CELL) }
        }
      l.save()
      l.clip(region)
      l.strokeStyle = color
      l.lineCap = 'square'
      l.lineJoin = 'miter'
      l.lineWidth = 2 * 5 // 先畫出內側 5px 的帶狀
      l.stroke(edges)
      l.globalCompositeOperation = 'destination-out'
      l.lineWidth = 2 * 3 // 再挖掉內側 3px，只剩距離邊緣 3~5px、寬 2px 的線
      l.stroke(edges)
      l.restore()
      layerColor = color
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
          const ch = MAP[y][x]
          if (ch !== '#' && ch !== 'X') continue
          if (isInner(x, y)) continue
          const px = x * CELL
          const py = y * CELL
          // 排成名字的牆畫成實心方塊，才讀得出字；其餘的牆只畫與空地交界的邊線（輪廓）
          if (ch === 'X') {
            ctx.fillStyle = c.muted
            ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6)
            continue
          }
          const open = (xx: number, yy: number) => !wall(xx, yy)
          const i = 4
          if (open(x, y - 1)) { ctx.moveTo(px + i, py + i); ctx.lineTo(px + CELL - i, py + i) }
          if (open(x, y + 1)) { ctx.moveTo(px + i, py + CELL - i); ctx.lineTo(px + CELL - i, py + CELL - i) }
          if (open(x - 1, y)) { ctx.moveTo(px + i, py + i); ctx.lineTo(px + i, py + CELL - i) }
          if (open(x + 1, y)) { ctx.moveTo(px + CELL - i, py + i); ctx.lineTo(px + CELL - i, py + CELL - i) }
        }
      ctx.stroke()
      if (layerColor !== c.muted) drawLayer(c.muted)
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(layer, 0, 0)
      ctx.restore()
      ctx.globalAlpha = 1
      // 點點
      const pulse = Math.floor(performance.now() / 350) % 2
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          if (!dots[y]?.[x]) continue
          const cx = x * CELL + CELL / 2
          const cy = y * CELL + CELL / 2
          const pl = pellets.find((q) => q.x === x && q.y === y)
          if (pl) {
            const icon = ICONS[pl.k]
            const S = 3
            const ox = cx - (icon[0].length * S) / 2
            const oy = cy - (icon.length * S) / 2 + (pulse ? -1 : 1)
            ctx.fillStyle = c.accent
            icon.forEach((row, r) => [...row].forEach((ch, q) => ch === '#' && ctx.fillRect(ox + q * S, oy + r * S, S, S)))
          } else {
            ctx.fillStyle = c.muted
            ctx.fillRect(cx - 2, cy - 2, 4, 4)
          }
        }
      // 吃到能量豆時，在原地飄出興趣的名字
      if (toast) {
        const k = 1 - toast.life / 1.6
        const tx = Math.max(PAD + 50, Math.min(COLS * CELL - PAD - 50, toast.x * CELL + CELL / 2))
        // 在最上面一排時，字放在下方，不然會被畫面邊緣切掉
        const up = toast.y * CELL + CELL / 2 - 16 > PAD + 14
        const ty = toast.y * CELL + CELL / 2 + (up ? -16 - k * 10 : 18 + k * 10)
        ctx.globalAlpha = Math.min(1, toast.life * 2)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 15px "Geist", "PingFang TC", "Noto Sans TC", sans-serif'
        ctx.lineWidth = 4
        ctx.strokeStyle = '#161513'
        ctx.strokeText(toast.text, tx, ty)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(toast.text, tx, ty)
        ctx.textAlign = 'start'
        ctx.textBaseline = 'alphabetic'
        ctx.globalAlpha = 1
      }
      // 吃豆人
      const px = pac.x * CELL + CELL / 2
      const py = pac.y * CELL + CELL / 2
      const open = (Math.sin(mouth) + 1) / 2 * 0.55 + 0.05
      // 撞牆停下來時 dx、dy 都是 0，要沿用最後一次的朝向，不然嘴巴會跳回朝右
      if (pac.dx || pac.dy) facing = pac.dx < 0 ? Math.PI : pac.dy > 0 ? Math.PI / 2 : pac.dy < 0 ? -Math.PI / 2 : 0
      const face = facing
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
        // 大大的 GAME OVER，加上分數與最高分
        const cx = (COLS * CELL) / 2
        const cy = (ROWS * CELL) / 2
        const pad = (n: number) => String(n).padStart(5, '0')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = c.accent
        ctx.font = `${CELL * 2.1}px "Tiny5 Duo", "Geist Mono", monospace`
        ctx.fillText('GAME OVER', cx, cy - CELL * 0.9)
        ctx.fillStyle = c.text
        ctx.font = `bold ${CELL * 0.62}px "Geist Mono", ui-monospace, monospace`
        ctx.fillText(`SCORE ${pad(score)}   BEST ${pad(best)}`, cx, cy + CELL * 0.9)
        if (record) {
          ctx.fillStyle = c.accent
          ctx.fillText('NEW RECORD!', cx, cy + CELL * 1.9)
        }
        ctx.textAlign = 'start'
        ctx.textBaseline = 'alphabetic'
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
      if (e.pointerType !== 'mouse') return
      const r = canvas.getBoundingClientRect()
      const sx = (((e.clientX - r.left) / r.width) * VW + PAD) / CELL
      const sy = (((e.clientY - r.top) / r.height) * VH + PAD) / CELL
      const ddx = sx - (pac.x + 0.5)
      const ddy = sy - (pac.y + 0.5)
      takeOver(Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? DIRS[0] : DIRS[1]) : ddy > 0 ? DIRS[2] : DIRS[3])
    }
    // 手機的方向鍵小鍵盤（畫面下方的按鈕）會透過這個接手操控
    padRef.current = takeOver
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
        <span className="pacgame-lives" aria-hidden="true">
          {hud.demo
            ? 'DEMO'
            : [0, 1, 2].map((i) => (
                <svg key={i} viewBox="0 0 9 8" shapeRendering="crispEdges" className={i < hud.lives ? 'heart' : 'heart lost'}>
                  {/* 像素愛心 */}
                  <path d="M1 0h2v1h1v1h1V1h1V0h2v1h1v3H8v1H7v1H6v1H5v1H4V7H3V6H2V5H1V4H0V1h1z" fill="currentColor" />
                </svg>
              ))}
        </span>
      </div>
      <canvas ref={ref} className="pacgame-canvas" aria-label={t('game.label')} />
      <div className="dpad" aria-hidden="true">
        {([['up', 3, '▲'], ['left', 1, '◀'], ['right', 0, '▶'], ['down', 2, '▼']] as const).map(([k, i, g]) => (
          <button
            key={k}
            type="button"
            tabIndex={-1}
            className={`dpad-${k}`}
            onPointerDown={(e) => {
              e.preventDefault()
              padRef.current?.(DIRS[i])
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="pacgame-hint">
        {hud.over ? (
          <>
            <span className="hint-kb">{t('game.over')}</span>
            <span className="hint-touch">{t('game.over.touch')}</span>
          </>
        ) : (
          <>
            <span className="hint-kb">{t('game.hint')}</span>
            <span className="hint-touch">{t('game.hint.touch')}</span>
          </>
        )}
      </p>
    </div>
  )
}
