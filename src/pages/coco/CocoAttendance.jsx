import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where, setDoc, serverTimestamp, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { COCO_CATEGORIES, COCO_CATEGORY_UNITS, COCO_ATTENDANCE_STATUS, OTHER_UNIT_VALUE, todayStr, formatDateLabel } from '../../lib/constants'
import SearchableSelect from '../../components/SearchableSelect'
import DatePicker from '../../components/DatePicker'
import ConfirmModal from '../../components/ConfirmModal'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'

const emptyForm = { tarikh: todayStr(), kategori: '', namaUnit: '', otherUnit: '', statusKehadiran: 'HADIR' }

function statusLabel(value) {
  return COCO_ATTENDANCE_STATUS.find((s) => s.value === value)?.label || value
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

// A dedicated attendance log for co-curriculum advisors — separate from the
// fuller weekly activity report (SubmitCoco.jsx) — with full CRUD, matching
// how a real "who supervised which unit, and were they there" record works:
// quick to add, and just as easy to correct or remove afterwards.
export default function CocoAttendance() {
  const { user, profile, isAdmin } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  // Draft values follow the controls as the user changes them; the applied
  // values are what the table actually filters by, and only catch up when
  // the Filter button is clicked.
  const [draftKategori, setDraftKategori] = useState('all')
  const [draftSearch, setDraftSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [hasApplied, setHasApplied] = useState(false)

  const categoryOptions = COCO_CATEGORIES
  const categoryFilterOptions = [{ value: 'all', label: t('coco.allCategories') }, ...COCO_CATEGORIES.map((c) => ({ value: c, label: c }))]
  // Rumah Sukan is a closed set of 4 houses — no "Others" escape hatch there,
  // unlike the other three categories whose real-form unit lists may be incomplete.
  const allowOtherUnit = form.kategori && form.kategori !== 'RUMAH SUKAN'
  const baseUnitOptions = form.kategori ? COCO_CATEGORY_UNITS[form.kategori] || [] : []
  const unitOptions = allowOtherUnit ? [...baseUnitOptions, { value: OTHER_UNIT_VALUE, label: t('cocoUnitReport.other') }] : baseUnitOptions

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'coco_attendance'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [schoolId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateKategori(value) {
    setForm((f) => ({ ...f, kategori: value, namaUnit: '', otherUnit: '' }))
  }

  function startEdit(record) {
    setEditingId(record.id)
    const knownUnits = COCO_CATEGORY_UNITS[record.kategori] || []
    const isKnownUnit = knownUnits.includes(record.namaUnit)
    setForm({
      tarikh: record.tarikh || todayStr(),
      kategori: record.kategori || '',
      namaUnit: isKnownUnit || !record.namaUnit ? record.namaUnit || '' : OTHER_UNIT_VALUE,
      otherUnit: isKnownUnit || !record.namaUnit ? '' : record.namaUnit,
      statusKehadiran: record.statusKehadiran || 'HADIR',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    const finalUnit = form.namaUnit === OTHER_UNIT_VALUE ? form.otherUnit.trim() : form.namaUnit
    if (!form.kategori || !finalUnit) {
      setErrorMsg(t('cocoAttendance.fillRequired'))
      return
    }
    setSubmitting(true)
    try {
      const record = { tarikh: form.tarikh, kategori: form.kategori, namaUnit: finalUnit, statusKehadiran: form.statusKehadiran }
      if (editingId) {
        await setDoc(doc(db, 'coco_attendance', editingId), { ...record, updatedAt: serverTimestamp() }, { merge: true })
      } else {
        await addDoc(collection(db, 'coco_attendance'), {
          teacherUid: user.uid,
          teacherName: profile?.name || user.email,
          schoolId,
          ...record,
          createdAt: serverTimestamp(),
        })
      }
      setSuccess(true)
      setForm(emptyForm)
      setEditingId(null)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setErrorMsg(t('common.failedRetry'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteDoc(doc(db, 'coco_attendance', pendingDelete.id))
    setPendingDelete(null)
  }

  function applyFilters() {
    setFilterKategori(draftKategori)
    setSearch(draftSearch)
    setHasApplied(true)
  }

  const filtered = useMemo(() => {
    let list = entries
    if (filterKategori !== 'all') list = list.filter((r) => r.kategori === filterKategori)
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (r) => r.teacherName?.toLowerCase().includes(term) || r.namaUnit?.toLowerCase().includes(term)
      )
    }
    return [...list].sort((a, b) => (b.tarikh || '').localeCompare(a.tarikh || ''))
  }, [entries, filterKategori, search])

  // Jump back to page 1 whenever the filters or page size change, adjusted
  // directly during render so a narrower filter never strands the view on a
  // now out-of-range page.
  const filterKey = `${filterKategori}|${search}|${pageSize}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  return (
    <div>
      <div className="page-head">
        <h1>{t('cocoAttendance.title')}</h1>
        <p>{t('cocoAttendance.desc')}</p>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{editingId ? t('cocoAttendance.updateTitle') : t('cocoAttendance.addTitle')}</h3>
        {success && <div className="alert alert-success">{t('cocoAttendance.success')}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>{t('common.date')} *</label>
              <DatePicker value={form.tarikh} onChange={(v) => update('tarikh', v)} />
            </div>
            <div className="field">
              <label>{t('coco.category')} *</label>
              <SearchableSelect value={form.kategori} onChange={updateKategori} options={categoryOptions} />
            </div>
          </div>
          {form.kategori && (
            <div className="field">
              <label>{t('coco.unitName')} *</label>
              <SearchableSelect value={form.namaUnit} onChange={(v) => update('namaUnit', v)} options={unitOptions} />
              {form.namaUnit === OTHER_UNIT_VALUE && (
                <input
                  type="text"
                  value={form.otherUnit}
                  onChange={(e) => update('otherUnit', e.target.value)}
                  placeholder={t('cocoUnitReport.otherUnitPlaceholder')}
                  required
                />
              )}
            </div>
          )}
          <div className="field">
            <label>{t('coco.advisorStatus')} *</label>
            <SearchableSelect value={form.statusKehadiran} onChange={(v) => update('statusKehadiran', v)} options={COCO_ATTENDANCE_STATUS} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? t('common.submitting') : editingId ? t('cocoAttendance.updateBtn') : t('cocoAttendance.addBtn')}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost-app" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('common.filterExport')}</h3>
        <div className="toolbar-controls">
          <div className="toolbar-select"><SearchableSelect value={draftKategori} onChange={setDraftKategori} options={categoryFilterOptions} /></div>
          <input type="text" placeholder={t('cocoAttendance.searchPlaceholder')} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <ExportButtons
            filename="kehadiran-kokurikulum"
            title={t('cocoAttendance.listTitle')}
            headers={[t('cocoAttendance.colDate'), t('cocoAttendance.colCategory'), t('cocoAttendance.colUnit'), t('cocoAttendance.colTeacher'), t('cocoAttendance.colStatus')]}
            rows={filtered.map((r) => [formatDateLabel(r.tarikh), r.kategori, r.namaUnit, r.teacherName, statusLabel(r.statusKehadiran)])}
          />
        </div>
        <h3 className="card-heading">{t('cocoAttendance.listTitle')} ({hasApplied ? filtered.length : 0})</h3>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('cocoAttendance.colDate')}</th>
                  <th>{t('cocoAttendance.colCategory')}</th>
                  <th>{t('cocoAttendance.colUnit')}</th>
                  <th>{t('cocoAttendance.colTeacher')}</th>
                  <th>{t('cocoAttendance.colStatus')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={6} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filtered.length === 0 && (
                  <tr><td colSpan={6} className="muted">{t('common.noRecords')}</td></tr>
                )}
                {hasApplied && paginated.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateLabel(r.tarikh)}</td>
                    <td>{r.kategori}</td>
                    <td>{r.namaUnit}</td>
                    <td>{r.teacherName}</td>
                    <td>{statusLabel(r.statusKehadiran)}</td>
                    <td>
                      {(isAdmin || r.teacherUid === user.uid) && (
                        <div className="table-actions">
                          <button className="table-icon-btn" onClick={() => startEdit(r)} title={t('common.edit')} aria-label={t('common.edit')}>
                            <Icon path="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </button>
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
        title={t('cocoAttendance.deleteConfirmTitle')}
        message={pendingDelete ? `${pendingDelete.namaUnit} · ${formatDateLabel(pendingDelete.tarikh)}` : ''}
        confirmLabel={t('common.delete')}
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
