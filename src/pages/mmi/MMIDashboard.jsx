import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { collection, onSnapshot, query, where, db } from '../../lib/db'
import StatTile from '../../components/StatTile'
import { dailyCounts } from '../../lib/tiles'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { todayStr, formatDateLabel } from '../../lib/constants'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import DatePicker from '../../components/DatePicker'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

function formatTimestamp(ts, locale) {
  if (!ts) return null
  const date = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : null
  if (!date) return null
  return date.toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function MMIDashboard() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  // Draft values follow the Date/search controls as the user changes them;
  // the applied values are what the dashboard actually shows, and only catch
  // up when the Filter button is clicked.
  const [draftDate, setDraftDate] = useState(todayStr())
  const [draftSearch, setDraftSearch] = useState('')
  const [date, setDate] = useState(todayStr())
  const [search, setSearch] = useState('')
  const [allRecords, setAllRecords] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  // The records table starts empty on load — nothing displays until the user
  // clicks Filter at least once, even with today's date already selected.
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'mmi'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setAllRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'users'), where('role', '==', 'guru'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [schoolId])

  const recordsForDate = useMemo(() => allRecords.filter((r) => r.tarikh === date), [allRecords, date])

  // Only teacher accounts count, so filled + not filled always equals the teacher total.
  const uniqueTeachersToday = useMemo(() => {
    const teacherIds = new Set(teachers.map((tc) => tc.id))
    return new Set(recordsForDate.map((r) => r.teacherUid).filter((id) => teacherIds.has(id))).size
  }, [recordsForDate, teachers])

  const avgAttendance = useMemo(() => {
    if (!recordsForDate.length) return 0
    const total = recordsForDate.reduce((sum, r) => sum + (r.kehadiranPelajar || 0), 0)
    return Math.round(total / recordsForDate.length)
  }, [recordsForDate])

  const bySubject = useMemo(() => {
    const counts = {}
    recordsForDate.forEach((r) => {
      counts[r.matapelajaran] = (counts[r.matapelajaran] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, jumlah]) => ({ name, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 8)
  }, [recordsForDate])

  // Full teacher roster for the selected date — everyone shows up, whether
  // they've filled in a record or not, so gaps are easy to spot at a glance.
  const roster = useMemo(() => {
    const latestByTeacher = new Map()
    recordsForDate.forEach((r) => {
      const existing = latestByTeacher.get(r.teacherUid)
      if (!existing || getTime(r.createdAt) > getTime(existing.createdAt)) latestByTeacher.set(r.teacherUid, r)
    })
    return teachers
      .map((tc) => ({ teacher: tc, record: latestByTeacher.get(tc.id) || null }))
      .sort((a, b) => (a.teacher.name || '').localeCompare(b.teacher.name || ''))
  }, [teachers, recordsForDate])

  const filteredRoster = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roster
    return roster.filter(
      ({ teacher, record }) =>
        teacher.name?.toLowerCase().includes(term) ||
        record?.matapelajaran?.toLowerCase().includes(term) ||
        record?.kelas?.toLowerCase().includes(term)
    )
  }, [roster, search])

  // Jump back to page 1 whenever the filters or page size change, adjusted
  // directly during render so a narrower filter never strands the view on a
  // now out-of-range page.
  const filterKey = `${date}|${search}|${pageSize}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filteredRoster.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedRoster = useMemo(
    () => filteredRoster.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRoster, safePage, pageSize]
  )

  const notFilledCount = teachers.length - uniqueTeachersToday
  // Last 7 days ending today: sessions per day and average students per session.
  const sessionTrend = useMemo(() => dailyCounts(allRecords, 7, locale), [allRecords, locale])
  const attendanceTrend = useMemo(() => dailyCounts(allRecords, 7, locale, (rows) =>
    rows.length ? Math.round(rows.reduce((sum, r) => sum + (r.kehadiranPelajar || 0), 0) / rows.length) : 0
  ), [allRecords, locale])

  function applyFilters() {
    setDate(draftDate)
    setSearch(draftSearch)
    setHasApplied(true)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('mmi.dashTitle')}</h1>
        <p>{t('mmi.dashDesc')}</p>
      </div>

      <div className="tile-row">
        <StatTile tone="navy" icon="users" label={t('mmi.totalTeachers')} value={teachers.length} bar={1} />
        <StatTile
          tone="green" icon="check" label={t('mmi.filledToday')} value={uniqueTeachersToday}
          suffix={`/${teachers.length}`} bar={teachers.length ? uniqueTeachersToday / teachers.length : 0}
        />
        <StatTile
          tone="red" icon="alert" label={t('mmi.notFilledToday')} value={notFilledCount}
          bar={teachers.length ? notFilledCount / teachers.length : 0}
        />
        <StatTile tone="gold" icon="clock" label={t('mmi.sessionsRecorded')} value={recordsForDate.length} spark={sessionTrend} />
        <StatTile tone="teal" icon="student" label={t('mmi.avgAttendance')} value={avgAttendance} spark={attendanceTrend} />
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('mmi.bySubject')} ({formatDateLabel(date)})</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bySubject} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" />
            <XAxis type="number" fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={11} width={160} />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#f2a93b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('common.filterExport')}</h3>
        <div className="toolbar-controls">
          <DatePicker value={draftDate} onChange={setDraftDate} />
          <input type="text" placeholder={t('mmi.searchPlaceholder')} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <ExportButtons
            filename={`mmi-${date}`}
            title={`${t('mmi.recordsForDate')} · ${formatDateLabel(date)}`}
            headers={[t('mmi.colTimestamp'), t('mmi.colStatus'), t('mmi.colTeacher'), t('mmi.form'), t('mmi.colClass'), t('mmi.colSubject')]}
            rows={filteredRoster.map(({ teacher, record }) => [
              record ? formatTimestamp(record.createdAt, locale) : '-',
              record ? t('mmi.statusDone') : t('mmi.statusPending'),
              teacher.name,
              record?.tingkatan || '-',
              record?.kelas || '-',
              record?.matapelajaran || '-',
            ])}
          />
        </div>
        <h3 className="card-heading">{t('mmi.recordsForDate')}</h3>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('mmi.colTimestamp')}</th>
                  <th>{t('mmi.colStatus')}</th>
                  <th>{t('mmi.colTeacher')}</th>
                  <th>{t('mmi.form')}</th>
                  <th>{t('mmi.colClass')}</th>
                  <th>{t('mmi.colSubject')}</th>
                </tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={6} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filteredRoster.length === 0 && (
                  <tr><td colSpan={6} className="muted">{t('common.noRecords')}</td></tr>
                )}
                {hasApplied && paginatedRoster.map(({ teacher, record }) => (
                  <tr key={teacher.id} className={record ? 'row-status-done' : 'row-status-pending'}>
                    <td>{record ? formatTimestamp(record.createdAt, locale) : '-'}</td>
                    <td>
                      {record ? (
                        <span className="status-pill status-pill-done">{t('mmi.statusDone')}</span>
                      ) : (
                        <span className="status-pill status-pill-pending">{t('mmi.statusPending')}</span>
                      )}
                    </td>
                    <td>{teacher.name}</td>
                    <td>{record?.tingkatan || '-'}</td>
                    <td>{record?.kelas || '-'}</td>
                    <td>{record?.matapelajaran || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination page={safePage} pageSize={pageSize} totalItems={hasApplied ? filteredRoster.length : 0} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
