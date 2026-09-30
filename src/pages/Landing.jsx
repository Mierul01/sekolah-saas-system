import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import BrandMark from '../components/BrandMark'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Reveal from '../components/Reveal'

function getNavLinks(t) {
  return [
    { href: '#ciri-ciri', label: t('landing.navFeatures') },
    { href: '#modul', label: t('landing.navModules') },
    { href: '#cara-berfungsi', label: t('landing.navHow') },
  ]
}

function getModules(t) {
  return [
    { title: t('landing.m1Title'), desc: t('landing.m1Desc'), icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z', color: 'bg-blue' },
    { title: t('landing.m2Title'), desc: t('landing.m2Desc'), icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2', color: 'bg-gold' },
    { title: t('landing.m3Title'), desc: t('landing.m3Desc'), icon: 'M5 22V3m0 0h13l-3 5 3 5H5', color: 'bg-green' },
    { title: t('landing.m4Title'), desc: t('landing.m4Desc'), icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5', color: 'bg-teal' },
    { title: t('landing.m5Title'), desc: t('landing.m5Desc'), icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z', color: 'bg-navy' },
    { title: t('landing.m6Title'), desc: t('landing.m6Desc'), icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', color: 'bg-purple' },
    { title: t('landing.m7Title'), desc: t('landing.m7Desc'), icon: 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z', color: 'bg-red' },
  ]
}

function getSteps(t) {
  return [
    { num: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { num: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { num: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ]
}

function Icon({ path, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={path} />
    </svg>
  )
}

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)
  const { t } = useLanguage()
  const navLinks = getNavLinks(t)
  const modules = getModules(t)
  const steps = getSteps(t)

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <BrandMark />
            <strong>{PRODUCT_NAME}</strong>
          </Link>

          <nav className="landing-links">
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>

          <div className="landing-nav-actions">
            <LanguageSwitcher />
            <Link to="/login" className="btn-submit">{t('landing.login')}</Link>
          </div>

          <button className="menu-btn landing-menu-btn" onClick={() => setNavOpen((o) => !o)} aria-label="Buka menu">
            <Icon path="M4 6h16M4 12h16M4 18h16" />
          </button>
        </div>

        {navOpen && (
          <div className="landing-mobile-menu">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}>{l.label}</a>
            ))}
            <Link to="/login" onClick={() => setNavOpen(false)}>{t('landing.login')}</Link>
            <LanguageSwitcher />
          </div>
        )}
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="eyebrow"><Icon path="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.4 5.7 20.8 8 13.6 2 9.2h7.6z" width="14" height="14" /> {t('landing.badge')}</span>
            <h1>{t('brand.tagline')}</h1>
            <p>{t('landing.heroBody')}</p>
            <div className="landing-hero-actions">
              <Link to="/login" className="btn-submit">{t('landing.loginNow')}</Link>
              <a href="#modul" className="btn-ghost-app">{t('landing.viewModules')}</a>
            </div>
            <div className="landing-trust">
              <div><strong>{modules.length}+</strong><span>{t('landing.stat1')}</span></div>
              <div><strong>100%</strong><span>{t('landing.stat2')}</span></div>
              <div><strong>{t('landing.stat3Value')}</strong><span>{t('landing.stat3')}</span></div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="mock-browser">
              <div className="mock-browser-bar">
                <span /><span /><span />
              </div>
              <div className="mock-browser-body">
                <div className="mock-sidebar">
                  <div className="mock-sidebar-brand" />
                  <div className="mock-sidebar-link active" />
                  <div className="mock-sidebar-link" />
                  <div className="mock-sidebar-link" />
                  <div className="mock-sidebar-link" />
                </div>
                <div className="mock-content">
                  <div className="mock-stat-row">
                    <div className="mock-stat" />
                    <div className="mock-stat" />
                    <div className="mock-stat" />
                  </div>
                  <div className="mock-card-row">
                    <div className="mock-card" />
                    <div className="mock-card" />
                  </div>
                  <div className="mock-chart" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="ciri-ciri">
        <div className="landing-section-inner">
          <Reveal className="section-head">
            <span className="eyebrow">{t('landing.featuresEyebrow')}</span>
            <h2>{t('landing.featuresTitle')}</h2>
            <p>{t('landing.featuresDesc')}</p>
          </Reveal>
          <div className="landing-feature-grid">
            <Reveal className="landing-feature" delay={0}>
              <div className="module-icon bg-blue"><Icon path="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></div>
              <h3>{t('landing.f1Title')}</h3>
              <p>{t('landing.f1Desc')}</p>
            </Reveal>
            <Reveal className="landing-feature" delay={80}>
              <div className="module-icon bg-gold"><Icon path="M4 20V10M12 20V4M20 20v-7" /></div>
              <h3>{t('landing.f2Title')}</h3>
              <p>{t('landing.f2Desc')}</p>
            </Reveal>
            <Reveal className="landing-feature" delay={160}>
              <div className="module-icon bg-green"><Icon path="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></div>
              <h3>{t('landing.f3Title')}</h3>
              <p>{t('landing.f3Desc')}</p>
            </Reveal>
            <Reveal className="landing-feature" delay={240}>
              <div className="module-icon bg-teal"><Icon path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></div>
              <h3>{t('landing.f4Title')}</h3>
              <p>{t('landing.f4Desc')}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt" id="modul">
        <div className="landing-section-inner">
          <Reveal className="section-head">
            <span className="eyebrow">{t('landing.modulesEyebrow')}</span>
            <h2>{t('landing.modulesTitle')}</h2>
            <p>{t('landing.modulesDesc')}</p>
          </Reveal>
          <div className="landing-module-grid">
            {modules.map((m, i) => (
              <Reveal className="module-card" data-color={m.color} key={m.title} delay={i * 70}>
                <div className={`module-icon ${m.color}`}><Icon path={m.icon} /></div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="cara-berfungsi">
        <div className="landing-section-inner">
          <Reveal className="section-head">
            <span className="eyebrow">{t('landing.howEyebrow')}</span>
            <h2>{t('landing.howTitle')}</h2>
          </Reveal>
          <div className="landing-steps">
            {steps.map((s, i) => (
              <Reveal className="step-card" key={s.num} delay={i * 100}>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta" id="hubungi">
        <div className="landing-section-inner landing-cta-inner">
          <div>
            <h2>{t('landing.ctaTitle')}</h2>
            <p>{t('landing.ctaDesc')}</p>
          </div>
          <div className="landing-hero-actions">
            <Link to="/login" className="btn-submit">{t('landing.login')}</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-brand">
              <BrandMark />
              <strong>{PRODUCT_NAME}</strong>
            </div>
            <p>{t('landing.footerTagline')}</p>
          </div>
          <div className="landing-footer-col">
            <h4>{t('landing.footerProduct')}</h4>
            <a href="#ciri-ciri">{t('landing.navFeatures')}</a>
            <a href="#cara-berfungsi">{t('landing.navHow')}</a>
            <Link to="/login">{t('landing.getStarted')}</Link>
          </div>
          <div className="landing-footer-col">
            <h4>{t('landing.footerLegal')}</h4>
            <Link to="/pdpa">{t('landing.privacyPolicy')}</Link>
            <Link to="/terms">{t('landing.termsOfService')}</Link>
            <Link to="/support">{t('landing.supportDataDeletion')}</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          &copy; {new Date().getFullYear()} {PRODUCT_NAME}. {t('landing.footerRights')}
        </div>
      </footer>
    </div>
  )
}
