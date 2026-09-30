import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { SUBJECTS, FORMS, CLASSES, TIME_SLOTS, todayStr, formatDateLabel } from '../../lib/constants'
import SearchableSelect from '../../components/SearchableSelect'
import DatePicker from '../../components/DatePicker'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'

export default function SubmitMMI() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const [form, setForm] = useState({
    tarikh: todayStr(),
    matapelajaran: '',
    tingkatan: '',
    kelas: '',
    masa: '',
    kehadiranPelajar: '',
    catatan: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [myRecords, setMyRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'mmi'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setMyRecords(snap.docs.slice(0, 12).map((d) => ({ id: d.id, ...d.data() })))
      setLoadingRecords(false)
    })
    return () => unsub()
  }, [user, schoolId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    if (!form.matapelajaran || !form.tingkatan || !form.kelas || !form.masa || form.kehadiranPelajar === '') {
      setErrorMsg(t('common.fillRequired'))
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'mmi'), {
        teacherUid: user.uid,
        teacherName: profile?.name || user.email,
        schoolId,
        tarikh: form.tarikh,
        matapelajaran: form.matapelajaran,
        tingkatan: form.tingkatan,
        kelas: form.kelas,
        masa: form.masa,
        kehadiranPelajar: Number(form.kehadiranPelajar),
        catatan: form.catatan,
        createdAt: serverTimestamp(),
      })
      notify({ toRole: 'admin', kind: 'mmi_submitted', teacherName: profile?.name || user.email, link: '/app/mmi/dashboard' })
      setSuccess(true)
      setForm((f) => ({ ...f, masa: '', kehadiranPelajar: '', catatan: '' }))
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setErrorMsg(t('common.failedRetry'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page form-page-grid">
      <div className="page-head">
        <h1>{t('mmi.submitTitle')}</h1>
        <p>{t('mmi.submitDesc')}</p>
      </div>

      <div className="content-card">
        {success && <div className="alert alert-success">{t('mmi.success')}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>{t('common.date')} *</label>
              <DatePicker value={form.tarikh} onChange={(v) => update('tarikh', v)} />
            </div>
            <div className="field">
              <label>{t('mmi.time')} *</label>
              <SearchableSelect value={form.masa} onChange={(v) => update('masa', v)} options={TIME_SLOTS} />
            </div>
          </div>

          <div className="field">
            <label>{t('mmi.subject')} *</label>
            <SearchableSelect value={form.matapelajaran} onChange={(v) => update('matapelajaran', v)} options={SUBJECTS} />
          </div>

          <div className="form-row">
            <div className="field">
              <label>{t('mmi.form')} *</label>
              <SearchableSelect value={form.tingkatan} onChange={(v) => update('tingkatan', v)} options={FORMS} />
            </div>
            <div className="field">
              <label>{t('mmi.className')} *</label>
              <SearchableSelect value={form.kelas} onChange={(v) => update('kelas', v)} options={CLASSES} />
            </div>
          </div>

          <div className="field">
            <label>{t('mmi.attendance')} *</label>
            <input type="number" min="0" value={form.kehadiranPelajar} onChange={(e) => update('kehadiranPelajar', e.target.value)} placeholder={t('mmi.attendancePlaceholder')} required />
          </div>

          <div className="field">
            <label>{t('mmi.notes')}</label>
            <textarea rows={3} value={form.catatan} onChange={(e) => update('catatan', e.target.value)} placeholder={t('mmi.notesPlaceholder')} />
          </div>

          <button className="btn-submit" type="submit" disabled={submitting}>
            {submitting ? t('common.submitting') : t('mmi.submitBtn')}
          </button>
        </form>
      </div>

      <div className="content-card">
        <div className="card-heading-row">
          <h3 className="card-heading">{t('mmi.myRecent')}</h3>
          <ExportButtons
            filename="rekod-mmi-saya"
            title={t('mmi.myRecent')}
            headers={[t('mmi.colDate'), t('mmi.colTime'), t('mmi.colSubject'), t('mmi.colClass'), t('mmi.colAttendance')]}
            rows={myRecords.map((r) => [formatDateLabel(r.tarikh), r.masa, r.matapelajaran, `${r.tingkatan} ${r.kelas}`, r.kehadiranPelajar])}
          />
        </div>
        {loadingRecords ? (
          <TableSkeleton rows={5} cols={5} />
        ) : myRecords.length === 0 ? (
          <p className="muted">{t('mmi.noneSubmittedYet')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('mmi.colDate')}</th><th>{t('mmi.colTime')}</th><th>{t('mmi.colSubject')}</th><th>{t('mmi.colClass')}</th><th>{t('mmi.colAttendance')}</th></tr>
              </thead>
              <tbody>
                {myRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateLabel(r.tarikh)}</td>
                    <td>{r.masa}</td>
                    <td>{r.matapelajaran}</td>
                    <td>{r.tingkatan} {r.kelas}</td>
                    <td>{r.kehadiranPelajar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
