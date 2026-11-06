import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { useLang } from '../i18n'

export function Layout() {
  const { pathname } = useLocation()
  const { t } = useLang()

  // 換頁時回到頁面最上方
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a className="visually-hidden" href="#main">
        {t('skip')}
      </a>
      <Header />
      <main id="main">
        <div className="container">
          <div key={pathname} className="route">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
