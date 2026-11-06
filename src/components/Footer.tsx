import { site } from '../data/site'
import { Icon } from './Icons'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container inner">
        <p className="muted">
          © {year} {site.handle}
        </p>
        <ul>
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} aria-label={s.label} title={s.label} target="_blank" rel="me noopener">
                <Icon name={s.icon} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
