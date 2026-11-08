// 標籤對照表：文章 frontmatter 的 tags 寫左邊的 key，網站會依語言顯示對應名稱。
// 新增標籤就在這裡加一行；沒列在這裡的 key 會原樣顯示。
export const tagLabels: Record<string, { zh: string; en: string }> = {
  life: { zh: '生活雜談', en: 'Life Notes' },
  career: { zh: '職涯', en: 'Career' },
  nomad: { zh: '數位遊牧', en: 'Digital Nomad' },
}

export function tagLabel(key: string, lang: 'zh' | 'en') {
  return tagLabels[key]?.[lang] ?? key
}
