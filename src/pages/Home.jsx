import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import AdminOverview from '../components/AdminOverview'
import TodaySnapshot from '../components/TodaySnapshot'
import TeacherOverview from '../components/TeacherOverview'
import RecentActivity from '../components/RecentActivity'

function getModules(t) {
  return [
    { to: '/app/erph', title: t('home.modErph.title'), desc: t('home.modErph.desc'), tone: 'blue', icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z' },
    { to: '/app/mmi', title: t('home.modMmi.title'), desc: t('home.modMmi.desc'), tone: 'gold', icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2' },
    { to: '/app/perhimpunan', title: t('home.modPerhimpunan.title'), desc: t('home.modPerhimpunan.desc'), tone: 'purple', icon: 'M5 22V3m0 0h13l-3 5 3 5H5' },
    { to: '/app/kokurikulum/kehadiran', title: t('home.modKoko.title'), desc: t('home.modKoko.desc'), tone: 'teal', icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5' },
    { to: '/app/kurikulum', title: t('home.modKurikulum.title'), desc: t('home.modKurikulum.desc'), tone: 'navy', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z' },
  ]
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function ModuleCard({ mod }) {
  return (
    <Link to={mod.to} className={`module-launch tile-${mod.tone}`}>
      <span className="tile-icon"><Icon path={mod.icon} /></span>
      <span className="module-launch-text">
        <strong>{mod.title}</strong>
        <span>{mod.desc}</span>
      </span>
    </Link>
  )
}

export default function Home() {
  const { profile, isAdmin } = useAuth()
  const { t, language } = useLanguage()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('home.greetingMorning') : hour < 15 ? t('home.greetingAfternoon') : hour < 19 ? t('home.greetingEvening') : t('home.greetingNight')
  const modules = getModules(t)
  const now = new Date()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'

  return (
    <div>
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>{greeting}, {profile?.name?.split(' ')[0]}</h1>
          <p>{isAdmin ? t('home.adminSubtitle') : t('home.guruSubtitle')}</p>
        </div>
        <div className="dash-hero-date">
          <strong>{now.getDate()}</strong>
          <span>
            <b>{now.toLocaleDateString(locale, { weekday: 'long' })}</b>
            {now.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {isAdmin ? (
        <AdminOverview />
      ) : (
        <>
          <TeacherOverview />
          <div className="teacher-dash-layout">
            <section className="content-card sheet">
              <TodaySnapshot />
              <div className="sheet-divider" />
              <h2 className="card-heading">{t('home.modules')}</h2>
              <div className="module-grid">
                {modules.map((m) => <ModuleCard key={m.to} mod={m} />)}
              </div>
            </section>
            <RecentActivity />
          </div>
        </>
      )}
    </div>
  )
}
