import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { collection, doc, onSnapshot, query, where, db } from '../lib/db'
import { todayStr } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { StatRowSkeleton, ListSkeleton } from './Skeleton'
import StatTile, { TILE_ICONS, dailyCounts, lastDays } from './StatTile'

const RECENT_LIMIT = 6
const NOT_SUBMITTED_LIMIT = 6

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

function getActivityMeta(t) {
  return {
    erph: { label: 'e-RPH', tone: 'blue', icon: 'doc', to: '/app/erph/dashboard' },
    mmi: { label: 'MMI', tone: 'gold', icon: 'clock', to: '/app/mmi/dashboard' },
    coco: { label: t('nav.kokurikulum'), tone: 'teal', icon: 'award', to: '/app/kokurikulum/dashboard' },
  }
}

function getQuickActions(t) {
  return [
    { to: '/app/erph/dashboard', label: t('nav.erphDashboard'), tone: 'blue', icon: 'doc' },
    { to: '/app/mmi/dashboard', label: t('nav.mmiDashboard'), tone: 'gold', icon: 'clock' },
    { to: '/app/perhimpunan/admin', label: t('nav.perhimpunanAdmin'), tone: 'purple', icon: 'flag' },
    { to: '/app/kokurikulum/dashboard', label: t('nav.kokurikulumDashboard'), tone: 'teal', icon: 'award' },
    { to: '/app/kurikulum', label: t('nav.kurikulum'), tone: 'navy', icon: 'book' },
    { to: '/app/pelajar', label: t('nav.pelajar'), tone: 'green', icon: 'student' },
  ]
}

function Icon({ name, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TILE_ICONS[name] || name} />
    </svg>
  )
}

function initials(name = '') {
  return name.replace(/^Cikgu\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

export default function AdminOverview() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const activityMeta = getActivityMeta(t)
  const quickActions = getQuickActions(t)
  const today = todayStr()
  const week = useMemo(() => lastDays(7), [today]) // eslint-disable-line react-hooks/exhaustive-deps
  const [teachers, setTeachers] = useState([])
  const [erph, setErph] = useState([])
  const [mmi, setMmi] = useState([])
  const [coco, setCoco] = useState([])
  const [session, setSession] = useState(undefined)
  const [checkins, setCheckins] = useState([])
  const [loaded, setLoaded] = useState({ teachers: false, erph: false, mmi: false, coco: false })
  const [failed, setFailed] = useState(false)
  const loading = !Object.values(loaded).every(Boolean)

  // Only the last 7 days are fetched: that is all this page shows.
  useEffect(() => {
    if (!schoolId) return
    const onError = () => setFailed(true)
    const mark = (key) => setLoaded((l) => (l[key] ? l : { ...l, [key]: true }))
    const recent = (name) => query(collection(db, name), where('schoolId', '==', schoolId), where('tarikh', 'in', week))
    const subs = [
      onSnapshot(query(collection(db, 'users'), where('schoolId', '==', schoolId)), (snap) => {
        setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === 'guru'))
        mark('teachers')
      }, onError),
      onSnapshot(recent('erph'), (snap) => {
        setErph(snap.docs.map((d) => ({ id: d.id, type: 'erph', ...d.data() })))
        mark('erph')
      }, onError),
      onSnapshot(recent('mmi'), (snap) => {
        setMmi(snap.docs.map((d) => ({ id: d.id, type: 'mmi', ...d.data() })))
        mark('mmi')
      }, onError),
      onSnapshot(recent('coco_reports'), (snap) => {
        setCoco(snap.docs.map((d) => ({ id: d.id, type: 'coco', ...d.data() })))
        mark('coco')
      }, onError),
      onSnapshot(query(collection(db, 'assembly_checkins'), where('sessionId', '==', today), where('schoolId', '==', schoolId)), (snap) => {
        setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, onError),
    ]
    return () => subs.forEach((unsub) => unsub())
  }, [schoolId, week, today])

  useEffect(() => onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
    setSession(snap.exists() ? snap.data() : null)
  }, () => setSession(null)), [today])

  // Only teacher accounts count towards the e-RPH figures; an admin's own records don't.
  const teacherIds = useMemo(() => new Set(teachers.map((tc) => tc.id)), [teachers])
  const erphToday = useMemo(() => erph.filter((r) => r.tarikh === today), [erph, today])
  const erphSubmittedUids = useMemo(
    () => new Set(erphToday.map((r) => r.teacherUid).filter((id) => teacherIds.has(id))),
    [erphToday, teacherIds]
  )
  const belumHantar = useMemo(() => teachers.filter((tc) => !erphSubmittedUids.has(tc.id)), [teachers, erphSubmittedUids])
  const mmiToday = useMemo(() => mmi.filter((r) => r.tarikh === today), [mmi, today])
  const activeToday = useMemo(() => {
    const ids = new Set([...erphToday, ...mmiToday].map((r) => r.teacherUid))
    return teachers.filter((tc) => ids.has(tc.id)).length
  }, [erphToday, mmiToday, teachers])

  const distinctTeachers = (rows) => new Set(rows.map((r) => r.teacherUid)).size
  const erphTrend = useMemo(
    () => dailyCounts(erph.filter((r) => teacherIds.has(r.teacherUid)), 7, locale, distinctTeachers),
    [erph, locale, teacherIds]
  )
  const mmiTrend = useMemo(() => dailyCounts(mmi, 7, locale), [mmi, locale])
  const cocoTrend = useMemo(() => dailyCounts(coco, 7, locale), [coco, locale])
  const cocoStudents = useMemo(() => coco.reduce((sum, r) => sum + (Number(r.kehadiranPelajar) || 0), 0), [coco])

  const recentActivity = useMemo(() => {
    return [...erph, ...mmi, ...coco]
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .slice(0, RECENT_LIMIT)
  }, [erph, mmi, coco])

  const total = teachers.length
  const compliance = total ? erphSubmittedUids.size / total : 0
  const sessionActive = Boolean(session?.active)

  function timeLabel(ts) {
    const ms = getTime(ts)
    if (!ms) return ''
    return new Date(ms).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  }

  if (failed) {
    return <div className="alert alert-error" role="alert">{t('adminOverview.loadError')}</div>
  }

  return (
    <div>
      {loading ? (
        <StatRowSkeleton count={5} />
      ) : (
        <div className="tile-row">
          <StatTile
            tone="navy" icon="users" label={t('adminOverview.totalTeachers')} value={total}
            bar={total ? activeToday / total : 0}
            note={t('adminOverview.activeToday', { n: activeToday })}
          />
          <StatTile
            tone={compliance >= 0.8 ? 'green' : 'blue'} icon="doc" label={t('adminOverview.erphToday')}
            value={erphSubmittedUids.size} suffix={`/${total}`} bar={compliance}
            note={t('adminOverview.compliance', { pct: Math.round(compliance * 100), n: belumHantar.length })}
          />
          <StatTile
            tone="gold" icon="clock" label={t('adminOverview.mmiToday')} value={mmiToday.length} spark={mmiTrend}
            note={t('adminOverview.mmiTeachers', { n: distinctTeachers(mmiToday) })}
          />
          <StatTile
            tone="teal" icon="award" label={t('adminOverview.cocoWeek')} value={coco.length} spark={cocoTrend}
            note={t('adminOverview.cocoStudents', { n: cocoStudents })}
          />
          <StatTile
            tone="purple" icon="flag" label={t('adminOverview.assemblyCheckin')}
            value={sessionActive ? checkins.length : 0} suffix={`/${total}`}
            bar={sessionActive && total ? checkins.length / total : 0}
            note={sessionActive
              ? t('adminOverview.assemblyActive', { n: Math.max(0, total - checkins.length) })
              : `${t('adminOverview.noAssemblySession')}. ${t('adminOverview.noAssemblyNote')}`}
          />
        </div>
      )}

      <div className="admin-overview-grid">
        <section className="content-card sheet">
          <div className="sheet-head">
            <h2 className="card-heading">{t('adminOverview.erphChartTitle')}</h2>
            <Link to="/app/erph/dashboard" className="sheet-link">{t('adminOverview.openDashboard')}</Link>
          </div>
          {loading ? (
            <div className="chart-skeleton skeleton" />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={erphTrend} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e7f0" />
                  <XAxis dataKey="label" fontSize={11.5} tickLine={false} axisLine={false} tick={{ fill: '#475467' }} />
                  <YAxis fontSize={11.5} allowDecimals={false} domain={[0, Math.max(total, 1)]} tickLine={false} axisLine={false} tick={{ fill: '#475467' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(37,99,201,.06)' }}
                    formatter={(v) => [`${v}/${total} ${t('adminOverview.chartTeachers')}`, 'e-RPH']}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={34} isAnimationActive={false}>
                    {erphTrend.map((d) => <Cell key={d.iso} fill={d.iso === today ? '#2563c9' : '#9dbbea'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="sheet-divider" />

          <h2 className="card-heading">{t('adminOverview.recentActivity')}</h2>
          {loading ? (
            <ListSkeleton rows={4} />
          ) : recentActivity.length === 0 ? (
            <p className="empty-line">{t('adminOverview.noActivity')} {t('adminOverview.noActivityHint')}</p>
          ) : (
            <ul className="line-list">
              {recentActivity.map((item) => {
                const meta = activityMeta[item.type]
                const detail = item.type === 'erph' ? item.tajuk : item.type === 'mmi' ? `${item.matapelajaran} · ${item.tingkatan} ${item.kelas}` : `${item.kategori} · ${item.namaUnit}`
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <Link to={meta.to} className="line-row">
                      <span className={`line-icon tone-${meta.tone}`}><Icon name={meta.icon} size={15} /></span>
                      <span className="line-text">
                        <strong>{item.teacherName}</strong>
                        <span>{meta.label} · {detail}</span>
                      </span>
                      <time className="line-meta">{timeLabel(item.createdAt)}</time>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="content-card sheet">
          <div className="sheet-head">
            <h2 className="card-heading">{t('adminOverview.notSubmittedToday')}</h2>
            {!loading && belumHantar.length > 0 && <span className="count-pill tone-red">{belumHantar.length}</span>}
          </div>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : belumHantar.length === 0 ? (
            <p className="empty-line is-good">{t('adminOverview.allSubmitted')}</p>
          ) : (
            <>
              <ul className="line-list">
                {belumHantar.slice(0, NOT_SUBMITTED_LIMIT).map((tc) => (
                  <li key={tc.id} className="line-row line-row-static">
                    <span className="line-avatar" aria-hidden="true">{initials(tc.name)}</span>
                    <span className="line-text"><strong>{tc.name}</strong></span>
                    <span className="status-pill status-pill-pending">{t('sidebarToday.notSubmitted')}</span>
                  </li>
                ))}
              </ul>
              {belumHantar.length > NOT_SUBMITTED_LIMIT && (
                <Link to="/app/erph/dashboard" className="sheet-more">
                  {t('adminOverview.moreNotSubmitted', { n: belumHantar.length - NOT_SUBMITTED_LIMIT })}
                </Link>
              )}
            </>
          )}

          <div className="sheet-divider" />

          <h2 className="card-heading">{t('adminOverview.quickActions')}</h2>
          <ul className="line-list">
            {quickActions.map((qa) => (
              <li key={qa.to}>
                <Link to={qa.to} className="line-row">
                  <span className={`line-icon tone-${qa.tone}`}><Icon name={qa.icon} size={15} /></span>
                  <span className="line-text"><strong>{qa.label}</strong></span>
                  <span className="line-chevron" aria-hidden="true"><Icon name="M9 18l6-6-6-6" size={15} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
