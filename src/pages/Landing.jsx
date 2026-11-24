import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { PRODUCT_NAME, SCHOOL_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { Loader, useSmoothScroll, Cursor, Magnetic, PinnedHero, HorizontalGallery, TiltMarquee } from './landing/Wow'
import { SplitText, ShinyText, RollingNumber, SpotlightCard, Reveal } from './landing/Effects'
import { getLandingCopy } from './landing/copy'
import './landing/landing.css'

const THEME_KEY = 'sm-landing-theme'
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Anton&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Karla:wght@400;500;700&display=swap'

// One colour per module, the same ones the system uses for that module.
const MODULE_STYLE = [
  { color: '#2563c9', icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z' },
  { color: '#d9861f', icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2' },
  { color: '#6447d1', icon: 'M5 22V3m0 0h13l-3 5 3 5H5' },
  { color: '#168596', icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5' },
  { color: '#cc3a33', icon: 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z' },
  { color: '#3d63b0', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z' },
  { color: '#14855a', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
]

const STAT_STYLE = [
  { color: '#f2a93b', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { color: '#168596', icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5' },
  { color: '#2563c9', icon: 'M12 3L2 8l10 5 10-5-10-5zM6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4' },
  { color: '#6447d1', icon: 'M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6' },
]

const WHY_ICONS = [
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
  'M9 12l2 2 4-4M12 22a10 10 0 100-20 10 10 0 000 20z',
  'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
]

function Icon({ path, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage blocked */ }
  return 'dark'
}

export default function Landing() {
  const { language } = useLanguage()
  const c = getLandingCopy(language, SCHOOL_NAME)
  const [theme, setTheme] = useState(getInitialTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  useSmoothScroll()

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* storage blocked */ }
  }, [theme])

  // Display fonts are only needed here, so they load with this page, not with the system.
  useEffect(() => {
    if (document.getElementById('lp-fonts')) return
    const link = document.createElement('link')
    link.id = 'lp-fonts'
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
    { href: '#modul', label: c.navModules },
    { href: '#sehari', label: c.navDay },
    { href: '#kenapa', label: c.navWhy },
  ]
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <MotionConfig reducedMotion="user">
      <div className="lp" data-theme={theme}>
        <Loader word={PRODUCT_NAME.toUpperCase()} mark={<BrandMark className="loader-mark" />} />
        <Cursor />

        <header className="lp-nav">
          <div className="wrap lp-nav-in">
            <a href="#top" className="lp-brand" aria-label={PRODUCT_NAME}>
              <BrandMark />
              <strong>{PRODUCT_NAME}</strong>
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
              <Link to="/login" className="btn btn-primary lp-login" data-cursor={c.login}>{c.login}</Link>
              <button type="button" className="lp-icon-btn lp-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label={menuOpen ? c.closeMenu : c.menu}>
                <Icon path={menuOpen ? 'M18 6L6 18M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} size={20} />
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="lp-sheet">
              {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
              <LanguageSwitcher className="lp-lang" />
              <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)}>{c.login}</Link>
            </div>
          )}
        </header>

        <main>
          <PinnedHero
            img="/dashboard-preview.png"
            imgAlt={c.heroImgAlt}
            top={<SplitText text={c.heroTop} />}
            bottom={<span className="accent">{c.heroBottom}</span>}
          >
            {[
              <div className="wrap phero-meta-in" key="meta">
                <p className="lead">{c.heroLead}</p>
                <div className="cta-row">
                  <Magnetic>
                    <Link to="/login" className="btn btn-primary btn-lg" data-cursor={c.login}>{c.loginNow}</Link>
                  </Magnetic>
                  <a href="#modul" className="btn btn-ghost btn-lg">{c.seeModules}</a>
                </div>
                <span className="scroll-hint" aria-hidden><i />{c.scrollHint}</span>
              </div>,
              <div className="wrap phero-end-in" key="end">
                <span className="kicker">{c.heroEndKicker}</span>
                <h2>{c.heroEndTitle}</h2>
                <p>{c.heroEndNote}</p>
              </div>,
            ]}
          </PinnedHero>

          <section className="stats-band" aria-label={c.navModules}>
            <div className="wrap stats">
              {c.stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.06} className="stat" >
                  <div className="stat-in" style={{ '--c': STAT_STYLE[i].color }}>
                    <span className="stat-ic"><Icon path={STAT_STYLE[i].icon} size={19} /></span>
                    <div>
                      <div className="stat-v"><RollingNumber value={s.value} delay={i * 0.1} /></div>
                      <div className="stat-l">{s.label}</div>
                      <div className="stat-bar"><i style={{ width: `${Math.round(s.fill * 100)}%` }} /></div>
                      <div className="stat-n">{s.note}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <TiltMarquee rows={[c.marqueeA, c.marqueeB]} pauseLabel={c.pause} playLabel={c.play} />

          <HorizontalGallery
            id="modul"
            swipeLabel={c.swipe}
            head={
              <div className="sec-head">
                <ShinyText className="kicker">{c.modulesKicker}</ShinyText>
                <h2>{c.modulesTitle}</h2>
                <p>{c.modulesDesc}</p>
              </div>
            }
          >
            {c.modules.map((m, i) => (
              <SpotlightCard key={m.title} className="mod-card" style={{ '--c': MODULE_STYLE[i].color }}>
                <div className="mod-top">
                  <span className="mod-ic"><Icon path={MODULE_STYLE[i].icon} size={22} /></span>
                  <span className="mod-num" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3>{m.title}</h3>
                <p className="mod-desc">{m.desc}</p>
                <dl className="mod-roles">
                  <div>
                    <dt>{c.teacher}</dt>
                    <dd>{m.teacher || c.adminOnly}</dd>
                  </div>
                  <div>
                    <dt>{c.admin}</dt>
                    <dd>{m.admin}</dd>
                  </div>
                </dl>
              </SpotlightCard>
            ))}
          </HorizontalGallery>

          <section className="section alt" id="sehari">
            <div className="wrap day">
              <Reveal className="sec-head">
                <span className="kicker">{c.dayKicker}</span>
                <h2>{c.dayTitle}</h2>
              </Reveal>
              <ol className="day-list">
                {c.day.map((d, i) => (
                  <Reveal as="li" key={d.title} delay={i * 0.05} className="day-item">
                    <span className="day-when">{d.when}</span>
                    <span className="day-dot" aria-hidden />
                    <div className="day-body">
                      <h3>{d.title}</h3>
                      <p>{d.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </section>

          <section className="section" id="kenapa">
            <div className="wrap why">
              <Reveal className="sec-head why-head">
                <span className="kicker">{c.whyKicker}</span>
                <h2>{c.whyTitle}</h2>
                <p>{c.whyDesc}</p>
              </Reveal>
              <ul className="why-list">
                {c.why.map((w, i) => (
                  <Reveal as="li" key={w.title} delay={i * 0.04} className="why-item">
                    <span className="why-ic"><Icon path={WHY_ICONS[i]} size={19} /></span>
                    <div>
                      <h3>{w.title}</h3>
                      <p>{w.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>

          <section className="cta-band">
            <div className="wrap cta-in">
              <Reveal>
                <h2 className="cta-title">{c.ctaTitle}</h2>
                <p>{c.ctaDesc}</p>
              </Reveal>
              <div className="cta-row">
                <Magnetic>
                  <Link to="/login" className="btn btn-primary btn-lg" data-cursor={c.login}>{c.loginNow}</Link>
                </Magnetic>
                <Link to="/support" className="btn btn-ghost btn-lg">{c.ctaSupport}</Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="lp-foot">
          <div className="wrap lp-foot-in">
            <div>
              <div className="lp-brand">
                <BrandMark />
                <strong>{PRODUCT_NAME}</strong>
              </div>
              <p>{c.footerTagline}</p>
            </div>
            <nav className="lp-foot-links" aria-label={PRODUCT_NAME}>
              {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
              <Link to="/login">{c.login}</Link>
              <Link to="/pdpa">{c.privacy}</Link>
              <Link to="/terms">{c.terms}</Link>
              <Link to="/support">{c.support}</Link>
            </nav>
          </div>
          <div className="wrap lp-foot-bottom">&copy; {new Date().getFullYear()} {PRODUCT_NAME}. {c.rights}</div>
        </footer>
      </div>
    </MotionConfig>
  )
}
