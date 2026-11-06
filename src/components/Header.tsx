import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { site } from '../data/site'
import { Icon } from './Icons'
import { useLang } from '../i18n'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function Header() {
  const { pathname } = useLocation()
  const { lang, setLang, t } = useLang()
  const headerRef = useRef<HTMLElement>(null)

  // 把頂部高度存成 CSS 變數，讓 Cowork 的滿版 3D 剛好接在下面
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const isHome = pathname === '/'
  // 首頁一開始不顯示左上角名稱，捲過大標題後才出現（和參考網站一樣）
  const [brandHidden, setBrandHidden] = useState(isHome)

  useEffect(() => {
    if (!isHome) {
      setBrandHidden(false)
      return
    }
    const title = document.getElementById('intro-title')
    if (!title) return
    const observer = new IntersectionObserver(
      ([entry]) => setBrandHidden(entry.isIntersecting),
      { rootMargin: '-70px 0px 0px 0px' },
    )
    observer.observe(title)
    return () => observer.disconnect()
  }, [isHome])

  function toggleTheme() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // 無法儲存時就只在這次瀏覽有效
    }
  }

  return (
    <header ref={headerRef} className="site-header" data-brand-hidden={brandHidden ? '' : undefined}>
      <div className="container inner">
        <div className="left">
          <Link className="brand" to="/" tabIndex={brandHidden ? -1 : 0}>
            {site.name}
          </Link>
        </div>
        <div className="right">
          <nav aria-label={t('nav.main')}>
            {site.nav.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <span className="divider" aria-hidden="true" />
          <button
            type="button"
            className="icon-button lang-button"
            aria-label={t('lang.toggle')}
            title={t('lang.toggle')}
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          >
            {t('lang.short')}
          </button>
          <button type="button" className="icon-button theme-button" aria-label={t('theme.toggle')} title={t('theme.toggle')} onClick={toggleTheme}>
            <span className="icon-moon"><Icon name="moon" /></span>
            <span className="icon-sun"><Icon name="sun" /></span>
          </button>
        </div>
      </div>
    </header>
  )
}
