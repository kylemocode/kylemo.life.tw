// 純文字處理（不依賴 Vite），build 外掛和網站共用
export function parse(raw: string) {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  if (!m) return { meta, body: raw.trim() }
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return { meta, body: m[2].trim() }
}

// 沒寫摘要時，用內文開頭自動產生：去掉 Markdown 符號，取第一段約 90 字
export function excerpt(body: string, max = 90) {
  const para =
    body
      .replace(/```[\s\S]*?```/g, '')
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .find((b) => b && !/^(#{1,6}\s|>|[-*]\s|\d+\.\s|!\[|---)/.test(b)) ?? ''
  const text = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}
