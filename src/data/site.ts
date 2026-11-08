// 網站的基本設定：改這裡就能換掉標題、副標、社群連結

export const site = {
  name: 'kylemo.life.tw',
  author: 'Kyle',
  title: 'kylemo.life.tw', // 瀏覽器分頁標題
  handle: '@kylemo.life.tw', // 頁尾顯示
  // 導覽列的 label 是 data/i18n.ts 的 key；副標與打字機關鍵詞也在那邊（tagline.*）
  // 開始寫作的日期，用來算「持續寫作 N 天」
  startedAt: '2026-11-03',
  nav: [
    { label: 'nav.about', to: '/about' },
    { label: 'nav.posts', to: '/blog' },
    // { label: 'nav.cowork', to: '/workspace' }, // Cowork 先藏起來，要開放時取消註解
  ],
  // 共同工作空間播放的歌單：貼上 Spotify 或 YouTube 播放清單連結即可。
  // YouTube 例：https://www.youtube.com/playlist?list=PLxxxx
  // 之後在原平台增減歌曲，網站會自動跟著變。
  playlistUrl: 'https://www.youtube.com/playlist?list=PL8F6B0753B2CCA128', // 暫用的公開 Jazz 歌單，之後換成自己的
  // icon 可用：instagram、linkedin、medium、mail、youtube、rss（在 components/Icons.tsx）
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/kylemo.life.tw/', icon: 'instagram' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyle-mo-880a91185/', icon: 'linkedin' },
    { label: 'Medium', href: 'https://medium.com/@oldmo860617', icon: 'medium' },
    { label: 'Email', href: 'mailto:oldmo860617@gmail.com', icon: 'mail' },
  ],
} as const
