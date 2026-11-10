import { Chomper } from '../components/Chomper'
import { PixelIcon } from '../components/PixelIcon'
import { PixelText } from '../components/PixelText'
import { Reveal } from '../components/Reveal'
import { INTEREST_ICONS, INTEREST_LABELS, SERVICE_ICONS } from '../data/pixelIcons'
import { site } from '../data/site'
import { useLang } from '../i18n'

const HELP = ['about.help.0', 'about.help.1', 'about.help.2', 'about.help.3', 'about.help.4', 'about.help.5', 'about.help.6'] as const
const WHY = ['about.why.0', 'about.why.1', 'about.why.2', 'about.why.3'] as const
const LINKS: Record<string, string> = {
  Medium: 'https://medium.com/@oldmo860617',
  IG: 'https://www.instagram.com/kylemo.life.tw/',
}
const BOOK_URL = 'https://www.books.com.tw/products/0011038343'

// 文字裡的書名、Medium、IG 自動加上連結
function linkify(text: string) {
  return text.split(/(《[^》]+》|Medium|IG)/).map((part, i) => {
    const href = part.startsWith('《') ? BOOK_URL : LINKS[part]
    return href ? (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  })
}

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
        <p className="about-lines">{linkify(t('about.p2'))}</p>
        <Reveal>
          <figure className="about-quote">
            <blockquote>{t('about.quote')}</blockquote>
            <figcaption>{t('about.quoteBy')}</figcaption>
          </figure>
        </Reveal>

        <Reveal>
          <h2 className="about-sub">
            <PixelText text={t('about.helpTitle')} />
          </h2>
          <ul className="about-cards">
            {HELP.map((k, i) => (
              <li key={k}>
                <PixelIcon rows={SERVICE_ICONS[i]} size={4} />
                <span>
                  {(() => {
                    const [title, sub] = t(k).split('|')
                    return (
                      <>
                        {title}
                        {sub && <small>{sub}</small>}
                      </>
                    )
                  })()}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Chomper />

        <Reveal>
          <h2 className="about-sub">
            <PixelText text={t('about.blogTitle')} />
          </h2>
          <p className="about-lines">{linkify(t('about.blogIntro'))}</p>
        </Reveal>

        <Reveal>
          <h2 className="about-sub">
            <PixelText text={t('about.whyTitle')} />
          </h2>
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
          <p className="about-caption">{t('about.interests')}</p>
          <ul className="about-interests">
            {INTEREST_ICONS.map((rows, i) => (
              <li key={INTEREST_LABELS[i]} data-label={INTEREST_LABELS[i]} tabIndex={0} aria-label={INTEREST_LABELS[i]}>
                <PixelIcon rows={rows} size={4} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
