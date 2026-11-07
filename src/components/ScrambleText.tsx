import { useEffect, useRef } from 'react'

// 亂碼揭示：一串跳動的亂碼，由左到右解出正確文字，停留後再打散重來。
// 字用小方格組成（把字型轉成點陣再畫），所以中英文都是像素字。
const G = 22 // 字高（格）
const CELL = 2 // 畫布內每格的像素
const DISPLAY = 0.5 // 顯示縮放
const REVEAL_DELAY = 0.5
const REVEAL_STEP = 0.09
const HOLD = 3.5
const SCATTER_STEP = 0.035
// 亂碼用程式碼的符號與十六進位字元；寬格放兩個字（像 0x、{}、=>）
const CODE = '{}[]()<>/\\;:=+-*&|!?#$%@~^_0123456789ABCDEF'
const isWide = (ch: string) => /[^\u0000-ÿ]/.test(ch)

const cache = new Map<string, boolean[][]>()
function bits(ch: string, w: number, mono = false): boolean[][] {
  const key = `${ch}|${w}|${mono ? 1 : 0}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = G
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.fillStyle = '#000'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = mono
    ? `700 ${Math.round(G * 0.72)}px "Geist Mono",ui-monospace,Menlo,monospace`
    : `700 ${G - 2}px "PingFang TC","Microsoft JhengHei","Noto Sans TC","Hiragino Sans",sans-serif`
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

export function ScrambleText({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const chars = [...text]
    const widths = chars.map((ch) => (isWide(ch) ? G : Math.round(G * 0.55)))
    const total = widths.reduce((a, b) => a + b, 0)
    const dpr = window.devicePixelRatio || 1
    canvas.width = total * CELL * dpr
    canvas.height = G * CELL * dpr
    // 實際顯示成一半大小：每格剛好 1 CSS px，字高約 22px，比標題小
    canvas.style.width = `${total * CELL * DISPLAY}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const n = chars.length
    const holdStart = REVEAL_DELAY + n * REVEAL_STEP + HOLD
    const cycle = holdStart + n * SCATTER_STEP + 0.35
    let noise: string[] = []
    let noiseAt = -1
    let visible = true
    let raf = 0
    const t0 = performance.now()

    const one = () => CODE[Math.floor(Math.random() * CODE.length)]
    const pick = (wide: boolean) => (wide ? one() + one() : one())

    const draw = (T: number, tick: number) => {
      if (tick !== noiseAt) {
        noiseAt = tick
        noise = chars.map((ch) => pick(isWide(ch)))
      }
      const cs = getComputedStyle(document.documentElement)
      const text = cs.getPropertyValue('--text').trim() || '#1d1c1a'
      const accent = cs.getPropertyValue('--accent').trim() || '#b4532a'
      ctx.clearRect(0, 0, total * CELL, G * CELL)
      let ox = 0
      chars.forEach((ch, i) => {
        const w = widths[i]
        const solved = reduce || (T >= REVEAL_DELAY + i * REVEAL_STEP && T < holdStart + i * SCATTER_STEP)
        // 剛解出來的那一格短暫用強調色，像剛解碼完
        const fresh = !reduce && solved && T < REVEAL_DELAY + i * REVEAL_STEP + 0.18
        const glyph = ch === ' ' ? [] : bits(solved ? ch : noise[i], w, !solved)
        ctx.fillStyle = solved && !fresh ? text : accent
        glyph.forEach((row, j) =>
          row.forEach((on, k) => {
            if (on) ctx.fillRect((ox + k) * CELL, j * CELL, CELL, CELL)
          }),
        )
        ox += w
      })
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const T = ((now - t0) / 1000) % cycle
      draw(T, Math.floor(now / 70))
    }

    if (reduce) draw(0, 0)
    else raf = requestAnimationFrame(frame)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [text])

  return <canvas ref={ref} className="scramble" role="img" aria-label={text} />
}
