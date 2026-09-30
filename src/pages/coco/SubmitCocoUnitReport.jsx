import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { PERJUMPAAN_NUMBERS, OTHER_UNIT_VALUE, todayStr, formatDateLabel } from '../../lib/constants'
import { compressImageFile } from '../../lib/imageUpload'
import SearchableSelect from '../../components/SearchableSelect'
import DatePicker from '../../components/DatePicker'
import { TableSkeleton } from '../../components/Skeleton'
import PhotoViewerModal from '../../components/PhotoViewerModal'

const MAX_PHOTOS = 5

const emptyFields = { perjumpaan: '', tarikhPerjumpaan: todayStr(), tempat: '', tajuk: '', aktiviti: '', namaUnit: '', otherUnit: '', rumusan: '' }

// Shared shape behind all four co-curriculum categories' meeting-report
// forms — they turned out to be field-for-field identical on the real
// Google Forms, only the unit dropdown's options (and category label)
// differ, so one parameterized page replaces four near-duplicate ones.
export default function SubmitCocoUnitReport({ category, categoryLabel, units, allowOtherUnit = true }) {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const unitOptions = allowOtherUnit ? [...units, { value: OTHER_UNIT_VALUE, label: t('cocoUnitReport.other') }] : units
  const [fields, setFields] = useState(emptyFields)
  // A meeting can have more than one advisor teacher present — start with
  // one row (pre-filled with the submitter's own name) and let more be
  // added, since sessions are often co-supervised.
  const [guruList, setGuruList] = useState([profile?.name || ''])
  const [photos, setPhotos] = useState([])
  const [compressing, setCompressing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [myRecords, setMyRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [viewingPhotos, setViewingPhotos] = useState(null)

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(collection(db, 'coco_reports'), where('teacherUid', '==', user.uid), where('schoolId', '==', schoolId), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mine = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.kategori === category)
      setMyRecords(mine.slice(0, 12))
      setLoadingRecords(false)
    })
    return () => unsub()
  }, [user, category, schoolId])

  function update(field, value) {
    setFields((f) => ({ ...f, [field]: value }))
  }

  function updateGuru(index, value) {
    setGuruList((list) => list.map((g, i) => (i === index ? value : g)))
  }

  function addGuru() {
    setGuruList((list) => [...list, ''])
  }

  function removeGuru(index) {
    setGuruList((list) => list.filter((_, i) => i !== index))
  }

  async function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setErrorMsg(t('cocoUnitReport.tooManyPhotos', { max: MAX_PHOTOS }))
      return
    }
    setCompressing(true)
    try {
      const toAdd = await Promise.all(files.slice(0, room).map((f) => compressImageFile(f)))
      setPhotos((p) => [...p, ...toAdd])
    } catch {
      setErrorMsg(t('cocoUnitReport.uploadFailed'))
    } finally {
      setCompressing(false)
    }
  }

  function removePhoto(index) {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    const guruPembimbing = guruList.map((g) => g.trim()).filter(Boolean)
    const finalUnit = fields.namaUnit === OTHER_UNIT_VALUE ? fields.otherUnit.trim() : fields.namaUnit
    if (!fields.perjumpaan || !fields.tarikhPerjumpaan || !fields.tempat || !fields.tajuk || !fields.aktiviti || !finalUnit || !fields.rumusan || guruPembimbing.length === 0) {
      setErrorMsg(t('common.fillRequired'))
      return
    }
    if (photos.length === 0) {
      setErrorMsg(t('cocoUnitReport.photosRequired'))
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'coco_reports'), {
        teacherUid: user.uid,
        teacherName: profile?.name || user.email,
        schoolId,
        tarikh: fields.tarikhPerjumpaan,
        kategori: category,
        perjumpaan: fields.perjumpaan,
        tempat: fields.tempat,
        namaUnit: finalUnit,
        tajuk: fields.tajuk,
        aktiviti: fields.aktiviti,
        rumusan: fields.rumusan,
        guruPembimbing,
        gambar: photos,
        statusKehadiran: 'HADIR',
        createdAt: serverTimestamp(),
      })
      notify({ toRole: 'admin', kind: 'coco_submitted', teacherName: profile?.name || user.email, link: '/app/kokurikulum/dashboard' })
      setSuccess(true)
      setFields({ ...emptyFields, tarikhPerjumpaan: todayStr() })
      setGuruList([profile?.name || ''])
      setPhotos([])
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
        <h1>{t('cocoUnitReport.title', { category: categoryLabel })}</h1>
        <p>{t('cocoUnitReport.desc')}</p>
      </div>

      <div className="content-card">
        {success && <div className="alert alert-success">{t('cocoUnitReport.success', { category: categoryLabel })}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('cocoUnitReport.perjumpaan')} *</label>
            <SearchableSelect value={fields.perjumpaan} onChange={(v) => update('perjumpaan', v)} options={PERJUMPAAN_NUMBERS} />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.tarikhPerjumpaan')} *</label>
            <DatePicker value={fields.tarikhPerjumpaan} onChange={(v) => update('tarikhPerjumpaan', v)} />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.tempat')} *</label>
            <input type="text" value={fields.tempat} onChange={(e) => update('tempat', e.target.value)} required />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.tajuk')} *</label>
            <input type="text" value={fields.tajuk} onChange={(e) => update('tajuk', e.target.value)} required />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.aktiviti')} *</label>
            <input type="text" value={fields.aktiviti} onChange={(e) => update('aktiviti', e.target.value)} required />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.unit')} *</label>
            <SearchableSelect value={fields.namaUnit} onChange={(v) => update('namaUnit', v)} options={unitOptions} />
            {fields.namaUnit === OTHER_UNIT_VALUE && (
              <input
                type="text"
                value={fields.otherUnit}
                onChange={(e) => update('otherUnit', e.target.value)}
                placeholder={t('cocoUnitReport.otherUnitPlaceholder')}
                required
              />
            )}
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.rumusan')} *</label>
            <textarea rows={3} value={fields.rumusan} onChange={(e) => update('rumusan', e.target.value)} required />
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.guruPembimbing')} *</label>
            {guruList.map((guru, i) => (
              <div className="dynamic-input-row" key={i}>
                <input type="text" value={guru} onChange={(e) => updateGuru(i, e.target.value)} required />
                {guruList.length > 1 && (
                  <button type="button" className="photo-preview-remove" onClick={() => removeGuru(i)} aria-label={t('common.delete')}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-add-row" onClick={addGuru}>{t('cocoUnitReport.addGuru')}</button>
          </div>

          <div className="field">
            <label>{t('cocoUnitReport.uploadPhotos')} *</label>
            <p className="form-note">{t('cocoUnitReport.uploadHint', { max: MAX_PHOTOS })}</p>
            {photos.length < MAX_PHOTOS && (
              <label className="photo-upload-input">
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} disabled={compressing} />
                {compressing ? t('cocoUnitReport.processing') : t('cocoUnitReport.addFile')}
              </label>
            )}
            {photos.length > 0 && (
              <div className="photo-preview-strip">
                {photos.map((src, i) => (
                  <div className="photo-preview-item" key={i}>
                    <img src={src} alt={`Preview ${i + 1}`} />
                    <button type="button" className="photo-preview-remove" onClick={() => removePhoto(i)} aria-label={t('common.delete')}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn-submit" type="submit" disabled={submitting || compressing}>
            {submitting ? t('common.submitting') : t('coco.submitBtn')}
          </button>
        </form>
      </div>

      <div className="content-card">
        <h3 className="card-heading">{t('coco.myRecent')}</h3>
        {loadingRecords ? (
          <TableSkeleton rows={5} cols={4} />
        ) : myRecords.length === 0 ? (
          <p className="muted">{t('coco.noneYet')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('coco.colDate')}</th>
                  <th>{t('cocoUnitReport.perjumpaan')}</th>
                  <th>{t('cocoUnitReport.tempat')}</th>
                  <th>{t('cocoUnitReport.unit')}</th>
                  <th>{t('cocoUnitReport.tajuk')}</th>
                  <th>{t('cocoUnitReport.guruPembimbing')}</th>
                  <th>{t('cocoUnitReport.photos')}</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateLabel(r.tarikh)}</td>
                    <td>{r.perjumpaan}</td>
                    <td>{r.tempat}</td>
                    <td>{r.namaUnit}</td>
                    <td>{r.tajuk}</td>
                    <td>{Array.isArray(r.guruPembimbing) ? r.guruPembimbing.join(', ') : r.guruPembimbing}</td>
                    <td>
                      <button type="button" className="photo-count-btn" onClick={() => setViewingPhotos(r)}>
                        {t('cocoUnitReport.viewPhotos', { count: r.gambar?.length || 0 })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PhotoViewerModal
        open={Boolean(viewingPhotos)}
        title={viewingPhotos?.tajuk || ''}
        photos={viewingPhotos?.gambar || []}
        onClose={() => setViewingPhotos(null)}
      />
    </div>
  )
}
