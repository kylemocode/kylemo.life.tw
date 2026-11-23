// 足跡：去過的國家與城市。新增就在對應位置加一行（國家寫 ISO 兩碼，國旗會自動產生）。
// zh／en 是顯示名稱，cities 的 [中文, 英文] 成對寫。順序就是頁面顯示的順序。

type City = [zh: string, en: string]
export type Footprint = { code: string; zh: string; en: string; cities?: City[] }

export const footprints: Footprint[] = [
  { code: 'TW', zh: '台灣', en: 'Taiwan' },
  { code: 'HK', zh: '香港', en: 'Hong Kong' },
  { code: 'KR', zh: '韓國', en: 'South Korea', cities: [['首爾', 'Seoul']] },
  { code: 'CN', zh: '中國', en: 'China', cities: [['北京', 'Beijing'], ['江南', 'Jiangnan']] },
  { code: 'JP', zh: '日本', en: 'Japan', cities: [['沖繩', 'Okinawa'], ['宮古島', 'Miyakojima']] },
  { code: 'SG', zh: '新加坡', en: 'Singapore' },
  { code: 'MY', zh: '馬來西亞', en: 'Malaysia', cities: [['沙巴', 'Sabah']] },
  { code: 'US', zh: '美國', en: 'United States', cities: [['西雅圖', 'Seattle'], ['洛杉磯', 'Los Angeles']] },
  { code: 'TH', zh: '泰國', en: 'Thailand', cities: [['曼谷', 'Bangkok'], ['清邁', 'Chiang Mai']] },
  { code: 'CA', zh: '加拿大', en: 'Canada', cities: [['溫哥華', 'Vancouver']] },
  { code: 'ID', zh: '印尼', en: 'Indonesia', cities: [['峇里島', 'Bali']] },
  { code: 'VN', zh: '越南', en: 'Vietnam', cities: [['峴港', 'Da Nang']] },
  { code: 'AU', zh: '澳洲', en: 'Australia', cities: [['墨爾本', 'Melbourne']] },
  { code: 'PH', zh: '菲律賓', en: 'Philippines', cities: [['Siargao', 'Siargao']] },
  { code: 'TR', zh: '土耳其', en: 'Türkiye', cities: [['伊斯坦堡', 'Istanbul']] },
  { code: 'HU', zh: '匈牙利', en: 'Hungary', cities: [['布達佩斯', 'Budapest']] },
  { code: 'AT', zh: '奧地利', en: 'Austria', cities: [['維也納', 'Vienna']] },
  { code: 'SK', zh: '斯洛伐克', en: 'Slovakia', cities: [['布拉提斯拉瓦', 'Bratislava']] },
  { code: 'LA', zh: '寮國', en: 'Laos', cities: [['龍坡邦', 'Luang Prabang']] },
]

// ISO 兩碼 → 國旗 emoji（兩個「區域指示符號」組合）
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

export const cityCount = footprints.reduce((n, f) => n + (f.cities?.length ?? 0), 0)
