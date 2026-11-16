import { Link } from 'react-router-dom'
import { Icon } from './Icons'
import { site } from '../data/site'
import { useLang } from '../i18n'

const HELP = ['about.help.0', 'about.help.1', 'about.help.2', 'about.help.3', 'about.help.4', 'about.help.5', 'about.help.6'] as const // 「各類有趣的合作」只放在關於我頁，這裡不放

// 文章最下方的作者簡介：簡介、提供的服務、社群 icon
export function AuthorBox() {
  const { t } = useLang()
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
        <p className="author-services-title">{t('about.helpTitle')}</p>
        <ul className="author-services">
          {HELP.map((k) => (
            <li key={k}>{t(k).split('|')[0]}</li>
          ))}
        </ul>
        <ul className="author-social">
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} aria-label={s.label} title={s.label} {...(s.href.startsWith('http') ? { target: '_blank', rel: 'me noopener' } : {})}>
                <Icon name={s.icon} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
