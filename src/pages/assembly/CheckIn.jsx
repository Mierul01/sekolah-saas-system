import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { JAWATAN_LIST, ASSEMBLY_STATUSES, todayStr, formatDateLabel } from '../../lib/constants'
import SearchableSelect from '../../components/SearchableSelect'

export default function CheckIn() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const today = todayStr()
  const [session, setSession] = useState(undefined)
  const [myCheckin, setMyCheckin] = useState(undefined)
  const [jawatan, setJawatan] = useState('GURU')
  const [status, setStatus] = useState('HADIR')
  const [kod, setKod] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
      setSession(snap.exists() ? snap.data() : null)
    })
    return () => unsub()
  }, [today])

  useEffect(() => {
    if (!user || !schoolId) return
    const q = query(
      collection(db, 'assembly_checkins'),
      where('sessionId', '==', today),
      where('teacherUid', '==', user.uid),
      where('schoolId', '==', schoolId)
    )
    getDocs(q).then((snap) => {
      setMyCheckin(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    })
  }, [user, today, schoolId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    if (!session) return
    if (kod.trim().toUpperCase() !== String(session.code).toUpperCase()) {
      setErrorMsg(t('assembly.wrongCode'))
      return
    }
    setSubmitting(true)
    try {
      const newDoc = {
        sessionId: today,
        teacherUid: user.uid,
        teacherName: profile?.name || user.email,
        schoolId,
        jawatan,
        status,
        checkedAt: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'assembly_checkins'), newDoc)
      setMyCheckin({ id: ref.id, ...newDoc })
    } catch {
      setErrorMsg(t('common.failedRetry'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      <div className="page-head">
        <h1>{t('assembly.checkinTitle')}</h1>
        <p>{t('assembly.checkinSubtitle')} &middot; {formatDateLabel(today)}</p>
      </div>

      <div className="content-card">
        {session === undefined && <p className="muted">{t('common.loading')}</p>}

        {session === null && (
          <div className="alert alert-warning">{t('assembly.noActiveSession')}</div>
        )}

        {session && myCheckin === undefined && <p className="muted">{t('assembly.loadingStatus')}</p>}

        {session && myCheckin && (
          <div className="alert alert-success">
            {t('assembly.alreadyCheckedIn')} <strong>{myCheckin.status.replace(/_/g, ' ')}</strong> ({myCheckin.jawatan}).
          </div>
        )}

        {session && myCheckin === null && (
          <form onSubmit={handleSubmit}>
            {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
            <div className="field">
              <label>{t('assembly.position')} *</label>
              <SearchableSelect value={jawatan} onChange={setJawatan} options={JAWATAN_LIST} />
            </div>
            <div className="field">
              <label>{t('assembly.status')} *</label>
              <SearchableSelect value={status} onChange={setStatus} options={ASSEMBLY_STATUSES} />
            </div>
            <div className="field">
              <label>{t('assembly.code')} *</label>
              <input
                type="text"
                value={kod}
                onChange={(e) => setKod(e.target.value)}
                placeholder={t('assembly.codePlaceholder')}
                required
              />
              <p className="form-note">{t('assembly.codeHint')}</p>
            </div>
            <button className="btn-submit" type="submit" disabled={submitting}>
              {submitting ? t('common.submitting') : t('assembly.checkinBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
