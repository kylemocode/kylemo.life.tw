import { Link } from 'react-router-dom'
import { useLang } from '../i18n'
import { Tetris } from '../components/Tetris'

export function NotFound() {
  const { t } = useLang()
  return (
    <section className="page nf">
      <h1>{t('nf.title')}</h1>
      <p className="meta">404</p>
      <div className="nf-tetris">
        <Tetris rows={14} cols={12} cell={14} mode="over" />
      </div>
      <p>
        <Link to="/" className="btn-accent">{t('nf.home')}</Link>
      </p>
    </section>
  )
}
