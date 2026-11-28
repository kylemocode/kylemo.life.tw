import { useEffect, useRef, useState } from 'react'
import { MAP } from '../data/worldMap'

// 像素世界地圖：一格一格的點陣，去過的國家用主色亮起。
// 地圖資料在 data/worldMap.ts；游標（或手指）移到國家上，會和下方的國家清單連動，亮起與熄滅都有漸變。
const COLS = MAP.rows[0].length
const ROWS = MAP.rows.length

type RGB = [number, number, number]
// 任何 CSS 顏色（hex、rgb…）都先畫在 1×1 的畫布上，再讀回 RGB，才能做漸變
function toRgb(color: string): RGB {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.fillStyle = color
  x.fillRect(0, 0, 1, 1)
  const d = x.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2]]
}

export function PixelMap({ active, onActive }: { active: string | null; onActive: (code: string | null) => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState(0)
  const [themeTick, setThemeTick] = useState(0)
  const levels = useRef<Record<string, number>>({}) // 每個國家目前的亮度（0 = 主色，1 = 亮白）
  const drawRef = useRef<() => void>(() => {})
  const activeRef = useRef(active)
  activeRef.current = active

  // 容器寬度（用來決定每格大小）與主題切換
  useEffect(() => {
    const box = boxRef.current!
    const ro = new ResizeObserver(() => setSize(Math.floor(box.clientWidth)))
    ro.observe(box)
    const mo = new MutationObserver(() => setThemeTick((n) => n + 1))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  // 尺寸或主題改變：重新設定畫布，並定義繪製函式
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size < COLS) return
    const dpr = window.devicePixelRatio || 1
    const cell = (size * dpr) / COLS // 每格的裝置像素數（可能有小數，座標會取整，格子大小最多差 1 像素）
    canvas.width = Math.floor(size * dpr)
    canvas.height = Math.round(ROWS * cell)
    canvas.style.width = `${canvas.width / dpr}px`
    canvas.style.height = `${canvas.height / dpr}px`
    const ctx = canvas.getContext('2d')!
    const css = getComputedStyle(canvas)
    const land = css.getPropertyValue('--muted').trim() || '#888'
    const accent = toRgb(css.getPropertyValue('--accent').trim() || '#c60')
    const text = toRgb(css.getPropertyValue('--text').trim() || '#fff')
    const gap = cell >= 3.5 ? 1 : 0
    drawRef.current = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      MAP.rows.forEach((row, y) => {
        for (let x = 0; x < COLS; x++) {
          const ch = row[x]
          if (ch === '.') continue
          if (ch === '#') {
            ctx.globalAlpha = 0.26
            ctx.fillStyle = land
          } else {
            const k = levels.current[MAP.codes[ch.charCodeAt(0) - 97]] ?? 0
            ctx.globalAlpha = 1
            ctx.fillStyle = `rgb(${accent.map((a, i) => Math.round(a + (text[i] - a) * k)).join(',')})`
          }
          const x0 = Math.round(x * cell)
          const y0 = Math.round(y * cell)
          ctx.fillRect(x0, y0, Math.round((x + 1) * cell) - x0 - gap, Math.round((y + 1) * cell) - y0 - gap)
        }
      })
    }
    drawRef.current()
  }, [size, themeTick])

  // 亮起／熄滅的漸變動畫
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const step = () => {
      let moving = false
      for (const code of MAP.codes) {
        const target = code === active ? 1 : 0
        const v = levels.current[code] ?? 0
        let next = reduce ? target : v + (target - v) * 0.22
        if (Math.abs(target - next) < 0.02) next = target
        if (next !== v) moving = true
        levels.current[code] = next
      }
      drawRef.current()
      if (moving) raf = requestAnimationFrame(step)
    }
    step()
    return () => cancelAnimationFrame(raf)
  }, [active, size, themeTick])

  function hit(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS)
    const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS)
    const ch = MAP.rows[y]?.[x]
    // 小國（新加坡、香港）只佔一格，順便把周圍一格也算進來比較好點
    let code: string | undefined = ch && ch >= 'a' ? MAP.codes[ch.charCodeAt(0) - 97] : undefined
    if (!code) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const c2 = MAP.rows[y + dy]?.[x + dx]
        if (c2 && c2 >= 'a') code = MAP.codes[c2.charCodeAt(0) - 97]
      }
    }
    onActive(code ?? null)
  }

  return (
    <div ref={boxRef} className="fp-map">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="像素世界地圖，亮起的是去過的國家"
        onPointerMove={hit}
        onPointerDown={hit}
        onPointerLeave={() => onActive(null)}
      />
    </div>
  )
}
