import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, query, where, db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { todayStr } from '../lib/constants'

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function TodaySnapshot() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const today = todayStr()
  const [erphToday, setErphToday] = useState(false)
  const [mmiCount, setMmiCount] = useState(0)
  const [session, setSession] = useState(undefined)
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'erph'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => setErphToday(snap.docs.some((d) => d.data().tarikh === today)))
  }, [user, today, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'mmi'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => setMmiCount(snap.docs.filter((d) => d.data().tarikh === today).length))
  }, [user, today, schoolId])

  useEffect(() => onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
    setSession(snap.exists() ? snap.data() : null)
  }), [today])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'assembly_checkins'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => setCheckedIn(snap.docs.some((d) => d.data().sessionId === today)))
  }, [user, today, schoolId])

  return (
    <div className="snapshot-row">
      <div className={`snapshot-item ${erphToday ? 'snapshot-good' : 'snapshot-warn'}`}>
        <div className={`snapshot-icon ${erphToday ? 'bg-green' : 'bg-gold'}`}>
          <Icon path="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" />
        </div>
        <div>
          <strong>{erphToday ? t('home.snapshotErphDone') : t('home.snapshotErphPending')}</strong>
          <span>e-RPH</span>
        </div>
      </div>

      <div className={`snapshot-item ${mmiCount > 0 ? 'snapshot-good' : ''}`}>
        <div className={`snapshot-icon ${mmiCount > 0 ? 'bg-green' : 'bg-blue'}`}>
          <Icon path="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" />
        </div>
        <div>
          <strong>{mmiCount > 0 ? `${mmiCount} ${t('home.snapshotMmiSessions')}` : t('home.snapshotMmiNone')}</strong>
          <span>MMI</span>
        </div>
      </div>

      <div className={`snapshot-item ${checkedIn ? 'snapshot-good' : session ? 'snapshot-warn' : ''}`}>
        <div className={`snapshot-icon ${checkedIn ? 'bg-green' : 'bg-purple'}`}>
          <Icon path="M5 22V3m0 0h13l-3 5 3 5H5" />
        </div>
        <div>
          <strong>{session === null ? t('home.snapshotNoAssembly') : checkedIn ? t('home.snapshotAssemblyDone') : t('home.snapshotAssemblyPending')}</strong>
          <span>{t('nav.perhimpunan')}</span>
        </div>
      </div>
    </div>
  )
}
