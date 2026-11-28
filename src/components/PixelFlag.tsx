import { useEffect, useRef } from 'react'
import { flag } from '../data/footprints'

// 像素國旗：先把國旗 emoji 畫在 16×12 的小畫布上，再用最近鄰放大，就會變成一格一格的像素旗。
const W = 16
const H = 12

export function PixelFlag({ code }: { code: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current!.getContext('2d', { willReadFrequently: true })!
    ctx.clearRect(0, 0, W, H)
    ctx.font = `${H}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(flag(code), 0, H - 1.5)
  }, [code])
  return <canvas ref={ref} className="fp-pixflag" width={W} height={H} aria-hidden="true" />
}
