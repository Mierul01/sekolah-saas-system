import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, onSnapshot, query, where, db } from '../lib/db'
import { todayStr } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { StatRowSkeleton, ListSkeleton } from './Skeleton'

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

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

function getActivityMeta(t) {
  return {
    erph: { label: 'e-RPH', color: 'bg-blue', to: '/app/erph/dashboard' },
    mmi: { label: 'MMI', color: 'bg-gold', to: '/app/mmi/dashboard' },
    coco: { label: t('nav.kokurikulum'), color: 'bg-teal', to: '/app/kokurikulum/dashboard' },
  }
}

function getQuickActions(t) {
  return [
    { to: '/app/erph/dashboard', label: t('nav.erphDashboard'), color: 'bg-blue', icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z' },
    { to: '/app/mmi/dashboard', label: t('nav.mmiDashboard'), color: 'bg-gold', icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2' },
    { to: '/app/perhimpunan/admin', label: t('nav.perhimpunanAdmin'), color: 'bg-purple', icon: 'M5 22V3m0 0h13l-3 5 3 5H5' },
    { to: '/app/kokurikulum/dashboard', label: t('nav.kokurikulumDashboard'), color: 'bg-teal', icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5' },
    { to: '/app/kurikulum', label: t('nav.kurikulum'), color: 'bg-navy', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z' },
    { to: '/app/pelajar', label: t('nav.pelajar'), color: 'bg-green', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  ]
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function AdminOverview() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const activityMeta = getActivityMeta(t)
  const quickActions = getQuickActions(t)
  const today = todayStr()
  const [teachers, setTeachers] = useState([])
  const [erph, setErph] = useState([])
  const [mmi, setMmi] = useState([])
  const [coco, setCoco] = useState([])
  const [session, setSession] = useState(undefined)
  const [checkins, setCheckins] = useState([])
  const [teachersLoaded, setTeachersLoaded] = useState(false)
  const [erphLoaded, setErphLoaded] = useState(false)
  const loading = !(teachersLoaded && erphLoaded)

  useEffect(() => {
    if (!schoolId) return
    return onSnapshot(query(collection(db, 'users'), where('schoolId', '==', schoolId)), (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === 'guru'))
      setTeachersLoaded(true)
    })
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    return onSnapshot(query(collection(db, 'erph'), where('schoolId', '==', schoolId)), (snap) => {
      setErph(snap.docs.map((d) => ({ id: d.id, type: 'erph', ...d.data() })))
      setErphLoaded(true)
    })
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    return onSnapshot(query(collection(db, 'mmi'), where('schoolId', '==', schoolId)), (snap) => {
      setMmi(snap.docs.map((d) => ({ id: d.id, type: 'mmi', ...d.data() })))
    })
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    return onSnapshot(query(collection(db, 'coco_reports'), where('schoolId', '==', schoolId)), (snap) => {
      setCoco(snap.docs.map((d) => ({ id: d.id, type: 'coco', ...d.data() })))
    })
  }, [schoolId])

  useEffect(() => onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
    setSession(snap.exists() ? snap.data() : null)
  }), [today])

  useEffect(() => {
    if (!schoolId) return
    return onSnapshot(query(collection(db, 'assembly_checkins'), where('schoolId', '==', schoolId)), (snap) => {
      setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => c.sessionId === today))
    })
  }, [today, schoolId])

  const erphToday = useMemo(() => erph.filter((r) => r.tarikh === today), [erph, today])
  const erphSubmittedUids = useMemo(() => new Set(erphToday.map((r) => r.teacherUid)), [erphToday])
  const belumHantar = useMemo(() => teachers.filter((tc) => !erphSubmittedUids.has(tc.id)), [teachers, erphSubmittedUids])

  const mmiToday = useMemo(() => mmi.filter((r) => r.tarikh === today), [mmi, today])

  const cocoWeek = useMemo(() => {
    const days = lastNDays(7)
    return coco.filter((r) => days.includes(r.tarikh))
  }, [coco])

  const recentActivity = useMemo(() => {
    return [...erph, ...mmi, ...coco]
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .slice(0, 6)
  }, [erph, mmi, coco])

  const compliance = teachers.length ? Math.round((erphSubmittedUids.size / teachers.length) * 100) : 0

  return (
    <div>
      {loading ? (
        <StatRowSkeleton count={5} />
      ) : (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card-icon bg-navy"><Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></div>
            <span>{teachers.length}</span><label>{t('adminOverview.totalTeachers')}</label>
          </div>
          <div className={compliance >= 80 ? 'stat-card stat-good' : 'stat-card stat-bad'}>
            <div className={`stat-card-icon ${compliance >= 80 ? 'bg-green' : 'bg-red'}`}><Icon path="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" /></div>
            <span>{erphSubmittedUids.size}/{teachers.length}</span><label>{t('adminOverview.erphToday')} ({compliance}%)</label>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-gold"><Icon path="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" /></div>
            <span>{mmiToday.length}</span><label>{t('adminOverview.mmiToday')}</label>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-teal"><Icon path="M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5" /></div>
            <span>{cocoWeek.length}</span><label>{t('adminOverview.cocoWeek')}</label>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon bg-purple"><Icon path="M5 22V3m0 0h13l-3 5 3 5H5" /></div>
            <span>{session?.active ? checkins.length : 0}</span>
            <label>{session?.active ? t('adminOverview.assemblyCheckin') : t('adminOverview.noAssemblySession')}</label>
          </div>
        </div>
      )}

      <div className="admin-overview-grid">
        <div className="content-card">
          <h3 className="card-heading">{t('adminOverview.recentActivity')}</h3>
          {loading ? (
            <ListSkeleton rows={5} />
          ) : recentActivity.length === 0 ? (
            <p className="muted">{t('adminOverview.noActivity')}</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((item) => {
                const meta = activityMeta[item.type]
                const detail = item.type === 'erph' ? item.tajuk : item.type === 'mmi' ? `${item.matapelajaran} · ${item.tingkatan} ${item.kelas}` : `${item.kategori} · ${item.namaUnit}`
                return (
                  <Link to={meta.to} key={`${item.type}-${item.id}`} className="activity-row">
                    <span className={`activity-dot ${meta.color}`} />
                    <div className="activity-row-text">
                      <strong>{item.teacherName}</strong>
                      <span>{meta.label} &middot; {detail}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="admin-overview-side">
          <div className="content-card">
            <h3 className="card-heading">{t('adminOverview.quickActions')}</h3>
            <div className="quick-actions-grid">
              {quickActions.map((qa) => (
                <Link to={qa.to} key={qa.to} className="quick-action" data-color={qa.color}>
                  <div className={`quick-action-icon ${qa.color}`}><Icon path={qa.icon} /></div>
                  <span>{qa.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="content-card">
            <h3 className="card-heading">{t('adminOverview.notSubmittedToday')}</h3>
            {belumHantar.length === 0 ? (
              <p className="muted">{t('adminOverview.allSubmitted')}</p>
            ) : (
              <div className="chip-list">
                {belumHantar.map((tc) => <span key={tc.id} className="chip">{tc.name}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
