import { useCallback, useEffect, useState } from 'react'
import { renderCard, type CardSize } from '../lib/shareCard'

type Props = {
  slug: string
  title: string
  summary: string
  minutes: number
  dateText: string
  zh: boolean
}

const svg = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

// 點分享圖示 → 直接顯示圖片卡片，下方可以複製連結或儲存圖片
export function ShareMenu({ slug, title, summary, minutes, dateText, zh }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [size, setSize] = useState<CardSize>('4:5')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const tx = (a: string, b: string) => (zh ? a : b)
  const readText = zh ? `約 ${minutes} 分鐘閱讀` : `${minutes} min read`

  useEffect(() => {
    if (!open) return
    let stale = false
    setBlob(null)
    setError('')
    renderCard({ title, summary, minutes, dateText, readText, size })
      .then((b) => {
        if (stale) return
        setBlob(b)
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old)
          return URL.createObjectURL(b)
        })
      })
      .catch(() => !stale && setError(tx('圖片產生失敗', 'Could not create the image')))
    return () => {
      stale = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, size, title, summary, minutes, dateText, slug, zh])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* 剪貼簿不可用 */
    }
  }, [])

  const save = async () => {
    if (!blob) return
    const file = new File([blob], `${slug}-${size.replace(':', 'x')}.png`, { type: 'image/png' })
    // 手機上走系統分享選單，裡面有「儲存影像」可以直接存進相簿（直接下載檔案只會進「檔案」App）
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return // 使用者取消
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="share-menu">
      <button type="button" className="share-btn" aria-label={tx('分享', 'Share')} title={tx('分享', 'Share')} onClick={() => setOpen(true)}>
        <svg {...svg}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
        </svg>
      </button>

      {open && (
        <div className="share-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="share-dialog" role="dialog" aria-modal="true" aria-label={tx('分享', 'Share')}>
            <div className="share-dialog-top">
              <div className="share-sizes" role="group" aria-label={tx('尺寸', 'Size')}>
                {(['4:5', '9:16'] as CardSize[]).map((s) => (
                  <button key={s} type="button" className={size === s ? 'on' : ''} onClick={() => setSize(s)}>
                    {s === '4:5' ? tx('貼文 4:5', 'Post 4:5') : tx('限動 9:16', 'Story 9:16')}
                  </button>
                ))}
              </div>
              <button type="button" className="share-close" aria-label={tx('關閉', 'Close')} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            <div className="share-preview">{error ? <p>{error}</p> : preview && blob ? <img src={preview} alt={tx('分享圖片預覽', 'Share image preview')} /> : <p>{tx('產生中…', 'Creating…')}</p>}</div>
            <p className="share-hint">{tx('手機上也可以長按圖片來儲存', 'On mobile you can also press and hold the image to save it')}</p>
            <div className="share-dialog-actions">
              <button type="button" className="share-secondary" onClick={() => void copy()}>
                <svg {...svg}>
                  {copied ? (
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                    </>
                  )}
                </svg>
                {copied ? tx('已複製連結', 'Link copied') : tx('複製連結', 'Copy link')}
              </button>
              <button type="button" className="share-secondary" disabled={!blob} onClick={() => void save()}>
                <svg {...svg}>
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                {tx('儲存圖片', 'Save image')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
