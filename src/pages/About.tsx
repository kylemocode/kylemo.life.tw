import { site } from '../data/site'
import { useLang } from '../i18n'

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
      </div>
    </section>
  )
}
