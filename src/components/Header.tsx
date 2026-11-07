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
  const [menuOpen, setMenuOpen] = useState(false)

  // 換頁或按 Esc 就收起手機選單
  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // 別的視窗（例如雙螢幕預覽）切換主題時跟著變
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        document.documentElement.dataset.theme = e.newValue
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
    <header
      ref={headerRef}
      className="site-header"
      data-brand-hidden={brandHidden ? '' : undefined}
      data-menu-open={menuOpen ? '' : undefined}
    >
      <div className="container inner">
        <div className="left">
          {isHome && (
            <Link className="home-avatar" to="/" aria-label={site.name} tabIndex={brandHidden ? 0 : -1}>
              <img src={`${import.meta.env.BASE_URL}avatar-home.png`} alt="" width="40" height="40" />
            </Link>
          )}
          <Link className="brand" to="/" tabIndex={brandHidden ? -1 : 0}>
            {site.name}
          </Link>
        </div>
        <button
          type="button"
          className="icon-button menu-button"
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path className="bar bar-top" d="M4 7h16" />
            <path className="bar bar-mid" d="M4 12h16" />
            <path className="bar bar-bot" d="M4 17h16" />
          </svg>
        </button>
        <div className="right" id="site-menu">
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
