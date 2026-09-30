import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where, serverTimestamp, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { SCHOOL_NAME } from '../../lib/firebase'
import { SCHOOL_DAYS, SUBJECTS, FORMS, CLASSES, TIME_SLOTS } from '../../lib/constants'
import { exportToExcel, exportTimetableGridPdf } from '../../lib/exportTable'
import SearchableSelect from '../../components/SearchableSelect'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'
import { TableSkeleton } from '../../components/Skeleton'

const emptyForm = { hari: '', masa: '', matapelajaran: '', tingkatan: '', kelas: '' }

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

// Shared implementation for both timetable pages — the Student Timetable
// (mode="kelas", grouped/exported per class, with the add-slot form) and the
// Teacher Timetable (mode="guru", grouped/exported per teacher). Each page
// is a thin wrapper that fixes `mode`; splitting them into two routes (with
// their own sidebar entries) reads better than one page with an internal
// toggle, since "which timetable" is really a navigation choice.
export default function TimetableView({ mode }) {
  const { user, profile, isAdmin } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  // Draft filter values follow the dropdowns as the user changes them; the
  // "applied" values are what the table/export actually use, and only catch
  // up to the draft when the Filter button is clicked — so picking a class
  // doesn't refresh the table on every intermediate choice.
  const [draftHari, setDraftHari] = useState('all')
  const [draftTingkatan, setDraftTingkatan] = useState('all')
  const [draftKelas, setDraftKelas] = useState('all')
  const [draftGuru, setDraftGuru] = useState('all')
  const [appliedHari, setAppliedHari] = useState('all')
  const [appliedTingkatan, setAppliedTingkatan] = useState('all')
  const [appliedKelas, setAppliedKelas] = useState('all')
  const [appliedGuru, setAppliedGuru] = useState('all')

  const [pendingDelete, setPendingDelete] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  // The table starts empty on load — nothing displays until the user clicks
  // Filter at least once, even with the default "all" filters.
  const [hasApplied, setHasApplied] = useState(false)

  const dayOptions = SCHOOL_DAYS.map((d) => ({ value: d, label: t(`timetable.day_${d}`) }))
  const dayFilterOptions = [{ value: 'all', label: t('timetable.allDays') }, ...dayOptions]
  const tingkatanFilterOptions = [{ value: 'all', label: t('students.allForms') }, ...FORMS.map((f) => ({ value: f, label: f }))]
  const kelasFilterOptions = [{ value: 'all', label: t('students.allClasses') }, ...CLASSES.map((c) => ({ value: c, label: c }))]

  const teacherOptions = useMemo(() => {
    const map = new Map()
    entries.forEach((r) => {
      if (r.teacherUid && !map.has(r.teacherUid)) map.set(r.teacherUid, r.teacherName)
    })
    return [...map.entries()]
      .map(([uid, name]) => ({ value: uid, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [entries])
  const teacherFilterOptions = [{ value: 'all', label: t('timetable.allTeachers') }, ...teacherOptions]

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'timetable'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [schoolId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function applyFilters() {
    setAppliedHari(draftHari)
    setAppliedTingkatan(draftTingkatan)
    setAppliedKelas(draftKelas)
    setAppliedGuru(draftGuru)
    setHasApplied(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    if (!form.hari || !form.masa || !form.matapelajaran || !form.tingkatan || !form.kelas) {
      setErrorMsg(t('common.fillRequired'))
      return
    }
    const clash = entries.some(
      (r) => r.hari === form.hari && r.masa === form.masa && r.tingkatan === form.tingkatan && r.kelas === form.kelas
    )
    if (clash) {
      setErrorMsg(t('timetable.slotConflict'))
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'timetable'), {
        teacherUid: user.uid,
        teacherName: profile?.name || user.email,
        schoolId,
        ...form,
        createdAt: serverTimestamp(),
      })
      setSuccess(true)
      setForm(emptyForm)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setErrorMsg(t('common.failedRetry'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteDoc(doc(db, 'timetable', pendingDelete.id))
    setPendingDelete(null)
  }

  const sorted = useMemo(() => {
    const dayIndex = (d) => SCHOOL_DAYS.indexOf(d)
    const timeIndex = (m) => TIME_SLOTS.indexOf(m)
    return [...entries].sort((a, b) => {
      const dayDiff = dayIndex(a.hari) - dayIndex(b.hari)
      if (dayDiff !== 0) return dayDiff
      return timeIndex(a.masa) - timeIndex(b.masa)
    })
  }, [entries])

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      if (appliedHari !== 'all' && r.hari !== appliedHari) return false
      if (mode === 'kelas') {
        if (appliedTingkatan !== 'all' && r.tingkatan !== appliedTingkatan) return false
        if (appliedKelas !== 'all' && r.kelas !== appliedKelas) return false
      } else {
        if (appliedGuru !== 'all' && r.teacherUid !== appliedGuru) return false
      }
      return true
    })
  }, [sorted, appliedHari, appliedTingkatan, appliedKelas, appliedGuru, mode])

  // Jump back to page 1 whenever the applied filters or page size change, so
  // a narrower filter never leaves the view stranded on a now out-of-range
  // page. Adjusting state directly during render (React's own escape hatch
  // for this) avoids the extra render pass a useEffect would cost.
  const filterKey = `${appliedHari}|${appliedTingkatan}|${appliedKelas}|${appliedGuru}|${pageSize}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    return filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  }, [filtered, safePage, pageSize])

  // One printable grid per group — by class (student timetable) or by
  // teacher (teacher timetable) — so the same PDF/legend/REHAT/merge
  // machinery in exportTable.js can render either view.
  const printGridGroups = useMemo(() => {
    const byGroup = new Map()
    filtered.forEach((r) => {
      const key = mode === 'kelas' ? `${r.tingkatan}|${r.kelas}` : r.teacherUid
      if (!byGroup.has(key)) byGroup.set(key, [])
      byGroup.get(key).push(r)
    })
    return [...byGroup.values()].map((records) => {
      // Show every period between the earliest and latest one actually used
      // (not just the ones with data) so REHAT appears as its own column
      // instead of silently vanishing as a gap.
      const usedIndexes = TIME_SLOTS.map((slot, i) => (records.some((r) => r.masa === slot) ? i : -1)).filter((i) => i >= 0)
      const usedSlots =
        usedIndexes.length === 0 ? [] : TIME_SLOTS.slice(Math.min(...usedIndexes), Math.max(...usedIndexes) + 1)
      const cells = {}
      records.forEach((r) => {
        const dayLabel = t(`timetable.day_${r.hari}`)
        const key = `${dayLabel}|${r.masa}`
        // Multiple entries can land on the same day+time+group (a genuine
        // scheduling clash) — stack them instead of silently dropping one.
        if (!cells[key]) cells[key] = []
        cells[key].push({
          subject: r.matapelajaran,
          secondary: mode === 'kelas' ? r.teacherName : `${r.tingkatan} ${r.kelas}`,
        })
      })
      return {
        title: mode === 'kelas' ? `${records[0].tingkatan} ${records[0].kelas}` : records[0].teacherName,
        days: SCHOOL_DAYS.map((d) => t(`timetable.day_${d}`)),
        timeSlots: usedSlots,
        cells,
      }
    })
  }, [filtered, t, mode])

  // A specific class (or teacher) filter gets its own readable filename
  // (e.g. "Jadual Tingkatan 5 Qalun" or "Jadual Cikgu Faizal Rahman") instead
  // of the generic default, so a downloaded file is recognisable at a glance.
  const exportFilename =
    mode === 'kelas'
      ? appliedTingkatan !== 'all' && appliedKelas !== 'all'
        ? `Jadual ${toTitleCase(appliedTingkatan)} ${toTitleCase(appliedKelas)}`
        : null
      : appliedGuru !== 'all'
      ? `Jadual ${teacherOptions.find((o) => o.value === appliedGuru)?.label || ''}`.trim()
      : null

  function handleExportExcel() {
    exportToExcel(
      exportFilename || 'jadual-waktu',
      [t('timetable.day'), t('timetable.time'), t('timetable.subject'), t('timetable.form'), t('timetable.className'), t('timetable.teacher')],
      filtered.map((r) => [t(`timetable.day_${r.hari}`), r.masa, r.matapelajaran, r.tingkatan, r.kelas, r.teacherName])
    )
  }

  function handleExportGridPdf() {
    if (printGridGroups.length === 0) return
    exportTimetableGridPdf(
      exportFilename || (mode === 'kelas' ? 'jadual-waktu-kelas' : 'jadual-waktu-guru'),
      SCHOOL_NAME,
      printGridGroups,
      language,
      mode
    )
  }

  return (
    <div>
      <div className="page-head">
        <h1>{mode === 'kelas' ? t('timetable.viewStudent') : t('timetable.viewTeacher')}</h1>
        <p>{t('timetable.desc')}</p>
      </div>

      {mode === 'kelas' && (
        <div className="content-card">
          <h3 className="card-heading">{t('timetable.addTitle')}</h3>
          {success && <div className="alert alert-success">{t('timetable.success')}</div>}
          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="field">
                <label>{t('timetable.day')} *</label>
                <SearchableSelect value={form.hari} onChange={(v) => update('hari', v)} options={dayOptions} />
              </div>
              <div className="field">
                <label>{t('timetable.time')} *</label>
                <SearchableSelect value={form.masa} onChange={(v) => update('masa', v)} options={TIME_SLOTS} />
              </div>
            </div>
            <div className="field">
              <label>{t('timetable.subject')} *</label>
              <SearchableSelect value={form.matapelajaran} onChange={(v) => update('matapelajaran', v)} options={SUBJECTS} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>{t('timetable.form')} *</label>
                <SearchableSelect value={form.tingkatan} onChange={(v) => update('tingkatan', v)} options={FORMS} />
              </div>
              <div className="field">
                <label>{t('timetable.className')} *</label>
                <SearchableSelect value={form.kelas} onChange={(v) => update('kelas', v)} options={CLASSES} />
              </div>
            </div>
            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? t('common.submitting') : t('timetable.addBtn')}
            </button>
          </form>
        </div>
      )}

      <div className="content-card">
        <h3 className="card-heading">{t('common.filterExport')}</h3>
        <div className="toolbar-controls">
          <div className="toolbar-select"><SearchableSelect value={draftHari} onChange={setDraftHari} options={dayFilterOptions} /></div>
          {mode === 'kelas' ? (
            <>
              <div className="toolbar-select"><SearchableSelect value={draftTingkatan} onChange={setDraftTingkatan} options={tingkatanFilterOptions} /></div>
              <div className="toolbar-select"><SearchableSelect value={draftKelas} onChange={setDraftKelas} options={kelasFilterOptions} /></div>
            </>
          ) : (
            <div className="toolbar-select"><SearchableSelect value={draftGuru} onChange={setDraftGuru} options={teacherFilterOptions} /></div>
          )}
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <div className="export-actions">
            <button type="button" className="export-btn" disabled={filtered.length === 0} onClick={handleExportExcel}>
              <Icon path="M4 3h11l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM9 12l6 6M15 12l-6 6" />
              Excel
            </button>
            <button
              type="button"
              className="export-btn"
              disabled={printGridGroups.length === 0}
              onClick={handleExportGridPdf}
              title={mode === 'kelas' ? t('timetable.pdfHint') : t('timetable.pdfHintGuru')}
            >
              <Icon path="M4 3h11l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM8 17h1.5a1.5 1.5 0 000-3H8v5M13 14v5M13 16.5h2M17 14v5" />
              PDF
            </button>
          </div>
        </div>
        <h3 className="card-heading">{t('timetable.fullTimetable')} ({hasApplied ? filtered.length : 0})</h3>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('timetable.day')}</th>
                  <th>{t('timetable.time')}</th>
                  <th>{t('timetable.subject')}</th>
                  <th>{t('timetable.form')}</th>
                  <th>{t('timetable.className')}</th>
                  <th>{t('timetable.teacher')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={7} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filtered.length === 0 && (
                  <tr><td colSpan={7} className="muted">{t('common.noRecords')}</td></tr>
                )}
                {hasApplied && paginated.map((r) => (
                  <tr key={r.id}>
                    <td>{t(`timetable.day_${r.hari}`)}</td>
                    <td>{r.masa}</td>
                    <td>{r.matapelajaran}</td>
                    <td>{r.tingkatan}</td>
                    <td>{r.kelas}</td>
                    <td>{r.teacherName}</td>
                    <td>
                      {(isAdmin || r.teacherUid === user.uid) && (
                        <div className="table-actions">
                          <button className="table-icon-btn table-icon-btn-danger" onClick={() => setPendingDelete(r)} title={t('common.delete')} aria-label={t('common.delete')}>
                            <Icon path="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination page={safePage} pageSize={pageSize} totalItems={hasApplied ? filtered.length : 0} onPageChange={setPage} />
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={t('timetable.deleteConfirmTitle')}
        message={pendingDelete ? `${t(`timetable.day_${pendingDelete.hari}`)}, ${pendingDelete.masa} · ${pendingDelete.matapelajaran} (${pendingDelete.tingkatan} ${pendingDelete.kelas})` : ''}
        confirmLabel={t('common.delete')}
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
