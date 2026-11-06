// 簡單的線條圖示，全部跟著文字顏色（currentColor）變色

type IconProps = { name: string }

export function Icon({ name }: IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...common}>
          <path d="M20 14.2A8 8 0 0 1 9.8 4 8 8 0 1 0 20 14.2Z" />
        </svg>
      )
    case 'textAa':
      return (
        <svg {...common} strokeWidth={2.2}>
          <path d="M2 18.5 8 5.5l6 13" />
          <path d="M4.2 14h7.6" />
          <path d="M15.6 10.6c.7-.7 1.7-1 2.9-1 2 0 3.5 1.2 3.5 3v6" />
          <ellipse cx="18.6" cy="15.6" rx="3.4" ry="2.9" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="3.8" />
          <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="4" />
          <path d="M10 9.2v5.6l4.6-2.8z" fill="currentColor" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      )
    case 'rss':
      return (
        <svg {...common} strokeWidth={2.2}>
          <path d="M5 11a8 8 0 0 1 8 8" />
          <path d="M5 5a14 14 0 0 1 14 14" />
          <circle cx="6" cy="18" r="1.2" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}
