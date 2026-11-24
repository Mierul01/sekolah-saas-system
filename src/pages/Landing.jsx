import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_NAME, SCHOOL_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Reveal from '../components/Reveal'
import { getLandingCopy } from './landing/copy'
import './landing/landing.css'

// The landing page is built from the system's own parts (navy band, coloured
// tiles, line lists, table and FAQ styles) so it reads as the front door of
// the same product, not a separate website.

const PEOPLE_LOOK = {
  admin: { tone: 'navy', icon: 'M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5M9 11h.01M15 11h.01' },
  teacher: { tone: 'blue', icon: 'M3 4h18v11H3zM7 8h7M7 11h4M8 21l4-6 4 6' },
  staff: { tone: 'teal', icon: 'M5 3h14v18H5zM9 3v3h6V3M12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 18c.7-1.6 2.3-2.5 4-2.5s3.3.9 4 2.5' },
  student: { tone: 'gold', icon: 'M12 3L2 8l10 5 10-5-10-5zM6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4M22 8v6' },
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

function Icon({ path, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className={`faq-chevron ${open ? 'is-open' : ''}`}><Icon path="M6 9l6 6 6-6" size={16} /></span>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  )
}

export default function Landing() {
  const { t, language } = useLanguage()
  const c = getLandingCopy(language, SCHOOL_NAME)
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const [menuOpen, setMenuOpen] = useState(false)

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
  const now = new Date()

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <a href="#top" className="lp-brand">
            <BrandMark />
            <span>
              <strong>{SCHOOL_NAME}</strong>
              <small>{PRODUCT_NAME}</small>
            </span>
          </a>
          <nav className="lp-links" aria-label={c.menu}>
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="lp-actions">
            <LanguageSwitcher className="lang-switch-light lp-lang" />
            <Link to="/login" className="lp-btn lp-btn-gold lp-login">{c.login}</Link>
            <button type="button" className="lp-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? c.closeMenu : c.menu}>
              <Icon path={menuOpen ? 'M18 6L6 18M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} size={22} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lp-sheet">
            {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
            <LanguageSwitcher className="lang-switch-light" />
            <Link to="/login" className="lp-btn lp-btn-gold" onClick={() => setMenuOpen(false)}>{c.login}</Link>
          </div>
        )}
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-hero-copy">
              <div className="lp-date">
                <strong>{now.getDate()}</strong>
                <span>
                  <b>{now.toLocaleDateString(locale, { weekday: 'long' })}</b>
                  {now.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1>{c.heroTitle}</h1>
              <p className="lp-lead">{c.heroLead}</p>
              <div className="lp-cta-row">
                <Link to="/login" className="lp-btn lp-btn-gold lp-btn-lg">{c.heroLogin}</Link>
                <a href="#modul" className="lp-btn lp-btn-outline lp-btn-lg">{c.heroSeeModules}</a>
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
          <div className="lp-wrap">
            <Reveal className="lp-head">
              <h2>{c.peopleTitle}</h2>
              <p>{c.peopleDesc}</p>
            </Reveal>
            <div className="tile-row lp-people">
              {c.people.map((p) => (
                <article key={p.key} className={`tile tile-${PEOPLE_LOOK[p.key].tone} lp-person`}>
                  <div className="tile-head">
                    <span className="tile-icon"><Icon path={PEOPLE_LOOK[p.key].icon} /></span>
                    <h3 className="lp-person-title">{p.title}</h3>
                  </div>
                  <p className="tile-note lp-person-who">{p.who}</p>
                  <ul className="lp-person-list">
                    {p.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="modul">
          <div className="lp-wrap">
            <Reveal className="lp-head">
              <h2>{c.modulesTitle}</h2>
              <p>{c.modulesDesc}</p>
            </Reveal>
            <Reveal className="content-card sheet lp-modules">
              {[['daily', c.groupDaily], ['school', c.groupSchool]].map(([group, label]) => (
                <div key={group} className="lp-module-group">
                  <h3 className="card-heading">{label}</h3>
                  <ul className="line-list">
                    {c.modules.filter((m) => m.group === group).map((m) => (
                      <li key={m.key} className="line-row line-row-static lp-module">
                        <span className={`line-icon tone-${MODULE_LOOK[m.key].tone}`}><Icon path={MODULE_LOOK[m.key].icon} size={15} /></span>
                        <span className="line-text">
                          <strong>{m.title}</strong>
                          <span>{m.desc}</span>
                        </span>
                        <span className="lp-roles">
                          <span className="sr-only">{c.usedBy}: </span>
                          {m.roles.map((r) => <span key={r} className="status-pill status-pill-idle">{roleLabel[r]}</span>)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="hari">
          <div className="lp-wrap">
            <Reveal className="lp-head">
              <h2>{c.dayTitle}</h2>
              <p>{c.dayDesc}</p>
            </Reveal>
            <Reveal className="content-card lp-day">
              <div className="table-wrap">
                <table>
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
                        <td>{d.when}</td>
                        <td>{d.what}</td>
                        <td><span className="status-pill status-pill-idle">{d.who}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="bantuan">
          <div className="lp-wrap lp-help">
            <Reveal className="lp-head">
              <h2>{c.helpTitle}</h2>
              <p>{c.helpDesc}</p>
              <p className="lp-help-links">
                <Link to="/support">{c.helpMore}</Link>
                <Link to="/pdpa">{c.privacy}</Link>
              </p>
            </Reveal>
            <Reveal className="content-card">
              <div className="faq-list">
                {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="lp-section lp-section-last">
          <div className="lp-wrap">
            <Reveal className="lp-cta">
              <div>
                <h2>{c.ctaTitle}</h2>
                <p>{c.ctaDesc}</p>
              </div>
              <Link to="/login" className="lp-btn lp-btn-gold lp-btn-lg">{c.heroLogin}</Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
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
        <div className="lp-wrap lp-foot-bottom">&copy; {now.getFullYear()} {SCHOOL_NAME} · {PRODUCT_NAME}. {c.rights}</div>
      </footer>
    </div>
  )
}
