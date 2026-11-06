import { useEffect, useState } from 'react'

type Props = {
  prefix: string
  words: readonly string[]
}

// 副標的打字機效果：關鍵詞一個字一個字打出 → 停一下 → 刪掉 → 換下一個
export function Typewriter({ prefix, words }: Props) {
  const [wordIndex, setWordIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return
    const word = words[wordIndex]
    let delay = 140
    let next: () => void

    if (!deleting && length < word.length) {
      next = () => setLength(length + 1)
    } else if (!deleting) {
      delay = 1800
      next = () => setDeleting(true)
    } else if (length > 0) {
      delay = 70
      next = () => setLength(length - 1)
    } else {
      delay = 400
      next = () => {
        setDeleting(false)
        setWordIndex((wordIndex + 1) % words.length)
      }
    }

    const timer = setTimeout(next, delay)
    return () => clearTimeout(timer)
  }, [wordIndex, length, deleting, words, reduceMotion])

  const shown = reduceMotion ? words[0] : words[wordIndex].slice(0, length)

  return (
    <p className="tagline" aria-label={prefix + words[0]}>
      <span aria-hidden="true">{prefix}</span>
      <span className="word" aria-hidden="true">
        {shown}
      </span>
      <span className="caret" aria-hidden="true" />
    </p>
  )
}
