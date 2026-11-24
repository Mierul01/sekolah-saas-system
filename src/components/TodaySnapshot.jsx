import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, onSnapshot, query, where, db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { todayStr } from '../lib/constants'
import { TILE_ICONS } from '../lib/tiles'

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TILE_ICONS[name]} />
    </svg>
  )
}

// Today's three daily duties for the signed-in teacher, each with its
// status and the button that does it.
export default function TodaySnapshot() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const today = todayStr()
  const [erphToday, setErphToday] = useState(null)
  const [mmiCount, setMmiCount] = useState(null)
  const [session, setSession] = useState(undefined)
  const [checkedIn, setCheckedIn] = useState(null)

  useEffect(() => {
    if (!user || !schoolId) return
    const mine = (name, extra) => query(collection(db, name), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), extra)
    const subs = [
      onSnapshot(mine('erph', where('tarikh', '==', today)), (snap) => setErphToday(!snap.empty), () => setErphToday(false)),
      onSnapshot(mine('mmi', where('tarikh', '==', today)), (snap) => setMmiCount(snap.docs.length), () => setMmiCount(0)),
      onSnapshot(mine('assembly_checkins', where('sessionId', '==', today)), (snap) => setCheckedIn(!snap.empty), () => setCheckedIn(false)),
    ]
    return () => subs.forEach((unsub) => unsub())
  }, [user, today, schoolId])

  useEffect(() => onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
    setSession(snap.exists() ? snap.data() : null)
  }, () => setSession(null)), [today])

  const loading = erphToday === null || mmiCount === null || checkedIn === null || session === undefined
  const sessionOpen = Boolean(session?.active)

  const rows = [
    {
      key: 'erph', icon: 'doc', tone: 'blue', label: 'e-RPH', to: '/app/erph',
      status: erphToday ? t('home.snapshotErphDone') : t('home.snapshotErphPending'),
      done: erphToday, action: erphToday ? t('home.actionView') : t('home.actionSubmit'),
    },
    {
      key: 'mmi', icon: 'clock', tone: 'gold', label: 'MMI', to: '/app/mmi',
      status: mmiCount > 0 ? `${mmiCount} ${t('home.snapshotMmiSessions')}` : t('home.snapshotMmiNone'),
      done: mmiCount > 0, action: t('home.actionLog'),
    },
    {
      key: 'assembly', icon: 'flag', tone: 'purple', label: t('nav.perhimpunan'), to: '/app/perhimpunan',
      status: !sessionOpen ? t('home.snapshotNoAssembly') : checkedIn ? t('home.snapshotAssemblyDone') : t('home.snapshotAssemblyPending'),
      done: checkedIn, idle: !sessionOpen && !checkedIn,
      action: checkedIn || !sessionOpen ? t('home.actionView') : t('home.actionCheckIn'),
    },
  ]

  return (
    <>
      <h2 className="card-heading">{t('home.todayTasks')}</h2>
      {loading ? (
        <div className="activity-list">
          {[0, 1, 2].map((i) => <span key={i} className="skeleton skeleton-text" style={{ height: 30, margin: '6px 0' }} />)}
        </div>
      ) : (
        <ul className="line-list">
          {rows.map((r) => (
            <li key={r.key} className="line-row line-row-static">
              <span className={`line-icon tone-${r.tone}`}><Icon name={r.icon} /></span>
              <span className="line-text">
                <strong>{r.label}</strong>
                <span>{r.status}</span>
              </span>
              <span className={`status-pill ${r.done ? 'status-pill-done' : r.idle ? 'status-pill-idle' : 'status-pill-pending'}`}>
                {r.done ? t('home.statusDone') : r.idle ? t('home.statusNone') : t('home.statusPending')}
              </span>
              <Link to={r.to} className={r.done || r.idle ? 'btn-line' : 'btn-line btn-line-primary'}>{r.action}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
