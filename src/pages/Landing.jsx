import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_NAME, SCHOOL_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Reveal from '../components/Reveal'
import { getLandingCopy } from './landing/copy'
import './landing/landing.css'

// v2: the earlier dark-first design saved 'dark' for everyone who visited it.
const THEME_KEY = 'sm-landing-theme-v2'
const FONTS_ID = 'lp-fonts'
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap'

// One icon per group of people at the school.
const PEOPLE_ICONS = {
  admin: 'M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5M9 11h.01M15 11h.01',
  teacher: 'M3 4h18v11H3zM7 8h7M7 11h4M8 21l4-6 4 6',
  staff: 'M5 3h14v18H5zM9 3v3h6V3M12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 18c.7-1.6 2.3-2.5 4-2.5s3.3.9 4 2.5',
  student: 'M12 3L2 8l10 5 10-5-10-5zM6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4M22 8v6',
}

// Same colour and icon each module has inside the system.
const MODULE_LOOK = {
  erph: { tone: 'blue', icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z' },
  mmi: { tone: 'gold', icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2' },
  assembly: { tone: 'purple', icon: 'M5 22V3m0 0h13l-3 5 3 5H5' },
  coco: { tone: 'teal', icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5' },
  timetable: { tone: 'red', icon: 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z' },
  curriculum: { tone: 'navy', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z' },
  students: { tone: 'green', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
}

function Icon({ path, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="lp-faq-item">
      <button type="button" className="lp-faq-q" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className={`lp-faq-chev ${open ? 'is-open' : ''}`}><Icon path="M6 9l6 6 6-6" size={18} /></span>
      </button>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  )
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked */ }
  return 'light'
}

export default function Landing() {
  const { t, language } = useLanguage()
  const c = getLandingCopy(language, SCHOOL_NAME)
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const [theme, setTheme] = useState(getInitialTheme)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* storage blocked */ }
  }, [theme])

  // The serif heading font is only used here, so it loads with this page.
  useEffect(() => {
    if (document.getElementById(FONTS_ID)) return
    const link = document.createElement('link')
    link.id = FONTS_ID
    link.rel = 'stylesheet'
    link.href = FONTS_HREF
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navLinks = [
    { href: '#warga', label: c.navPeople },
    { href: '#modul', label: c.navModules },
    { href: '#hari', label: c.navDay },
    { href: '#bantuan', label: c.navHelp },
  ]
  const roleLabel = { teacher: c.roleTeacher, admin: c.roleAdmin, staff: c.roleStaff }
  const faqs = [1, 2, 3].map((n) => ({ q: t(`help.q${n}`), a: t(`help.a${n}`) }))
  const today = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <div className="lp" data-theme={theme}>
      <div className="lp-strip">
        <div className="wrap lp-strip-in">
          <span>{c.portal} · <strong>{SCHOOL_NAME}</strong></span>
          <span className="lp-strip-date">{today}</span>
        </div>
      </div>

      <header className="lp-nav">
        <div className="wrap lp-nav-in">
          <a href="#top" className="lp-brand">
            <BrandMark />
            <span>
              <strong>{PRODUCT_NAME}</strong>
              <small>{SCHOOL_NAME}</small>
            </span>
          </a>
          <nav className="lp-links" aria-label={c.menu}>
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="lp-actions">
            <LanguageSwitcher className="lp-lang" />
            <button type="button" className="lp-icon-btn" onClick={() => setTheme(nextTheme)} aria-label={nextTheme === 'light' ? c.themeLight : c.themeDark}>
              {theme === 'dark'
                ? <Icon path="M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" size={18} />
                : <Icon path="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" size={18} />}
            </button>
            <Link to="/login" className="lp-btn lp-btn-primary lp-login">{c.login}</Link>
            <button type="button" className="lp-icon-btn lp-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? c.closeMenu : c.menu}>
              <Icon path={menuOpen ? 'M18 6L6 18M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lp-sheet">
            {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
            <LanguageSwitcher className="lp-lang" />
            <Link to="/login" className="lp-btn lp-btn-primary" onClick={() => setMenuOpen(false)}>{c.login}</Link>
          </div>
        )}
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="wrap lp-hero-in">
            <div className="lp-hero-copy">
              <p className="lp-school">{SCHOOL_NAME}</p>
              <h1>{c.heroTitle}</h1>
              <p className="lp-lead">{c.heroLead}</p>
              <div className="lp-cta-row">
                <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">{c.heroLogin}</Link>
                <a href="#modul" className="lp-btn lp-btn-ghost lp-btn-lg">{c.heroSeeModules}</a>
              </div>
              <p className="lp-note">{c.heroNote}</p>
            </div>
            <figure className="lp-shot">
              <img src="/dashboard-preview.png" alt={c.shotAlt} width="1917" height="906" fetchpriority="high" />
              <figcaption>{c.shotCaption}</figcaption>
            </figure>
          </div>
        </section>

        <section className="lp-section" id="warga">
          <div className="wrap">
            <Reveal className="lp-head">
              <h2>{c.peopleTitle}</h2>
              <p>{c.peopleDesc}</p>
            </Reveal>
            <Reveal className="lp-people">
              {c.people.map((p) => (
                <article key={p.key} className={`lp-person tone-${p.key}`}>
                  <span className="lp-person-ic"><Icon path={PEOPLE_ICONS[p.key]} size={24} /></span>
                  <h3>{p.title}</h3>
                  <p className="lp-person-who">{p.who}</p>
                  <ul>
                    {p.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="lp-section lp-alt" id="modul">
          <div className="wrap">
            <Reveal className="lp-head">
              <h2>{c.modulesTitle}</h2>
              <p>{c.modulesDesc}</p>
            </Reveal>
            <div className="lp-modules">
              {[['daily', c.groupDaily], ['school', c.groupSchool]].map(([group, label]) => (
                <Reveal key={group} className="lp-module-group">
                  <h3 className="lp-group-label">{label}</h3>
                  <ul>
                    {c.modules.filter((m) => m.group === group).map((m) => (
                      <li key={m.key} className="lp-module">
                        <span className={`lp-module-ic tone-${MODULE_LOOK[m.key].tone}`}><Icon path={MODULE_LOOK[m.key].icon} size={18} /></span>
                        <div>
                          <h4>{m.title}</h4>
                          <p>{m.desc}</p>
                          <p className="lp-module-roles">
                            <span className="sr-only">{c.usedBy}: </span>
                            {m.roles.map((r) => <span key={r} className="lp-role">{roleLabel[r]}</span>)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="hari">
          <div className="wrap">
            <Reveal className="lp-head">
              <h2>{c.dayTitle}</h2>
              <p>{c.dayDesc}</p>
            </Reveal>
            <Reveal className="lp-timetable-wrap">
              <table className="lp-timetable">
                <caption className="sr-only">{c.dayCaption}</caption>
                <thead>
                  <tr>
                    <th scope="col">{c.colWhen}</th>
                    <th scope="col">{c.colWhat}</th>
                    <th scope="col">{c.colWho}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.day.map((d) => (
                    <tr key={d.when}>
                      <th scope="row">{d.when}</th>
                      <td>{d.what}</td>
                      <td><span className="lp-role">{d.who}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        <section className="lp-section lp-alt" id="bantuan">
          <div className="wrap lp-help">
            <Reveal className="lp-head">
              <h2>{c.helpTitle}</h2>
              <p>{c.helpDesc}</p>
              <p className="lp-help-links">
                <Link to="/support">{c.helpMore}</Link>
                <Link to="/pdpa">{c.privacy}</Link>
              </p>
            </Reveal>
            <Reveal className="lp-faq">
              {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </Reveal>
          </div>
        </section>

        <section className="lp-cta">
          <div className="wrap lp-cta-in">
            <div>
              <h2>{c.ctaTitle}</h2>
              <p>{c.ctaDesc}</p>
            </div>
            <Link to="/login" className="lp-btn lp-btn-gold lp-btn-lg">{c.heroLogin}</Link>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="wrap lp-foot-in">
          <div className="lp-brand">
            <BrandMark />
            <span>
              <strong>{PRODUCT_NAME}</strong>
              <small>{c.footerTagline}</small>
            </span>
          </div>
          <nav className="lp-foot-links" aria-label={PRODUCT_NAME}>
            <Link to="/login">{c.login}</Link>
            <Link to="/pdpa">{c.privacy}</Link>
            <Link to="/terms">{c.terms}</Link>
            <Link to="/support">{c.helpMore}</Link>
          </nav>
        </div>
        <div className="wrap lp-foot-bottom">&copy; {new Date().getFullYear()} {SCHOOL_NAME} · {PRODUCT_NAME}. {c.rights}</div>
      </footer>
    </div>
  )
}
