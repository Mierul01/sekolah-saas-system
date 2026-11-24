import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Reveal from '../components/Reveal'
import { getLandingCopy } from './landing/copy'
import './landing/landing.css'

// The original landing layout, with cards drawn in the system's own style
// (tinted tiles, icon squares, small previews of real screens) instead of
// plain white boxes.

const ICONS = {
  doc: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  flag: 'M5 22V3m0 0h13l-3 5 3 5H5',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  calendar: 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  chart: 'M4 20V10M12 20V4M20 20v-7',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  check: 'M20 6L9 17l-5-5',
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6L6 18M6 6l12 12',
}

// Same colour and icon each module has inside the system.
const MODULE_LOOK = {
  erph: { tone: 'blue', icon: ICONS.doc },
  mmi: { tone: 'gold', icon: ICONS.clock },
  assembly: { tone: 'purple', icon: ICONS.flag },
  coco: { tone: 'teal', icon: ICONS.award },
  curriculum: { tone: 'navy', icon: ICONS.book },
  students: { tone: 'green', icon: ICONS.users },
  timetable: { tone: 'red', icon: ICONS.calendar },
}

const STAT_LOOK = [
  { tone: 'gold', icon: ICONS.grid },
  { tone: 'teal', icon: ICONS.users },
  { tone: 'blue', icon: ICONS.chart },
]

// Bar heights for the small chart drawing in the dashboard feature card
// (a picture of the chart, not data).
const CHART_SHAPE = [62, 80, 74, 88, 70, 92, 40]

function Icon({ path, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export default function Landing() {
  const { language } = useLanguage()
  const c = getLandingCopy(language)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navLinks = [
    { href: '#ciri-ciri', label: c.navFeatures },
    { href: '#modul', label: c.navModules },
    { href: '#cara-berfungsi', label: c.navHow },
  ]
  const roleLabel = { teacher: c.roleTeacher, admin: c.roleAdmin, staff: c.roleStaff }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <BrandMark />
            <strong>{PRODUCT_NAME}</strong>
          </Link>
          <nav className="landing-links" aria-label={c.menu}>
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="landing-nav-actions">
            <LanguageSwitcher />
            <Link to="/login" className="landing-btn landing-btn-navy">{c.login}</Link>
          </div>
          <button type="button" className="landing-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? c.closeMenu : c.menu}>
            <Icon path={menuOpen ? ICONS.close : ICONS.menu} size={22} />
          </button>
        </div>
        {menuOpen && (
          <div className="landing-mobile-menu">
            {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
            <LanguageSwitcher />
            <Link to="/login" className="landing-btn landing-btn-navy" onClick={() => setMenuOpen(false)}>{c.login}</Link>
          </div>
        )}
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <p className="landing-kicker">{c.kicker}</p>
              <h1>{c.heroTitle}</h1>
              <p className="landing-hero-body">{c.heroBody}</p>
              <div className="landing-hero-actions">
                <Link to="/login" className="landing-btn landing-btn-gold landing-btn-lg">{c.loginNow}</Link>
                <a href="#modul" className="landing-btn landing-btn-outline landing-btn-lg">{c.viewModules}</a>
              </div>
              <ul className="landing-stats">
                {c.stats.map((s, i) => (
                  <li key={s.label} className={`landing-stat tone-card-${STAT_LOOK[i].tone}`}>
                    <span className="landing-stat-ic"><Icon path={STAT_LOOK[i].icon} size={17} /></span>
                    <span>
                      <strong>{s.value}</strong>
                      <small>{s.label}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-hero-visual">
              <figure className="landing-browser">
                <div className="landing-browser-bar" aria-hidden="true">
                  <span /><span /><span />
                  <i>schoolmanage / papan-pemuka</i>
                </div>
                <img src="/dashboard-preview.png" alt={c.shotAlt} width="1917" height="906" fetchpriority="high" />
              </figure>
              <div className="landing-float landing-float-notif" aria-hidden="true">
                <span className="landing-float-ic tone-blue"><Icon path={ICONS.bell} size={16} /></span>
                <span>
                  <strong>{c.floatNotifTitle}</strong>
                  <small>{c.floatNotifBody}</small>
                </span>
              </div>
              <div className="landing-float landing-float-code" aria-hidden="true">
                <span className="landing-float-ic tone-purple"><Icon path={ICONS.flag} size={16} /></span>
                <span>
                  <strong>{c.floatCodeTitle}</strong>
                  <b className="landing-code"><i /><i /><i /><i /></b>
                  <small>{c.floatCodeNote}</small>
                </span>
              </div>
              <p className="landing-shot-caption">{c.shotCaption}</p>
            </div>
          </div>
        </section>

        <section className="landing-section" id="ciri-ciri">
          <div className="landing-section-inner">
            <Reveal className="section-head">
              <span className="landing-eyebrow">{c.featuresEyebrow}</span>
              <h2>{c.featuresTitle}</h2>
              <p>{c.featuresDesc}</p>
            </Reveal>
            <div className="landing-feature-grid">
              <Reveal className="landing-feature tone-card-blue">
                <span className="landing-card-ic"><Icon path={ICONS.shield} /></span>
                <h3>{c.f1Title}</h3>
                <p>{c.f1Desc}</p>
                <div className="landing-preview landing-preview-field" aria-hidden="true">
                  <Icon path={ICONS.mail} size={15} />
                  <span>{c.f1Field}</span>
                  <b><Icon path={ICONS.check} size={13} /></b>
                </div>
              </Reveal>
              <Reveal className="landing-feature tone-card-gold" delay={80}>
                <span className="landing-card-ic"><Icon path={ICONS.chart} /></span>
                <h3>{c.f2Title}</h3>
                <p>{c.f2Desc}</p>
                <div className="landing-preview landing-preview-chart" aria-hidden="true">
                  <small>{c.f2Chart}</small>
                  <div>{CHART_SHAPE.map((h, i) => <i key={i} style={{ height: `${h}%` }} className={i === CHART_SHAPE.length - 1 ? 'is-today' : ''} />)}</div>
                </div>
              </Reveal>
              <Reveal className="landing-feature tone-card-green" delay={160}>
                <span className="landing-card-ic"><Icon path={ICONS.users} /></span>
                <h3>{c.f3Title}</h3>
                <p>{c.f3Desc}</p>
                <div className="landing-preview landing-preview-roles" aria-hidden="true">
                  <span className="landing-role-pill is-teacher">{c.roleTeacher}</span>
                  <span className="landing-role-pill is-admin">{c.roleAdmin}</span>
                </div>
              </Reveal>
              <Reveal className="landing-feature tone-card-teal" delay={240}>
                <span className="landing-card-ic"><Icon path={ICONS.layers} /></span>
                <h3>{c.f4Title}</h3>
                <p>{c.f4Desc}</p>
                <div className="landing-preview landing-preview-chips" aria-hidden="true">
                  {['e-RPH', 'MMI', 'Kokurikulum'].map((m) => <span key={m}>{m}</span>)}
                  <span className="is-planned">{c.f4Planned}</span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--alt" id="modul">
          <div className="landing-section-inner">
            <Reveal className="section-head">
              <span className="landing-eyebrow">{c.modulesEyebrow}</span>
              <h2>{c.modulesTitle}</h2>
              <p>{c.modulesDesc}</p>
            </Reveal>
            <div className="landing-module-grid">
              {c.modules.map((m, i) => (
                <Reveal key={m.key} className={`landing-module tone-card-${MODULE_LOOK[m.key].tone}`} delay={i * 60}>
                  <div className="landing-module-top">
                    <span className="landing-card-ic"><Icon path={MODULE_LOOK[m.key].icon} /></span>
                    <span className="landing-module-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                  <div className="landing-module-roles">
                    {m.roles.map((r) => <span key={r}>{roleLabel[r]}</span>)}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="cara-berfungsi">
          <div className="landing-section-inner">
            <Reveal className="section-head">
              <span className="landing-eyebrow">{c.howEyebrow}</span>
              <h2>{c.howTitle}</h2>
            </Reveal>
            <ol className="landing-steps">
              {c.steps.map((s, i) => (
                <li key={s.title}>
                  <Reveal className="landing-step" delay={i * 100}>
                    <span className="landing-step-num">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <div className={`landing-step-preview is-step-${i + 1}`} aria-hidden="true">
                      <Icon path={[ICONS.login, ICONS.doc, ICONS.bell][i]} size={15} />
                      <span>{c.stepPreview[i]}</span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-section-inner landing-cta-inner">
            <div>
              <h2>{c.ctaTitle}</h2>
              <p>{c.ctaDesc}</p>
            </div>
            <div className="landing-hero-actions">
              <Link to="/login" className="landing-btn landing-btn-gold landing-btn-lg">{c.loginNow}</Link>
              <Link to="/support" className="landing-btn landing-btn-outline landing-btn-lg">{c.ctaSupport}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-brand">
              <BrandMark />
              <strong>{PRODUCT_NAME}</strong>
            </div>
            <p>{c.footerTagline}</p>
          </div>
          <div className="landing-footer-col">
            <h4>{c.footerProduct}</h4>
            <a href="#ciri-ciri">{c.navFeatures}</a>
            <a href="#modul">{c.navModules}</a>
            <Link to="/login">{c.login}</Link>
          </div>
          <div className="landing-footer-col">
            <h4>{c.footerLegal}</h4>
            <Link to="/pdpa">{c.privacy}</Link>
            <Link to="/terms">{c.terms}</Link>
            <Link to="/support">{c.support}</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">&copy; {new Date().getFullYear()} {PRODUCT_NAME}. {c.rights}</div>
      </footer>
    </div>
  )
}
