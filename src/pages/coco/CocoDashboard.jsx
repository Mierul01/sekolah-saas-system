import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where, db } from '../../lib/db'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { COCO_CATEGORIES, todayStr, formatDateLabel } from '../../lib/constants'
import SearchableSelect from '../../components/SearchableSelect'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import DatePicker from '../../components/DatePicker'
import StatTile, { dailyCounts } from '../../components/StatTile'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'

export default function CocoDashboard() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const tileLocale = language === 'en' ? 'en-MY' : 'ms-MY'
  // Draft values follow the controls as the user changes them; the applied
  // values are what the dashboard actually shows, and only catch up when the
  // Filter button is clicked.
  const [draftDate, setDraftDate] = useState(todayStr())
  const [draftCategory, setDraftCategory] = useState('all')
  const [draftSearch, setDraftSearch] = useState('')
  const [date, setDate] = useState(todayStr())
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [allRecords, setAllRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  // The records table starts empty on load — nothing displays until the user
  // clicks Filter at least once, even with today's date already selected.
  const [hasApplied, setHasApplied] = useState(false)

  const categoryFilterOptions = [{ value: 'all', label: t('coco.allCategories') }, ...COCO_CATEGORIES.map((c) => ({ value: c, label: c }))]

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'coco_reports'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setAllRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [schoolId])

  const recordsForDate = useMemo(() => allRecords.filter((r) => r.tarikh === date), [allRecords, date])

  const totalStudents = useMemo(
    () => recordsForDate.reduce((sum, r) => sum + (r.kehadiranPelajar || 0), 0),
    [recordsForDate]
  )

  const notAttended = useMemo(
    () => recordsForDate.filter((r) => r.statusKehadiran !== 'HADIR').length,
    [recordsForDate]
  )

  const filteredRecords = useMemo(() => {
    let recs = recordsForDate
    if (category !== 'all') recs = recs.filter((r) => r.kategori === category)
    const term = search.trim().toLowerCase()
    if (term) {
      recs = recs.filter(
        (r) =>
          r.teacherName?.toLowerCase().includes(term) ||
          r.namaUnit?.toLowerCase().includes(term)
      )
    }
    return recs
  }, [recordsForDate, category, search])

  // Jump back to page 1 whenever the filters or page size change, adjusted
  // directly during render so a narrower filter never strands the view on a
  // now out-of-range page.
  const filterKey = `${date}|${category}|${search}|${pageSize}`
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

  // Last 7 days ending today: reports per day and students involved per day.
  const reportTrend = useMemo(() => dailyCounts(allRecords, 7, tileLocale), [allRecords, tileLocale])
  const studentTrend = useMemo(() => dailyCounts(allRecords, 7, tileLocale, (rows) =>
    rows.reduce((sum, r) => sum + (Number(r.kehadiranPelajar) || 0), 0)
  ), [allRecords, tileLocale])

  const byCategory = useMemo(() => {
    return COCO_CATEGORIES.map((cat) => ({
      name: cat,
      jumlah: recordsForDate.filter((r) => r.kategori === cat).length,
    }))
  }, [recordsForDate])

  function applyFilters() {
    setDate(draftDate)
    setCategory(draftCategory)
    setSearch(draftSearch)
    setHasApplied(true)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('coco.dashTitle')}</h1>
        <p>{t('coco.dashDesc')}</p>
      </div>

      <div className="tile-row">
        <StatTile tone="teal" icon="award" label={t('coco.totalReports')} value={recordsForDate.length} spark={reportTrend} />
        <StatTile tone="green" icon="student" label={t('coco.studentsInvolved')} value={totalStudents} spark={studentTrend} />
        <StatTile
          tone="red" icon="alert" label={t('coco.advisorsAbsent')} value={notAttended}
          suffix={`/${recordsForDate.length}`} bar={recordsForDate.length ? notAttended / recordsForDate.length : 0}
        />
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('coco.byCategory')} ({formatDateLabel(date)})</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#25c98f" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('common.filterExport')}</h3>
        <div className="toolbar-controls">
          <DatePicker value={draftDate} onChange={setDraftDate} />
          <div className="toolbar-select"><SearchableSelect value={draftCategory} onChange={setDraftCategory} options={categoryFilterOptions} /></div>
          <input type="text" placeholder={t('coco.searchPlaceholder')} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <ExportButtons
            filename={`kokurikulum-${date}`}
            title={`${t('coco.reportsForDate')} · ${formatDateLabel(date)}`}
            headers={[t('coco.colAdvisor'), t('coco.colCategory'), t('coco.colUnit'), t('coco.colAttendance'), t('coco.colActivity')]}
            rows={filteredRecords.map((r) => [r.teacherName, r.kategori, r.namaUnit, r.kehadiranPelajar, r.aktiviti])}
          />
        </div>
        <h3 className="card-heading">{t('coco.reportsForDate')}</h3>

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('coco.colAdvisor')}</th><th>{t('coco.colCategory')}</th><th>{t('coco.colUnit')}</th><th>{t('coco.colAttendance')}</th><th>{t('coco.colActivity')}</th></tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={5} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filteredRecords.length === 0 && (
                  <tr><td colSpan={5} className="muted">{t('common.noRecords')}</td></tr>
                )}
                {hasApplied && paginatedRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{r.teacherName}</td>
                    <td>{r.kategori}</td>
                    <td>{r.namaUnit}</td>
                    <td>{r.kehadiranPelajar}</td>
                    <td>{r.aktiviti}</td>
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
    </div>
  )
}
