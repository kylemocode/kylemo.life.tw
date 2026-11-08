import { useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'
import { MagneticLink } from '../components/MagneticLink'

// 桌機與手機並排的預覽：兩個 iframe 載入同一個網站，換頁與捲動互相同步
const DESKTOP = { w: 1280, h: 800 }
const MOBILE = { w: 390, h: 800 }
const GAP = 24

export function Preview() {
  const { t } = useLang()
  const a = useRef<HTMLIFrameElement>(null)
  const b = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(0.6)
  const base = import.meta.env.BASE_URL

  useEffect(() => {
    const fit = () => {
      const avail = window.innerWidth - 48 - GAP
      setScale(Math.min(1, avail / (DESKTOP.w + MOBILE.w)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    let lock = 0
    const last = new WeakMap<Window, string>()
    const wired = new WeakSet<Window>()
    const frames = () => [a.current, b.current]

    const sync = () => {
      const [fa, fb] = frames()
      for (const [src, dst] of [[fa, fb], [fb, fa]] as const) {
        try {
          const sw = src?.contentWindow
          const dw = dst?.contentWindow
          if (!sw || !dw) continue
          const path = sw.location.pathname + sw.location.search
          if (last.get(sw) === undefined) last.set(sw, path)
          if (last.get(sw) !== path) {
            last.set(sw, path)
            if (dw.location.pathname + dw.location.search !== path) {
              last.set(dw, path)
              dw.location.replace(path)
            }
          }
          if (!wired.has(sw)) {
            wired.add(sw)
            sw.addEventListener('scroll', () => {
              if (Date.now() < lock) return
              const se = sw.document.documentElement
              const de = dw.document.documentElement
              const ratio = se.scrollTop / Math.max(1, se.scrollHeight - se.clientHeight)
              lock = Date.now() + 80
              dw.scrollTo(0, ratio * Math.max(0, de.scrollHeight - de.clientHeight))
            })
          }
        } catch {
          // 跨網域時讀不到，略過
        }
      }
    }
    const id = window.setInterval(sync, 250)
    return () => clearInterval(id)
  }, [])

  const frame = (ref: React.RefObject<HTMLIFrameElement | null>, size: { w: number; h: number }, label: string) => (
    <div className="stage-frame" style={{ width: size.w * scale, height: size.h * scale }}>
      <iframe
        ref={ref}
        src={base}
        title={label}
        width={size.w}
        height={size.h}
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  )

  return (
    <div className="preview">
      <header>
        <h1>{t('preview.title')}</h1>
        <span className="muted">{t('preview.hint')}</span>
        <MagneticLink to="/" small>
          {t('nav.home')}
        </MagneticLink>
      </header>
      <div className="stages">
        {frame(a, DESKTOP, 'desktop')}
        {frame(b, MOBILE, 'mobile')}
      </div>
    </div>
  )
}
