// 分享用的圖片卡片：在瀏覽器裡用 canvas 畫出來，不需要後端。
export type CardSize = '4:5' | '9:16'
export type CardInput = {
  title: string
  summary: string
  minutes: number
  dateText: string
  readText: string // 例如「約 8 分鐘閱讀」
  size: CardSize
}

const SIZES: Record<CardSize, [number, number]> = { '4:5': [1080, 1350], '9:16': [1080, 1920] }
const TOKEN = /[⺀-鿿＀-￯]|[^\s⺀-鿿＀-￯]+|\s/g
const NO_LINE_START = '，。、！？；：）」』】》,.!?;:)]}'

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const tk of text.replace(/\s*\n\s*/g, ' ').match(TOKEN) ?? []) {
    if (!line && /^\s$/.test(tk)) continue
    if (ctx.measureText(line + tk).width > maxW && line && !NO_LINE_START.includes(tk)) {
      lines.push(line.trimEnd())
      line = /^\s$/.test(tk) ? '' : tk
    } else line += tk
  }
  if (line.trim()) lines.push(line.trimEnd())
  return lines
}

function ellipsize(ctx: CanvasRenderingContext2D, lines: string[], max: number, maxW: number) {
  if (lines.length <= max) return lines
  const out = lines.slice(0, max)
  let last = out[max - 1]
  while (last && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1)
  out[max - 1] = last + '…'
  return out
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, bad) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = bad
    img.src = src
  })
}

export async function renderCard(inp: CardInput): Promise<Blob> {
  const [W, H] = SIZES[inp.size]
  const tall = inp.size === '9:16'
  const bg = css('--bg') || '#fbfaf7'
  const text = css('--text') || '#1d1c1a'
  const muted = css('--muted') || '#6b6862'
  const border = css('--border') || '#e4e0d8'
  const accent = css('--accent') || '#b4532a'
  const sans = css('--font-sans') || 'system-ui, sans-serif'
  const heading = css('--font-heading') || sans
  const brand = css('--font-brand') || heading
  const mono = css('--font-mono') || 'monospace'

  // 字型要先載入，否則 canvas 會用備用字型畫
  await Promise.all(
    ['700 40px "Space Grotesk"', '400 40px "Geist"', '400 30px "Geist Mono"', '400 40px "Tiny5 Duo"'].map((f) => document.fonts.load(f, 'Aa 文')),
  ).catch(() => {})
  const avatar = await loadImage(`${import.meta.env.BASE_URL}avatar-home.png`).catch(() => null)

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 外框（方角，帶一點像素感）
  const M = 44
  ctx.strokeStyle = border
  ctx.lineWidth = 4
  ctx.strokeRect(M, M, W - M * 2, H - M * 2)

  const P = 110 // 內距
  const maxW = W - P * 2
  ctx.textBaseline = 'top'

  // 頂部：站名 + 像素方塊
  ctx.fillStyle = text
  ctx.font = `44px ${brand}`
  ctx.fillText('kylemo.life.tw', P, P - 10)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = accent
    ctx.globalAlpha = 1 - i * 0.3
    ctx.fillRect(P + i * 36, P + 68, 24, 24)
  }
  ctx.globalAlpha = 1

  // 標題：自動縮小，最多 4 行
  let size = tall ? 100 : 92
  let lines: string[] = []
  for (; size >= 52; size -= 4) {
    ctx.font = `700 ${size}px ${heading}`
    lines = wrap(ctx, inp.title, maxW)
    if (lines.length <= 4) break
  }
  const titleLH = Math.round(size * 1.3)
  const titleLines = lines.slice(0, 4)
  ctx.font = `400 42px ${sans}`
  const sum = ellipsize(ctx, wrap(ctx, inp.summary, maxW), tall ? 8 : 5, maxW)
  const fy = H - P - 100 // 底部區塊的起點

  // 內容區塊在「頂部」和「底部分隔線」之間垂直置中
  const blockH = titleLines.length * titleLH + 40 + sum.length * 72 + 36 + 40
  const top = P + 120
  const bottom = fy - 44 - 20
  let y = Math.round(top + Math.max(0, (bottom - top - blockH) / 2))

  ctx.fillStyle = text
  ctx.font = `700 ${size}px ${heading}`
  for (const l of titleLines) {
    ctx.fillText(l, P, y)
    y += titleLH
  }

  // 摘要
  y += 40
  ctx.font = `400 42px ${sans}`
  ctx.fillStyle = muted
  for (const l of sum) {
    ctx.fillText(l, P, y)
    y += 72
  }

  // 閱讀時長與日期
  y += 36
  ctx.font = `400 32px ${mono}`
  ctx.fillStyle = accent
  ctx.fillText(`${inp.readText}　·　${inp.dateText}`, P, y)

  // 底部：頭像 + 名字 + 網址
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(P, fy - 44)
  ctx.lineTo(W - P, fy - 44)
  ctx.stroke()
  if (avatar) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(P + 50, fy + 50, 50, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, P, fy, 100, 100)
    ctx.restore()
  }
  // 文字用「垂直置中」的基準線，兩行文字的中心對齊頭像中心
  ctx.textBaseline = 'middle'
  ctx.fillStyle = text
  ctx.font = `700 44px ${sans}`
  ctx.fillText('莫力全 Kyle Mo', P + 130, fy + 50 - 28)
  ctx.fillStyle = muted
  ctx.font = `400 32px ${mono}`
  ctx.fillText('kylemo.me', P + 130, fy + 50 + 28)
  ctx.textBaseline = 'top'

  return new Promise((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('toBlob failed'))), 'image/png'))
}

// 連結預覽圖（og:image，1200×630 橫式），風格和上面的圖卡一致。
// footerRight 有給就顯示在右下（例如「約 6 分鐘閱讀・日期」），首頁用的版本不給。
// 像素吃豆人（面向右）追著三顆豆子，豆子越遠越淡
const PAC = ['..XXXXX..', '.XXXXXXX.', 'XXXXXXXX.', 'XXXXXX...', 'XXXX.....', 'XXXXXX...', 'XXXXXXXX.', '.XXXXXXX.', '..XXXXX..']
function drawPacman(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, color: string) {
  x = Math.round(x) // 位置取整數，避免像素格之間出現縫線
  y = Math.round(y)
  ctx.fillStyle = color
  PAC.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === 'X') ctx.fillRect(x + c * cell, y + r * cell, cell, cell)
    }),
  )
  const cy = y + (PAC.length * cell) / 2
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 1 - i * 0.22
    ctx.fillRect(x + PAC[0].length * cell + 18 + i * 32, cy - 5, 10, 10)
  }
  ctx.globalAlpha = 1
}

export type OgInput = { title: string; summary: string; footerRight?: string }

export async function renderOgCard(inp: OgInput): Promise<Blob> {
  const W = 1200
  const H = 630
  const bg = css('--bg') || '#fbfaf7'
  const text = css('--text') || '#1d1c1a'
  const muted = css('--muted') || '#6b6862'
  const border = css('--border') || '#e4e0d8'
  const accent = css('--accent') || '#b4532a'
  const sans = css('--font-sans') || 'system-ui, sans-serif'
  const heading = css('--font-heading') || sans
  const brand = css('--font-brand') || heading
  const mono = css('--font-mono') || 'monospace'

  await Promise.all(
    ['700 40px "Space Grotesk"', '400 40px "Geist"', '400 30px "Geist Mono"', '400 40px "Tiny5 Duo"'].map((f) => document.fonts.load(f, 'Aa 文')),
  ).catch(() => {})
  const avatar = await loadImage(`${import.meta.env.BASE_URL}avatar-home.png`).catch(() => null)

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const M = 28
  ctx.strokeStyle = border
  ctx.lineWidth = 4
  ctx.strokeRect(M, M, W - M * 2, H - M * 2)

  const P = 76
  const maxW = W - P * 2
  ctx.textBaseline = 'top'

  ctx.fillStyle = text
  ctx.font = `34px ${brand}`
  // 用文字實際墨跡的上下緣算出中心線，吃豆人以這條線垂直置中
  ctx.textBaseline = 'alphabetic'
  const bm = ctx.measureText('kylemo.life.tw')
  const baseline = 90
  ctx.fillText('kylemo.life.tw', P, baseline)
  const midY = baseline + (bm.actualBoundingBoxDescent - bm.actualBoundingBoxAscent) / 2
  ctx.textBaseline = 'top'
  drawPacman(ctx, P + bm.width + 30, midY - 22.5, 5, accent) // 放在站名右邊，高度 9 格 × 5 = 45

  let size = 80
  let lines: string[] = []
  for (; size >= 44; size -= 4) {
    ctx.font = `700 ${size}px ${heading}`
    lines = wrap(ctx, inp.title, maxW)
    if (lines.length <= 2) break
  }
  const titleLines = lines.slice(0, 3)
  const titleLH = Math.round(size * 1.28)
  ctx.font = `400 32px ${sans}`
  const sum = inp.summary ? ellipsize(ctx, wrap(ctx, inp.summary, maxW), 2, maxW) : []
  const fy = H - 76 - 76 // 底部區塊起點
  const blockH = titleLines.length * titleLH + (sum.length ? 28 + sum.length * 52 : 0)
  const top = 120
  const bottom = fy - 24
  let y = Math.round(top + Math.max(0, (bottom - top - blockH) / 2))

  ctx.fillStyle = text
  ctx.font = `700 ${size}px ${heading}`
  for (const l of titleLines) {
    ctx.fillText(l, P, y)
    y += titleLH
  }
  y += 28
  ctx.font = `400 32px ${sans}`
  ctx.fillStyle = muted
  for (const l of sum) {
    ctx.fillText(l, P, y)
    y += 52
  }

  // 底部
  ctx.strokeStyle = border
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(P, fy - 22)
  ctx.lineTo(W - P, fy - 22)
  ctx.stroke()
  if (avatar) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(P + 38, fy + 38, 38, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, P, fy, 76, 76)
    ctx.restore()
  }
  ctx.textBaseline = 'middle'
  ctx.fillStyle = text
  ctx.font = `700 32px ${sans}`
  ctx.fillText('莫力全 Kyle Mo', P + 100, fy + 38 - 19)
  ctx.fillStyle = muted
  ctx.font = `400 24px ${mono}`
  ctx.fillText('kylemo.me', P + 100, fy + 38 + 21)
  if (inp.footerRight) {
    ctx.fillStyle = accent
    ctx.font = `400 26px ${mono}`
    ctx.textAlign = 'right'
    ctx.fillText(inp.footerRight, W - P, fy + 38)
    ctx.textAlign = 'left'
  }
  ctx.textBaseline = 'top'

  return new Promise((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('toBlob failed'))), 'image/png'))
}
