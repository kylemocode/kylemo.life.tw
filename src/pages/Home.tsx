import { site } from '../data/site'
import { useLang } from '../i18n'
import { ScrambleText } from '../components/ScrambleText'
import { PacGame } from '../components/PacGame'
import { Seo } from '../components/Seo'

export function Home() {
  const { t } = useLang()

  return (
    <>
      <Seo description={t('seo.home')} />
      <section className="intro">
        <h1 id="intro-title">{site.name}</h1>
        <ScrambleText text={t('tagline.text')} highlight={t('tagline.highlight')} />
      </section>

      <PacGame />
    </>
  )
}
