import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SCHOOL_NAME, firebaseReady } from '../lib/firebase'
import { collection, getDocs, db } from '../lib/db'
import { seedSampleData, ensurePersonalRecords, ensureTimetableData, ensureFullClassTimetable, ensureTestClass } from '../lib/seedData'
import AccountMenu from './AccountMenu'
import BrandMark from './BrandMark'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationBell from './NotificationBell'
import SidebarToday from './SidebarToday'

const SEED_FLAG = 'ldb_sample_seeded'
const NAV_SECTIONS = ['main', 'daily', 'school', 'links']

function getNavStructure(t) {
  return [
    { type: 'link', to: '/app', label: t('nav.dashboard'), icon: 'grid', end: true, section: 'main' },
    {
      type: 'group',
      section: 'daily',
      key: 'erph',
      label: t('nav.erph'),
      icon: 'doc',
      children: [
        { to: '/app/erph', label: t('nav.erphSubmit') },
        { to: '/app/erph/dashboard', label: t('nav.erphDashboard'), adminOnly: true },
      ],
    },
    {
      type: 'group',
      section: 'daily',
      key: 'mmi',
      label: t('nav.mmi'),
      icon: 'clock',
      children: [
        { to: '/app/mmi', label: t('nav.mmiSubmit') },
        { to: '/app/mmi/dashboard', label: t('nav.mmiDashboard'), adminOnly: true },
      ],
    },
    {
      type: 'group',
      section: 'daily',
      key: 'perhimpunan',
      label: t('nav.perhimpunan'),
      icon: 'flag',
      children: [
        { to: '/app/perhimpunan', label: t('nav.perhimpunanSubmit') },
        { to: '/app/perhimpunan/admin', label: t('nav.perhimpunanAdmin'), adminOnly: true },
      ],
    },
    {
      type: 'group',
      section: 'school',
      key: 'kokurikulum',
      label: t('nav.kokurikulum'),
      icon: 'award',
      children: [
        { to: '/app/kokurikulum/kehadiran', label: t('nav.kokurikulumAttendance') },
        { to: '/app/kokurikulum/badan-beruniform', label: t('nav.kokurikulumBadanBeruniform') },
        { to: '/app/kokurikulum/kelab-persatuan', label: t('nav.kokurikulumKelabPersatuan') },
        { to: '/app/kokurikulum/sukan-permainan', label: t('nav.kokurikulumSukanPermainan') },
        { to: '/app/kokurikulum/rumah-sukan', label: t('nav.kokurikulumRumahSukan') },
        { to: '/app/kokurikulum/dashboard', label: t('nav.kokurikulumDashboard'), adminOnly: true },
      ],
    },
    { type: 'link', to: '/app/kurikulum', label: t('nav.kurikulum'), icon: 'book', section: 'school' },
    {
      type: 'group',
      section: 'school',
      key: 'jadual',
      label: t('nav.jadual'),
      icon: 'calendar',
      children: [
        { to: '/app/jadual', label: t('timetable.viewStudent') },
        { to: '/app/jadual/guru', label: t('timetable.viewTeacher') },
      ],
    },
    { type: 'link', to: '/app/pelajar', label: t('nav.pelajar'), icon: 'users', adminOnly: true, section: 'school' },
    {
      type: 'group',
      section: 'links',
      key: 'externalLinks',
      label: t('nav.externalLinks'),
      icon: 'externalLink',
      children: [
        { href: 'https://aimanbum.github.io/unitkurikulumtb/', label: t('nav.linkKurikulumSite'), external: true },
        { href: 'https://aimanbum.github.io/tmuatb/', label: t('nav.linkTmua'), external: true },
      ],
    },
  ]
}

const ICONS = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  doc: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z',
  chart: 'M4 20V10M12 20V4M20 20v-7',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  flag: 'M5 22V3m0 0h13l-3 5 3 5H5',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  calendar: 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1zM8 13h2M8 17h2M14 13h2M14 17h2',
  chevron: 'M9 18l6-6-6-6',
  help: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.5 9a2.5 2.5 0 015 .5c0 1.667-2.5 1.5-2.5 3.5M12 17.5h.01',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0',
  externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
}

// Titles/icons for the topbar's page indicator, reusing the sidebar's own
// labels so the two never drift out of sync — with a small manual fallback
// for the few pages (profile, help, notifications) that live outside the nav.
function getPageMeta(pathname, navStructure, t) {
  for (const item of navStructure) {
    if (item.type === 'link' && item.to === pathname) return { icon: item.icon, crumbs: [item.label] }
    if (item.type === 'group') {
      const child = item.children.find((c) => c.to === pathname)
      if (child) return { icon: item.icon, crumbs: [item.label, child.label] }
    }
  }
  const extras = {
    '/app/profil': { icon: 'settings', label: t('profile.title') },
    '/app/bantuan': { icon: 'help', label: t('help.title') },
    '/app/notifikasi': { icon: 'bell', label: t('notifications.title') },
  }
  const extra = extras[pathname]
  if (extra) return { icon: extra.icon, crumbs: [extra.label] }
  return { icon: 'grid', crumbs: [t('nav.dashboard')] }
}

function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={ICONS[name]} />
    </svg>
  )
}

function NavGroup({ group, isAdmin, openKey, setOpenKey, onNavigate }) {
  const location = useLocation()
  const children = group.children.filter((c) => !c.adminOnly || isAdmin)
  if (children.length === 0) return null

  const isOpen = openKey === group.key
  const hasActiveChild = children.some((c) => location.pathname === c.to)

  return (
    <div className="sidebar-group">
      <button
        className={`sidebar-link sidebar-group-toggle ${hasActiveChild ? 'active-parent' : ''}`}
        onClick={() => setOpenKey(isOpen ? null : group.key)}
        aria-expanded={isOpen}
      >
        <Icon name={group.icon} />
        <span className="sidebar-link-label">{group.label}</span>
        <Icon name="chevron" className={`sidebar-chevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="sidebar-submenu">
          {children.map((child) =>
            child.external ? (
              <a
                key={child.href}
                href={child.href}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-sublink sidebar-sublink-external"
              >
                <span>{child.label}</span>
                <Icon name="externalLink" className="sidebar-sublink-external-icon" />
              </a>
            ) : (
              <NavLink
                key={child.to}
                to={child.to}
                end
                className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                {child.label}
              </NavLink>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, profile, isAdmin } = useAuth()
  const { t } = useLanguage()
  const [navOpen, setNavOpen] = useState(false)
  const [openKey, setOpenKey] = useState(null)
  const location = useLocation()
  const navStructure = getNavStructure(t)
  const pageMeta = getPageMeta(location.pathname, navStructure, t)
  const sectionLabels = { daily: t('nav.sectionDaily'), school: t('nav.sectionSchool'), links: t('nav.sectionLinks') }

  // Escape closes the phone menu sheet, like the overlay tap does.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  // Runs once per session as soon as any /app/* page mounts — not just the
  // dashboard — so sample/self-healing data is in place no matter which page
  // a user lands on first (direct link, refresh, bookmark, etc.).
  useEffect(() => {
    if (firebaseReady || !user) return
    ;(async () => {
      if (localStorage.getItem(SEED_FLAG) !== '1') {
        localStorage.setItem(SEED_FLAG, '1') // claim synchronously so StrictMode's double-invoke can't race this
        const snap = await getDocs(collection(db, 'erph'))
        if (snap.empty) {
          await seedSampleData()
        }
      }
      const me = { id: user.uid, name: profile?.name }
      await ensurePersonalRecords(me)
      await ensureTimetableData(me)
      await ensureFullClassTimetable()
      await ensureTestClass()
    })().catch((err) => {
      console.error('Local sample data could not be prepared:', err)
    })
  }, [user, profile])

  useEffect(() => {
    const activeGroup = navStructure.find(
      (item) => item.type === 'group' && item.children.some((c) => location.pathname === c.to)
    )
    setOpenKey(activeGroup ? activeGroup.key : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <BrandMark />
          <div>
            <strong>{SCHOOL_NAME}</strong>
            <span>SchoolManage</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => {
            const items = navStructure.filter(
              (item) => item.section === section && (item.type === 'link' ? !item.adminOnly || isAdmin : true)
            )
            if (items.length === 0) return null
            return (
              <div className="sidebar-section" key={section}>
                {section !== 'main' && <h2 className="sidebar-section-label">{sectionLabels[section]}</h2>}
                {items.map((item) =>
                  item.type === 'group' ? (
                    <NavGroup
                      key={item.key}
                      group={item}
                      isAdmin={isAdmin}
                      openKey={openKey}
                      setOpenKey={setOpenKey}
                      onNavigate={() => setNavOpen(false)}
                    />
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setNavOpen(false)}
                    >
                      <Icon name={item.icon} />
                      <span className="sidebar-link-label">{item.label}</span>
                    </NavLink>
                  )
                )}
              </div>
            )
          })}
          <SidebarToday onNavigate={() => setNavOpen(false)} />
        </nav>

        <AccountMenu />
      </aside>

      {navOpen && <div className="sidebar-overlay" onClick={() => setNavOpen(false)} />}

      <div className="main-col">
        <header className="topbar-app">
          <button className="menu-btn" onClick={() => setNavOpen(true)} aria-label="Buka menu" aria-expanded={navOpen}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="topbar-page">
            <span className="topbar-page-icon">
              <Icon name={pageMeta.icon} />
            </span>
            <div className="topbar-page-text">
              {pageMeta.crumbs.length > 1 && <span className="topbar-page-crumb">{pageMeta.crumbs[0]}</span>}
              <strong>{pageMeta.crumbs[pageMeta.crumbs.length - 1]}</strong>
            </div>
          </div>
          <div className="topbar-spacer" />
          <NotificationBell />
          <LanguageSwitcher className="lang-switch-light" />
        </header>
        {/* Keyed by path so the enter animation replays on every page change. */}
        <main className="page-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
