import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where, db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatDateLabel } from '../lib/constants'
import { ListSkeleton } from './Skeleton'

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

function getActivityMeta(t) {
  return {
    erph: { label: 'e-RPH', color: 'bg-blue', to: '/app/erph' },
    mmi: { label: 'MMI', color: 'bg-gold', to: '/app/mmi' },
    coco: { label: t('nav.kokurikulum'), color: 'bg-teal', to: '/app/kokurikulum/kehadiran' },
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
    const q = query(collection(db, 'erph'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => {
      setErph(snap.docs.map((d) => ({ id: d.id, type: 'erph', ...d.data() })))
      setErphLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'mmi'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
    return onSnapshot(q, (snap) => {
      setMmi(snap.docs.map((d) => ({ id: d.id, type: 'mmi', ...d.data() })))
      setMmiLoaded(true)
    })
  }, [user, schoolId])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'coco_reports'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId))
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
    <div className="content-card activity-sidebar">
      <h3 className="card-heading">{t('home.myActivity')}</h3>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : recentActivity.length === 0 ? (
        <p className="muted">{t('home.myActivityEmpty')}</p>
      ) : (
        <div className="activity-list activity-list-compact">
          {recentActivity.map((item) => {
            const meta = activityMeta[item.type]
            const detail = item.type === 'erph' ? item.tajuk : item.type === 'mmi' ? `${item.matapelajaran} · ${item.tingkatan} ${item.kelas}` : `${item.kategori} · ${item.namaUnit}`
            const to = item.type === 'coco' ? COCO_CATEGORY_ROUTES[item.kategori] || meta.to : meta.to
            return (
              <Link to={to} key={`${item.type}-${item.id}`} className="activity-row">
                <span className={`activity-dot ${meta.color}`} />
                <div className="activity-row-text">
                  <strong>{meta.label}</strong>
                  <span>{formatDateLabel(item.tarikh, locale)} &middot; {detail}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
