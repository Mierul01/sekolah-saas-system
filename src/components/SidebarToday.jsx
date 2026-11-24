import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { collection, doc, onSnapshot, query, where, db } from '../lib/db'
import { todayStr } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// Live "today" checklist at the foot of the sidebar: what the signed-in
// teacher still has to do, or for an admin, how the school is doing today.
// Each row links to the page where the item is done.
export default function SidebarToday({ onNavigate }) {
  const { user, profile, isAdmin } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const today = todayStr()
  const [teachers, setTeachers] = useState(null)
  const [erph, setErph] = useState(null)
  const [mmi, setMmi] = useState(null)
  const [session, setSession] = useState(undefined)
  const [checkins, setCheckins] = useState(null)

  useEffect(() => {
    if (!isAdmin || !schoolId) return
    return onSnapshot(query(collection(db, 'users'), where('schoolId', '==', schoolId)), (snap) => {
      setTeachers(new Set(snap.docs.filter((d) => d.data().role === 'guru').map((d) => d.id)))
    })
  }, [isAdmin, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const scope = isAdmin ? [] : [where('teacherUid', '==', user.uid)]
    const unsubErph = onSnapshot(
      query(collection(db, 'erph'), where('schoolId', '==', schoolId), where('tarikh', '==', today), ...scope),
      (snap) => setErph(new Set(snap.docs.map((d) => d.data().teacherUid)))
    )
    const unsubMmi = onSnapshot(
      query(collection(db, 'mmi'), where('schoolId', '==', schoolId), where('tarikh', '==', today), ...scope),
      (snap) => setMmi(snap.docs.length)
    )
    const unsubCheckins = onSnapshot(
      query(collection(db, 'assembly_checkins'), where('schoolId', '==', schoolId), where('sessionId', '==', today), ...scope),
      (snap) => setCheckins(snap.docs.length)
    )
    return () => { unsubErph(); unsubMmi(); unsubCheckins() }
  }, [user, schoolId, isAdmin, today])

  useEffect(() => onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
    setSession(snap.exists() ? snap.data() : null)
  }), [today])

  const loading = erph === null || mmi === null || checkins === null || session === undefined || (isAdmin && teachers === null)
  const sessionActive = Boolean(session?.active)
  // Admin view counts teacher accounts only, matching the dashboard tiles.
  const teacherTotal = teachers?.size ?? 0
  const erphCount = !erph ? 0 : isAdmin ? [...erph].filter((id) => teachers?.has(id)).length : erph.size

  const rows = isAdmin
    ? [
        {
          key: 'erph', to: '/app/erph/dashboard', label: 'e-RPH',
          value: t('sidebarToday.teachersOf', { n: erphCount, total: teacherTotal }),
          state: teacherTotal > 0 && erphCount >= teacherTotal ? 'done' : 'pending',
        },
        {
          key: 'mmi', to: '/app/mmi/dashboard', label: 'MMI',
          value: t('sidebarToday.sessions', { n: mmi }),
          state: mmi > 0 ? 'done' : 'idle',
        },
        {
          key: 'assembly', to: '/app/perhimpunan/admin', label: t('nav.perhimpunan'),
          value: sessionActive ? t('sidebarToday.checkins', { n: checkins }) : t('sidebarToday.noSession'),
          state: sessionActive ? 'done' : 'idle',
        },
      ]
    : [
        {
          key: 'erph', to: '/app/erph', label: 'e-RPH',
          value: erphCount > 0 ? t('sidebarToday.submitted') : t('sidebarToday.notSubmitted'),
          state: erphCount > 0 ? 'done' : 'pending',
        },
        {
          key: 'mmi', to: '/app/mmi', label: 'MMI',
          value: t('sidebarToday.sessions', { n: mmi }),
          state: mmi > 0 ? 'done' : 'idle',
        },
        {
          key: 'assembly', to: '/app/perhimpunan', label: t('nav.perhimpunan'),
          value: !sessionActive ? t('sidebarToday.noSession') : checkins > 0 ? t('sidebarToday.checkedIn') : t('sidebarToday.notCheckedIn'),
          state: !sessionActive ? 'idle' : checkins > 0 ? 'done' : 'pending',
        },
      ]

  return (
    <section className="sidebar-today" aria-label={t('sidebarToday.title')}>
      <h2 className="sidebar-section-label">{t('sidebarToday.title')}</h2>
      {loading ? (
        <div className="sidebar-today-loading">
          {[0, 1, 2].map((i) => <span key={i} className="skeleton skeleton-text sidebar-today-skel" />)}
        </div>
      ) : (
        <ul className="sidebar-today-list">
          {rows.map((r) => (
            <li key={r.key}>
              <NavLink to={r.to} end className="sidebar-today-row" onClick={onNavigate}>
                <span className={`sidebar-today-mark is-${r.state}`} aria-hidden="true">
                  {r.state === 'done' ? (
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : r.state === 'pending' ? '!' : '–'}
                </span>
                <span className="sidebar-today-label">{r.label}</span>
                <span className="sidebar-today-value">{r.value}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
