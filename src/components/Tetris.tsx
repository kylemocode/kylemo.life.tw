import { useEffect, useRef } from 'react'

// 俄羅斯方塊：自己會玩的小裝飾（沒有操作）。方塊只用網站既有的顏色。
const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
]

function rotate(m: number[][]) {
  return m[0].map((_, i) => m.map((r) => r[i]).reverse())
}

type Props = {
  rows: number
  cell?: number
  /** loop：疊滿後清空重來；over：疊滿就停住（404 用） */
  mode: 'loop' | 'over'
  /** 固定欄數；不給就依容器寬度 */
  cols?: number
  className?: string
}

export function Tetris({ rows, cell = 10, mode, cols: fixedCols, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cols = 0
    let grid: number[][] = [] // 0 空、1 方塊
    let piece: { m: number[][]; x: number; y: number } | null = null
    let timer = 0
    let visible = true
    let flash = 0
    let over = false

    const colors = () => {
      const cs = getComputedStyle(document.documentElement)
      return { a: cs.getPropertyValue('--accent').trim() || '#b4532a', m: cs.getPropertyValue('--muted').trim() || '#6b6862' }
    }

    const fits = (m: number[][], x: number, y: number) =>
      m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < cols && y + j < rows && !(y + j >= 0 && grid[y + j][x + i]))))

    const draw = () => {
      const { a, m } = colors()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const box = (x: number, y: number, c: string) => {
        ctx.fillStyle = c
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
      }
      grid.forEach((r, y) => r.forEach((v, x) => v && box(x, y, flash % 2 ? a : m)))
      if (piece) piece.m.forEach((r, j) => r.forEach((v, i) => v && box(piece!.x + i, piece!.y + j, a)))
    }

    const fillRandom = () => {
      // 一開始先有一點底，看起來像已經玩了一陣子
      grid = Array.from({ length: rows }, () => Array(cols).fill(0))
      for (let x = 0; x < cols; x++) {
        const h = Math.random() < 0.6 ? 1 : 0
        if (h) grid[rows - 1][x] = 1
      }
    }

    const spawn = () => {
      let m = SHAPES[Math.floor(Math.random() * SHAPES.length)]
      for (let k = Math.floor(Math.random() * 4); k > 0; k--) m = rotate(m)
      const x = Math.floor(Math.random() * (cols - m[0].length + 1))
      piece = { m, x, y: -m.length }
      if (!fits(m, x, 0)) return false
      return true
    }

    const reset = () => {
      over = false
      fillRandom()
      spawn()
    }

    const tick = () => {
      if (!visible || over) return
      if (flash > 0) {
        flash--
        if (flash === 0) reset()
        draw()
        return
      }
      if (!piece) {
        if (!spawn()) return end()
      } else if (fits(piece.m, piece.x, piece.y + 1)) {
        piece.y++
      } else {
        piece.m.forEach((r, j) => r.forEach((v, i) => v && piece!.y + j >= 0 && (grid[piece!.y + j][piece!.x + i] = 1)))
        piece = null
        // 滿行就消掉
        grid = grid.filter((r) => !r.every(Boolean))
        while (grid.length < rows) grid.unshift(Array(cols).fill(0))
        // 太高了就結束
        if (grid[1].some(Boolean)) return end()
      }
      draw()
    }

    const end = () => {
      piece = null
      if (mode === 'over') {
        over = true
        draw()
      } else {
        flash = 6
        draw()
      }
    }

    const size = () => {
      const w = fixedCols ? fixedCols * cell : Math.floor(canvas.parentElement!.clientWidth / cell) * cell
      cols = Math.max(4, Math.floor(w / cell))
      const dpr = window.devicePixelRatio || 1
      canvas.width = cols * cell * dpr
      canvas.height = rows * cell * dpr
      canvas.style.width = `${cols * cell}px`
      canvas.style.height = `${rows * cell}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      reset()
      draw()
    }

    size()
    const ro = new ResizeObserver(() => {
      const w = Math.floor(canvas.parentElement!.clientWidth / cell)
      if (!fixedCols && w !== cols) size()
    })
    ro.observe(canvas.parentElement!)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    if (!reduce) timer = window.setInterval(tick, mode === 'over' ? 110 : 200)
    return () => {
      clearInterval(timer)
      ro.disconnect()
      io.disconnect()
    }
  }, [rows, cell, mode, fixedCols])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
