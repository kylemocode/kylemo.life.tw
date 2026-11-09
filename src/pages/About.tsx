import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { tagLabel, tagLabels } from '../data/tags'
import { useLang } from '../i18n'

const HELP = ['about.help.0', 'about.help.1', 'about.help.2', 'about.help.3', 'about.help.4', 'about.help.5', 'about.help.6'] as const
const WHY = ['about.why.0', 'about.why.1', 'about.why.2', 'about.why.3'] as const
const BLOG = { life: 'about.blog.life', career: 'about.blog.career', nomad: 'about.blog.nomad' } as const

export function About() {
  const { t, lang } = useLang()
  const sep = lang === 'zh' ? '：' : ': '
  return (
    <section className="page about">
      <figure className="avatar">
        <img src={`${import.meta.env.BASE_URL}avatar.png`} alt={t('about.photoAlt', { name: site.author })} width={500} height={506} />
      </figure>
      <div className="about-text">
        <h1>{t('page.about')}</h1>
        <p className="meta">{t('about.role')}</p>
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
        <h2 className="about-sub">{t('about.helpTitle')}</h2>
        <ul className="about-help">
          {HELP.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <p>{t('about.cta')}</p>

        <h2 className="about-sub">{t('about.blogTitle')}</h2>
        <p>{t('about.blogIntro')}</p>
        <ul className="about-help">
          {(Object.keys(tagLabels) as (keyof typeof BLOG)[]).map((k) => (
            <li key={k}>
              <Link to={`/blog?tag=${k}`}>
                <strong>{tagLabel(k, lang)}</strong>
              </Link>
              {sep}
              {t(BLOG[k])}
            </li>
          ))}
        </ul>

        <h2 className="about-sub">{t('about.whyTitle')}</h2>
        <p>{t('about.whyIntro')}</p>
        <ul className="about-help">
          {WHY.map((k) => {
            const [label, desc] = t(k).split('|')
            return (
              <li key={k}>
                <strong>{label}</strong>
                {sep}
                {desc}
              </li>
            )
          })}
        </ul>
        <p>{t('about.whyEnd')}</p>
      </div>
    </section>
  )
}
