import { useLang } from '../i18n'
import { Tetris } from '../components/Tetris'
import { MagneticLink } from '../components/MagneticLink'

export function NotFound() {
  const { t } = useLang()
  return (
    <section className="page nf">
      <h1>{t('nf.title')}</h1>
      <p className="meta">404 Not Found</p>
      <div className="nf-tetris">
        <Tetris rows={14} cols={12} cell={14} mode="over" />
      </div>
      <p className="nf-action">
        <MagneticLink to="/" small>
          {t('nav.home')}
        </MagneticLink>
      </p>
    </section>
  )
}
