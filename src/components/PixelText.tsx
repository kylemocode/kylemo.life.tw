import { useEffect, useRef } from 'react'

// 像素字標題：把字型轉成點陣（20 格高），每一格畫成 1 個 CSS 像素的小方塊，中英文都是像素字。
// 做法和首頁副標（ScrambleText）一樣；會依容器寬度自動換行，主題切換時跟著換色。
const G = 20 // 字高（格）
const LINE = G + 6 // 行高（格）
const isWide = (ch: string) => /[^\u0000-ÿ]/.test(ch)
const cache = new Map<string, boolean[][]>()

function glyph(ch: string, w: number): boolean[][] {
  const key = `${ch}|${w}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = G
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.fillStyle = '#000'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = `700 ${G - 2}px "PingFang TC","Microsoft JhengHei","Noto Sans TC","Hiragino Sans",sans-serif`
  x.fillText(ch, w / 2, G / 2 + 1)
  const d = x.getImageData(0, 0, w, G).data
  const out: boolean[][] = []
  for (let j = 0; j < G; j++) {
    const row: boolean[] = []
    for (let i = 0; i < w; i++) row.push(d[(j * w + i) * 4 + 3] > 110)
    out.push(row)
  }
  cache.set(key, out)
  return out
}

const width = (ch: string) => (isWide(ch) ? G : Math.round(G * 0.55))

// 英文單字不拆開，中文一個字一個字換行
function wrap(text: string, max: number): string[][] {
  const tokens = text.match(/[A-Za-z0-9'’.,:;!?()&/+-]+| |[^\s]/gu) ?? []
  const lines: string[][] = [[]]
  let used = 0
  for (const tok of tokens) {
    const chars = [...tok]
    const w = chars.reduce((a, ch) => a + width(ch), 0)
    if (used + w > max && used > 0) {
      lines.push([])
      used = 0
      if (tok === ' ') continue
    }
    lines[lines.length - 1].push(...chars)
    used += w
  }
  return lines
}

export function PixelText({ text }: { text: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const box = wrapRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      const max = Math.floor(box.clientWidth)
      if (max < G) return
      const lines = wrap(text, max)
      const cssW = Math.max(...lines.map((l) => l.reduce((a, ch) => a + width(ch), 0)))
      const cssH = lines.length * LINE - (LINE - G)
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.ceil(cssW * dpr)
      canvas.height = Math.ceil(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = getComputedStyle(canvas).color
      lines.forEach((line, li) => {
        let x = 0
        for (const ch of line) {
          const w = width(ch)
          if (ch !== ' ') {
            const rows = glyph(ch, w)
            for (let j = 0; j < G; j++) for (let i = 0; i < w; i++) if (rows[j][i]) ctx.fillRect(x + i, li * LINE + j, 1, 1)
          }
          x += w
        }
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(box)
    // 主題切換（深色／淺色）後重畫，字色才會跟著變
    const mo = new MutationObserver(draw)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [text])

  return (
    <span ref={wrapRef} className="pixel-text">
      <span className="sr-only">{text}</span>
      <canvas ref={canvasRef} aria-hidden="true" />
    </span>
  )
}
