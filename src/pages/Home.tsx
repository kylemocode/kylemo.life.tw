import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { countWords, featuredPosts, posts, sortedPosts } from '../data/posts'
import { Reveal } from '../components/Reveal'
import { PostList } from '../components/PostList'
import { useLang } from '../i18n'
import { Typewriter } from '../components/Typewriter'
import { Chomper } from '../components/Chomper'

function daysSince(date: string) {
  const start = new Date(date + 'T00:00:00')
  const diff = Date.now() - start.getTime()
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}

export function Home() {
  const { t } = useLang()
  const words_ = t('tagline.words')
  const tagWords = useMemo(() => words_.split('|'), [words_])
  const days = daysSince(site.startedAt)
  const words = posts.reduce((sum, p) => sum + countWords(p.title + p.body), 0)
  // 首頁只放精選；還沒有設精選時，退而顯示最新 3 篇。完整列表與搜尋在「文章」頁
  const shown = featuredPosts.length > 0 ? featuredPosts : sortedPosts.slice(0, 3)
  const fmt = new Intl.NumberFormat('en-US')

  return (
    <>
      <section className="intro">
        <h1 id="intro-title">{site.name}</h1>
        <Typewriter prefix={t('tagline.prefix')} words={tagWords} />
        <p className="writing-stats">
          {t('home.stats', { days: fmt.format(days), words: fmt.format(words) })}
        </p>
      </section>

      <Chomper />

      <Reveal>
        <section className="section">
          <div className="section-head">
            <h2>{t('home.featured')}</h2>
            <Link to="/blog">{t('home.all')}</Link>
          </div>
          <PostList posts={shown} />
        </section>
      </Reveal>
    </>
  )
}
