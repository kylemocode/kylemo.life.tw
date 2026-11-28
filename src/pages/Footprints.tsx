import { useState } from 'react'
import { Seo } from '../components/Seo'
import { Reveal } from '../components/Reveal'
import { PixelMap } from '../components/PixelMap'
import { PixelFlag } from '../components/PixelFlag'
import { footprints } from '../data/footprints'
import { useLang } from '../i18n'

const WORLD = 195 // 聯合國 193 個會員國 + 梵蒂岡、巴勒斯坦兩個觀察員國

export function Footprints() {
  const { t, lang } = useLang()
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="page footprints">
      <Seo title={t('footprints.title')} description={t('seo.footprints')} />
      <h1>{t('footprints.title')}</h1>

      <p className="fp-hud">
        {t('footprints.hud', { total: WORLD, n: '{n}' })
          .split('{n}')
          .flatMap((part, i) => [
            i > 0 && (
              <span key={`n${i}`} className="fp-num">
                {footprints.length}
              </span>
            ),
            <span key={i} className="fp-label">
              {part.trim()}
            </span>,
          ])}
      </p>

      <PixelMap active={active} onActive={setActive} />
      <ul className="fp-grid">
        {footprints.map((f) => (
          <li
            key={f.code}
            className={`fp-row${active === f.code ? ' on' : ''}`}
            onPointerEnter={() => setActive(f.code)}
            onPointerLeave={() => setActive(null)}
          >
            <PixelFlag code={f.code} />
            <div className="fp-text">
              <span className="fp-name">{f[lang]}</span>
              {f.cities && <span className="fp-city-list">{f.cities.map((c) => (lang === 'zh' ? c[0] : c[1])).join(lang === 'zh' ? '、' : ', ')}</span>}
            </div>
          </li>
        ))}
        <li className="fp-row fp-next">
          <Reveal>
            <span className="fp-name">{t('footprints.next')}</span>
            <span className="fp-cursor" aria-hidden="true" />
          </Reveal>
        </li>
      </ul>
    </section>
  )
}
