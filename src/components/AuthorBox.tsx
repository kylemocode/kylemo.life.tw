import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { useLang } from '../i18n'

// 文章最下方的作者簡介
export function AuthorBox() {
  const { t } = useLang()
  const links = site.socials.filter((s) => s.icon !== 'mail')
  return (
    <aside className="author-box" aria-label={t('author.name')}>
      <img src={`${import.meta.env.BASE_URL}avatar-home.png`} alt="" width={72} height={72} loading="lazy" />
      <div>
        <p>
          <Link to="/about" className="author-name">
            {t('author.name')}
          </Link>{' '}
          {t('author.bio')}
        </p>
        <p className="author-links">
          {links.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </p>
      </div>
    </aside>
  )
}
