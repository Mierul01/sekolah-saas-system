import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { collection, onSnapshot, query, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { todayStr, formatDateLabel, toLocalISODate } from '../../lib/constants'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import DatePicker from '../../components/DatePicker'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'

function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(toLocalISODate(d))
  }
  return days
}

export default function ERPHDashboard() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
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
    const q = query(collection(db, 'erph'), where('schoolId', '==', schoolId))
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

  const recordsForDate = useMemo(
    () => allRecords.filter((r) => r.tarikh === date),
    [allRecords, date]
  )

  const submittedUids = useMemo(
    () => new Set(recordsForDate.map((r) => r.teacherUid)),
    [recordsForDate]
  )

  const notSubmitted = useMemo(
    () => teachers.filter((tc) => !submittedUids.has(tc.id)),
    [teachers, submittedUids]
  )

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return recordsForDate
    return recordsForDate.filter(
      (r) =>
        r.teacherName?.toLowerCase().includes(term) ||
        r.matapelajaran?.toLowerCase().includes(term) ||
        r.tajuk?.toLowerCase().includes(term)
    )
  }, [recordsForDate, search])

  // Jump back to page 1 whenever the filters or page size change, adjusted
  // directly during render so a narrower filter never strands the view on a
  // now out-of-range page.
  const filterKey = `${date}|${search}|${pageSize}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  )

  const chartData = useMemo(() => {
    const days = lastNDays(7)
    return days.map((d) => ({
      date: formatDateLabel(d).replace(/ \d{4}$/, ''),
      jumlah: allRecords.filter((r) => r.tarikh === d).length,
    }))
  }, [allRecords])

  const complianceRate = teachers.length ? Math.round((submittedUids.size / teachers.length) * 100) : 0

  function applyFilters() {
    setDate(draftDate)
    setSearch(draftSearch)
    setHasApplied(true)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('erph.dashTitle')}</h1>
        <p>{t('erph.dashDesc')}</p>
      </div>

      <div className="stat-row">
        <div className="stat-card"><span>{teachers.length}</span><label>{t('erph.totalTeachers')}</label></div>
        <div className="stat-card stat-good"><span>{submittedUids.size}</span><label>{t('erph.submitted')}</label></div>
        <div className="stat-card stat-bad"><span>{notSubmitted.length}</span><label>{t('erph.notSubmitted')}</label></div>
        <div className="stat-card"><span>{complianceRate}%</span><label>{t('erph.complianceRate')}</label></div>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('erph.trend7')}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#2563c9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('common.filterExport')}</h3>
        <div className="toolbar-controls">
          <DatePicker value={draftDate} onChange={setDraftDate} />
          <input type="text" placeholder={t('erph.searchPlaceholder')} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <ExportButtons
            filename={`erph-${date}`}
            title={`${t('erph.recordsForDate')} · ${formatDateLabel(date)}`}
            headers={[t('erph.colTeacher'), t('erph.colSubject'), t('erph.colFormClass'), t('erph.colTopic')]}
            rows={filteredRecords.map((r) => [r.teacherName, r.matapelajaran, `${r.tingkatan} ${r.kelas}`, r.tajuk])}
          />
        </div>
        <h3 className="card-heading">{t('erph.recordsForDate')}</h3>

        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('erph.colTeacher')}</th><th>{t('erph.colSubject')}</th><th>{t('erph.colFormClass')}</th><th>{t('erph.colTopic')}</th></tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={4} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filteredRecords.length === 0 && (
                  <tr><td colSpan={4} className="muted">{t('common.noRecords')}</td></tr>
                )}
                {hasApplied && paginatedRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{r.teacherName}</td>
                    <td>{r.matapelajaran}</td>
                    <td>{r.tingkatan} {r.kelas}</td>
                    <td>{r.tajuk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination page={safePage} pageSize={pageSize} totalItems={hasApplied ? filteredRecords.length : 0} onPageChange={setPage} />
        )}
      </div>

      {notSubmitted.length > 0 && (
        <div className="content-card">
          <h3 className="card-heading">{t('erph.notSubmittedList')} ({formatDateLabel(date)})</h3>
          <div className="chip-list">
            {notSubmitted.map((tc) => <span key={tc.id} className="chip">{tc.name}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}
