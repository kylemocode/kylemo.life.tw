import { Seo } from '../components/Seo'
import { Chomper } from '../components/Chomper'
import { Reveal } from '../components/Reveal'
import { cityCount, flag, footprints } from '../data/footprints'
import { useLang } from '../i18n'

export function Footprints() {
  const { t, lang } = useLang()
  return (
    <section className="page footprints">
      <Seo title={t('footprints.title')} description={t('seo.footprints')} />
      <h1>{t('footprints.title')}</h1>
      <p className="meta">{t('footprints.stats', { c: footprints.length, n: cityCount })}</p>
      <Chomper />

      <ul className="fp-grid">
        {footprints.map((f) => (
          <li key={f.code} className="fp-card">
            <div className="fp-country">
              <span className="fp-flag" aria-hidden="true">
                {flag(f.code)}
              </span>
              <span>{f[lang]}</span>
            </div>
            {f.cities && (
              <ul className="fp-cities">
                {f.cities.map((c) => (
                  <li key={c[0]}>{lang === 'zh' ? c[0] : c[1]}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
        <li className="fp-card fp-next">
          <Reveal>
            <div className="fp-country">
              <span>{t('footprints.next')}</span>
              <span className="fp-cursor" aria-hidden="true" />
            </div>
          </Reveal>
        </li>
      </ul>
    </section>
  )
}
