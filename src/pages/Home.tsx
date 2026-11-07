import { site } from '../data/site'
import { useLang } from '../i18n'
import { ScrambleText } from '../components/ScrambleText'
import { PacGame } from '../components/PacGame'

export function Home() {
  const { t } = useLang()

  return (
    <>
      <section className="intro">
        <h1 id="intro-title">{site.name}</h1>
        <ScrambleText text={t('tagline.text')} />
      </section>

      <PacGame />
    </>
  )
}
