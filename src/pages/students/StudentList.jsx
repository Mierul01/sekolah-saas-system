import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where, setDoc, serverTimestamp, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { FORMS, CLASSES } from '../../lib/constants'
import ConfirmModal from '../../components/ConfirmModal'
import SearchableSelect from '../../components/SearchableSelect'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import Pagination, { DEFAULT_PAGE_SIZE, PageSizeSelect } from '../../components/Pagination'

const emptyForm = {
  namaPenuh: '',
  noKP: '',
  tingkatan: '',
  kelas: '',
  jantina: 'Lelaki',
  namaPenjaga: '',
  noTelefonPenjaga: '',
}

function genderLabel(value, t) {
  return value === 'Lelaki' ? t('students.male') : value === 'Perempuan' ? t('students.female') : value
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function StudentList() {
  const { profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  // Draft values follow the controls as the user changes them; the applied
  // values are what the table actually filters by, and only catch up when
  // the Filter button is clicked.
  const [draftTingkatan, setDraftTingkatan] = useState('all')
  const [draftKelas, setDraftKelas] = useState('all')
  const [draftSearch, setDraftSearch] = useState('')
  const [filterTingkatan, setFilterTingkatan] = useState('all')
  const [filterKelas, setFilterKelas] = useState('all')
  const [search, setSearch] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  // The list starts empty on load — nothing displays until the user clicks
  // Filter at least once, even with the default "all" filters.
  const [hasApplied, setHasApplied] = useState(false)

  const genderOptions = [
    { value: 'Lelaki', label: t('students.male') },
    { value: 'Perempuan', label: t('students.female') },
  ]
  const tingkatanFilterOptions = [{ value: 'all', label: t('students.allForms') }, ...FORMS.map((f) => ({ value: f, label: f }))]
  const kelasFilterOptions = [{ value: 'all', label: t('students.allClasses') }, ...CLASSES.map((c) => ({ value: c, label: c }))]

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'students'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingStudents(false)
    })
    return () => unsub()
  }, [schoolId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit(student) {
    setEditingId(student.id)
    setForm({
      namaPenuh: student.namaPenuh || '',
      noKP: student.noKP || '',
      tingkatan: student.tingkatan || '',
      kelas: student.kelas || '',
      jantina: student.jantina || 'Lelaki',
      namaPenjaga: student.namaPenjaga || '',
      noTelefonPenjaga: student.noTelefonPenjaga || '',
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
    if (!form.namaPenuh || !form.tingkatan || !form.kelas) {
      setErrorMsg(t('students.fillRequired'))
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await setDoc(doc(db, 'students', editingId), { ...form, updatedAt: serverTimestamp() }, { merge: true })
      } else {
        await addDoc(collection(db, 'students'), { ...form, schoolId, createdAt: serverTimestamp() })
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch {
      setErrorMsg(t('students.failedSave'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteDoc(doc(db, 'students', pendingDelete.id))
    setPendingDelete(null)
  }

  const filtered = useMemo(() => {
    let list = students
    if (filterTingkatan !== 'all') list = list.filter((s) => s.tingkatan === filterTingkatan)
    if (filterKelas !== 'all') list = list.filter((s) => s.kelas === filterKelas)
    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (s) => s.namaPenuh?.toLowerCase().includes(term) || s.noKP?.includes(term)
      )
    }
    return [...list].sort((a, b) => (a.namaPenuh || '').localeCompare(b.namaPenuh || ''))
  }, [students, filterTingkatan, filterKelas, search])

  // Jump back to page 1 whenever the filters or page size change, adjusted
  // directly during render so a narrower filter never strands the view on a
  // now out-of-range page.
  const filterKey = `${filterTingkatan}|${filterKelas}|${search}|${pageSize}`
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

  function applyFilters() {
    setFilterTingkatan(draftTingkatan)
    setFilterKelas(draftKelas)
    setSearch(draftSearch)
    setHasApplied(true)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('students.title')}</h1>
        <p>{t('students.desc')}</p>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{editingId ? t('students.updateRecord') : t('students.addNew')}</h3>
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>{t('students.fullName')} *</label>
              <input type="text" value={form.namaPenuh} onChange={(e) => update('namaPenuh', e.target.value)} required />
            </div>
            <div className="field">
              <label>{t('students.icNumber')}</label>
              <input type="text" value={form.noKP} onChange={(e) => update('noKP', e.target.value)} placeholder={t('students.icPlaceholder')} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>{t('students.form')} *</label>
              <SearchableSelect value={form.tingkatan} onChange={(v) => update('tingkatan', v)} options={FORMS} />
            </div>
            <div className="field">
              <label>{t('students.className')} *</label>
              <SearchableSelect value={form.kelas} onChange={(v) => update('kelas', v)} options={CLASSES} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>{t('students.gender')}</label>
              <SearchableSelect value={form.jantina} onChange={(v) => update('jantina', v)} options={genderOptions} />
            </div>
            <div className="field">
              <label>{t('students.guardianName')}</label>
              <input type="text" value={form.namaPenjaga} onChange={(e) => update('namaPenjaga', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>{t('students.guardianPhone')}</label>
            <input type="tel" value={form.noTelefonPenjaga} onChange={(e) => update('noTelefonPenjaga', e.target.value)} placeholder={t('students.phonePlaceholder')} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? t('common.saving') : editingId ? t('students.updateBtn') : t('students.addBtn')}
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
          <div className="toolbar-select"><SearchableSelect value={draftTingkatan} onChange={setDraftTingkatan} options={tingkatanFilterOptions} /></div>
          <div className="toolbar-select"><SearchableSelect value={draftKelas} onChange={setDraftKelas} options={kelasFilterOptions} /></div>
          <input type="text" placeholder={t('students.searchPlaceholder')} value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} />
          <button type="button" className="btn-filter-apply" onClick={applyFilters}>
            {t('common.applyFilter')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-toolbar-top">
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={setPageSize} />
          <ExportButtons
            filename="senarai-pelajar"
            title={t('students.studentList')}
            headers={[t('students.colName'), t('students.colFormClass'), t('students.colGender'), t('students.colGuardian'), t('students.colPhone')]}
            rows={filtered.map((s) => [s.namaPenuh, `${s.tingkatan} ${s.kelas}`, genderLabel(s.jantina, t), s.namaPenjaga, s.noTelefonPenjaga])}
          />
        </div>
        <h3 className="card-heading">{t('students.studentList')} ({hasApplied ? filtered.length : 0})</h3>

        {loadingStudents ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('students.colName')}</th><th>{t('students.colFormClass')}</th><th>{t('students.colGender')}</th><th>{t('students.colGuardian')}</th><th>{t('students.colPhone')}</th><th></th></tr>
              </thead>
              <tbody>
                {!hasApplied && (
                  <tr><td colSpan={6} className="muted">{t('common.applyFilterPrompt')}</td></tr>
                )}
                {hasApplied && filtered.length === 0 && (
                  <tr><td colSpan={6} className="muted">{t('students.noRecords')}</td></tr>
                )}
                {hasApplied && paginated.map((s) => (
                  <tr key={s.id}>
                    <td>{s.namaPenuh}</td>
                    <td>{s.tingkatan} {s.kelas}</td>
                    <td>{genderLabel(s.jantina, t)}</td>
                    <td>{s.namaPenjaga}</td>
                    <td>{s.noTelefonPenjaga}</td>
                    <td>
                      <div className="table-actions">
                        <button className="table-icon-btn" onClick={() => startEdit(s)} title={t('common.edit')} aria-label={t('common.edit')}>
                          <Icon path="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </button>
                        <button className="table-icon-btn table-icon-btn-danger" onClick={() => setPendingDelete(s)} title={t('common.delete')} aria-label={t('common.delete')}>
                          <Icon path="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loadingStudents && (
          <Pagination page={safePage} pageSize={pageSize} totalItems={hasApplied ? filtered.length : 0} onPageChange={setPage} />
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={t('students.deleteConfirmTitle')}
        message={pendingDelete ? `${pendingDelete.namaPenuh} ${t('students.deleteConfirmSuffix')}` : ''}
        confirmLabel={t('common.delete')}
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
