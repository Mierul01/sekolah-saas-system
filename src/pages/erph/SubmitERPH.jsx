import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { SUBJECTS, FORMS, CLASSES, todayStr, formatDateLabel } from '../../lib/constants'
import SearchableSelect from '../../components/SearchableSelect'
import DatePicker from '../../components/DatePicker'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'

export default function SubmitERPH() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const [form, setForm] = useState({
    tarikh: todayStr(),
    matapelajaran: '',
    tingkatan: '',
    kelas: '',
    tajuk: '',
    catatan: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [myRecords, setMyRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'erph'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), orderBy('createdAt', 'desc'))
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
    if (!form.matapelajaran || !form.tingkatan || !form.kelas || !form.tajuk) {
      setErrorMsg(t('common.fillRequired'))
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'erph'), {
        teacherUid: user.uid,
        teacherName: profile?.name || user.email,
        schoolId,
        tarikh: form.tarikh,
        matapelajaran: form.matapelajaran,
        tingkatan: form.tingkatan,
        kelas: form.kelas,
        tajuk: form.tajuk,
        catatan: form.catatan,
        createdAt: serverTimestamp(),
      })
      notify({ toRole: 'admin', kind: 'erph_submitted', teacherName: profile?.name || user.email, link: '/app/erph/dashboard' })
      setSuccess(true)
      setForm((f) => ({ ...f, tajuk: '', catatan: '' }))
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
        <h1>{t('erph.submitTitle')}</h1>
        <p>{t('erph.submitDesc')}</p>
      </div>

      <div className="content-card">
        {success && <div className="alert alert-success">{t('erph.success')}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>{t('common.date')} *</label>
              <DatePicker value={form.tarikh} onChange={(v) => update('tarikh', v)} />
            </div>
            <div className="field">
              <label>{t('erph.subject')} *</label>
              <SearchableSelect value={form.matapelajaran} onChange={(v) => update('matapelajaran', v)} options={SUBJECTS} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>{t('erph.form')} *</label>
              <SearchableSelect value={form.tingkatan} onChange={(v) => update('tingkatan', v)} options={FORMS} />
            </div>
            <div className="field">
              <label>{t('erph.className')} *</label>
              <SearchableSelect value={form.kelas} onChange={(v) => update('kelas', v)} options={CLASSES} />
            </div>
          </div>

          <div className="field">
            <label>{t('erph.topic')} *</label>
            <input type="text" value={form.tajuk} onChange={(e) => update('tajuk', e.target.value)} placeholder={t('erph.topicPlaceholder')} required />
          </div>

          <div className="field">
            <label>{t('erph.notes')}</label>
            <textarea rows={3} value={form.catatan} onChange={(e) => update('catatan', e.target.value)} placeholder={t('erph.notesPlaceholder')} />
          </div>

          <button className="btn-submit" type="submit" disabled={submitting}>
            {submitting ? t('common.submitting') : t('erph.submitBtn')}
          </button>
        </form>
      </div>

      <div className="content-card">
        <div className="card-heading-row">
          <h3 className="card-heading">{t('erph.myRecent')}</h3>
          <ExportButtons
            filename="rekod-erph-saya"
            title={t('erph.myRecent')}
            headers={[t('erph.colDate'), t('erph.colSubject'), t('erph.colClass'), t('erph.colTopic')]}
            rows={myRecords.map((r) => [formatDateLabel(r.tarikh), r.matapelajaran, `${r.tingkatan} ${r.kelas}`, r.tajuk])}
          />
        </div>
        {loadingRecords ? (
          <TableSkeleton rows={5} cols={4} />
        ) : myRecords.length === 0 ? (
          <p className="muted">{t('erph.noneSubmittedYet')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('erph.colDate')}</th><th>{t('erph.colSubject')}</th><th>{t('erph.colClass')}</th><th>{t('erph.colTopic')}</th></tr>
              </thead>
              <tbody>
                {myRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateLabel(r.tarikh)}</td>
                    <td>{r.matapelajaran}</td>
                    <td>{r.tingkatan} {r.kelas}</td>
                    <td>{r.tajuk}</td>
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
