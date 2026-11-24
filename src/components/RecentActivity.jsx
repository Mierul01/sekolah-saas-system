import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where, db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatDateLabel } from '../lib/constants'
import { ListSkeleton } from './Skeleton'
import { TILE_ICONS, lastDays } from '../lib/tiles'

// Only the last 30 days are fetched (Firestore allows up to 30 values in an 'in' filter).
const RECENT_DAYS = lastDays(30)

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

function getActivityMeta(t) {
  return {
    erph: { label: 'e-RPH', tone: 'blue', icon: 'doc', to: '/app/erph' },
    mmi: { label: 'MMI', tone: 'gold', icon: 'clock', to: '/app/mmi' },
    coco: { label: t('nav.kokurikulum'), tone: 'teal', icon: 'award', to: '/app/kokurikulum/kehadiran' },
  }
}

// A co-curriculum report now lives on one of four category-specific pages —
// route each activity row back to the exact page that record was filed on.
const COCO_CATEGORY_ROUTES = {
  'BADAN BERUNIFORM': '/app/kokurikulum/badan-beruniform',
  'KELAB & PERSATUAN': '/app/kokurikulum/kelab-persatuan',
  'SUKAN & PERMAINAN': '/app/kokurikulum/sukan-permainan',
  'RUMAH SUKAN': '/app/kokurikulum/rumah-sukan',
}

export default function RecentActivity() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const activityMeta = getActivityMeta(t)
  const [erph, setErph] = useState([])
  const [mmi, setMmi] = useState([])
  const [coco, setCoco] = useState([])
  const [erphLoaded, setErphLoaded] = useState(false)
  const [mmiLoaded, setMmiLoaded] = useState(false)
  const [cocoLoaded, setCocoLoaded] = useState(false)
  const loading = !(erphLoaded && mmiLoaded && cocoLoaded)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'erph'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), where('tarikh', 'in', RECENT_DAYS))
    return onSnapshot(q, (snap) => {
      setErph(snap.docs.map((d) => ({ id: d.id, type: 'erph', ...d.data() })))
      setErphLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'mmi'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), where('tarikh', 'in', RECENT_DAYS))
    return onSnapshot(q, (snap) => {
      setMmi(snap.docs.map((d) => ({ id: d.id, type: 'mmi', ...d.data() })))
      setMmiLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'coco_reports'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), where('tarikh', 'in', RECENT_DAYS))
    return onSnapshot(q, (snap) => {
      setCoco(snap.docs.map((d) => ({ id: d.id, type: 'coco', ...d.data() })))
      setCocoLoaded(true)
    })
  }, [user, schoolId])

  const recentActivity = useMemo(() => {
    return [...erph, ...mmi, ...coco]
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .slice(0, 5)
  }, [erph, mmi, coco])

  return (
    <section className="content-card sheet">
      <h2 className="card-heading">{t('home.myActivity')}</h2>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : recentActivity.length === 0 ? (
        <p className="empty-line">{t('home.myActivityEmpty')}</p>
      ) : (
        <ul className="line-list">
          {recentActivity.map((item) => {
            const meta = activityMeta[item.type]
            const detail = item.type === 'erph' ? item.tajuk : item.type === 'mmi' ? `${item.matapelajaran} · ${item.tingkatan} ${item.kelas}` : `${item.kategori} · ${item.namaUnit}`
            const to = item.type === 'coco' ? COCO_CATEGORY_ROUTES[item.kategori] || meta.to : meta.to
            return (
              <li key={`${item.type}-${item.id}`}>
                <Link to={to} className="line-row">
                  <span className={`line-icon tone-${meta.tone}`}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={TILE_ICONS[meta.icon]} />
                    </svg>
                  </span>
                  <span className="line-text">
                    <strong>{meta.label}</strong>
                    <span>{detail}</span>
                  </span>
                  <time className="line-meta">{formatDateLabel(item.tarikh, locale)}</time>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
