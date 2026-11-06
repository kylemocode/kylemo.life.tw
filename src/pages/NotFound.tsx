import { Link } from 'react-router-dom'
import { useLang } from '../i18n'

export function NotFound() {
  const { t } = useLang()
  return (
    <section className="page">
      <h1>{t('nf.title')}</h1>
      <p className="meta">404</p>
      <p>
        <Link to="/">{t('nf.home')}</Link>
      </p>
    </section>
  )
}
