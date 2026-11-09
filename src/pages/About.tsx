import { site } from '../data/site'
import { useLang } from '../i18n'

const HELP = ['about.help.0', 'about.help.1', 'about.help.2', 'about.help.3', 'about.help.4', 'about.help.5', 'about.help.6'] as const
const email = site.socials.find((s) => s.icon === 'mail')?.href

export function About() {
  const { t } = useLang()
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
        {email && (
          <p>
            <a className="about-mail" href={email}>
              {t('about.mail')}
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
