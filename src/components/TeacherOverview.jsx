import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where, db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { StatRowSkeleton } from './Skeleton'

function lastNDays(n) {
  const days = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    days.push(local.toISOString().slice(0, 10))
  }
  return days
}

const ICONS = {
  erph: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z',
  mmi: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  coco: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5',
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function TeacherOverview() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const [erph, setErph] = useState([])
  const [mmi, setMmi] = useState([])
  const [coco, setCoco] = useState([])
  const [erphLoaded, setErphLoaded] = useState(false)
  const [mmiLoaded, setMmiLoaded] = useState(false)
  const [cocoLoaded, setCocoLoaded] = useState(false)
  const loading = !(erphLoaded && mmiLoaded && cocoLoaded)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'erph'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => {
      setErph(snap.docs.map((d) => d.data()))
      setErphLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'mmi'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => {
      setMmi(snap.docs.map((d) => d.data()))
      setMmiLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'coco_reports'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => {
      setCoco(snap.docs.map((d) => d.data()))
      setCocoLoaded(true)
    })
  }, [user, schoolId])

  const weekCounts = useMemo(() => {
    const days = lastNDays(7)
    return {
      erph: erph.filter((r) => days.includes(r.tarikh)).length,
      mmi: mmi.filter((r) => days.includes(r.tarikh)).length,
      coco: coco.filter((r) => days.includes(r.tarikh)).length,
    }
  }, [erph, mmi, coco])

  if (loading) return <StatRowSkeleton count={3} />

  return (
    <div className="stat-row">
      <div className="stat-card">
        <div className="stat-card-icon bg-blue"><Icon path={ICONS.erph} /></div>
        <span>{weekCounts.erph}</span><label>{t('home.weekErph')}</label>
      </div>
      <div className="stat-card">
        <div className="stat-card-icon bg-gold"><Icon path={ICONS.mmi} /></div>
        <span>{weekCounts.mmi}</span><label>{t('home.weekMmi')}</label>
      </div>
      <div className="stat-card">
        <div className="stat-card-icon bg-teal"><Icon path={ICONS.coco} /></div>
        <span>{weekCounts.coco}</span><label>{t('home.weekCoco')}</label>
      </div>
    </div>
  )
}
