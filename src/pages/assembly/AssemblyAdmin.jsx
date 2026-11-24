import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { ASSEMBLY_STATUSES, todayStr, formatDateLabel } from '../../lib/constants'
import ConfirmModal from '../../components/ConfirmModal'
import { TableSkeleton } from '../../components/Skeleton'
import ExportButtons from '../../components/ExportButtons'
import StatTile from '../../components/StatTile'

// Same colours the status emoji in ASSEMBLY_STATUSES stand for.
const STATUS_TONES = { HADIR: 'green', BERTUGAS: 'gold', KURSUS_TUGAS_RASMI: 'blue', CUTI_MC: 'red' }

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function AssemblyAdmin() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const today = todayStr()
  const [session, setSession] = useState(undefined)
  const [checkins, setCheckins] = useState([])
  const [teachers, setTeachers] = useState([])
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [loadingCheckins, setLoadingCheckins] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'assembly_sessions', today), (snap) => {
      setSession(snap.exists() ? snap.data() : null)
    })
    return () => unsub()
  }, [today])

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'assembly_checkins'), where('sessionId', '==', today), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingCheckins(false)
    })
    return () => unsub()
  }, [today, schoolId])

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'users'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [schoolId])

  async function generateSession() {
    await setDoc(doc(db, 'assembly_sessions', today), {
      code: generateCode(),
      active: true,
      createdBy: user.uid,
      schoolId,
      createdAt: serverTimestamp(),
    })
    notify({ toRole: 'guru', kind: 'assembly_code', link: '/app/perhimpunan' })
  }

  async function endSession() {
    setConfirmEnd(false)
    await setDoc(doc(db, 'assembly_sessions', today), { ...session, active: false }, { merge: true })
    notify({ toRole: 'guru', kind: 'assembly_ended', link: '/app/perhimpunan' })
  }

  const statusCounts = useMemo(() => {
    const counts = {}
    ASSEMBLY_STATUSES.forEach((s) => { counts[s.value] = 0 })
    checkins.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
    return counts
  }, [checkins])

  return (
    <div>
      <div className="page-head">
        <h1>{t('assembly.adminTitle')}</h1>
        <p>{t('assembly.adminDesc')}</p>
      </div>

      <div className="content-card code-card">
        {session === undefined && <p className="muted">{t('common.loading')}</p>}

        {session && session.active ? (
          <>
            <span className="code-label">{t('assembly.codeLabel')} ({formatDateLabel(today)})</span>
            <div className="code-display">{session.code}</div>
            <div className="code-actions">
              <button className="btn-ghost-app" onClick={generateSession}>{t('assembly.regenerate')}</button>
              <button className="btn-danger-app" onClick={() => setConfirmEnd(true)}>{t('assembly.endSession')}</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              {session === null ? t('assembly.noSessionToday') : t('assembly.sessionEnded')}
            </p>
            <button className="btn-submit" onClick={generateSession}>{t('assembly.generateToday')}</button>
          </>
        )}
      </div>

      <div className="tile-row">
        <StatTile tone="navy" icon="users" label={t('assembly.totalStaff')} value={teachers.length} bar={1} />
        <StatTile
          tone="purple" icon="flag" label={t('assembly.checkedIn')} value={checkins.length}
          suffix={`/${teachers.length}`} bar={teachers.length ? checkins.length / teachers.length : 0}
        />
        {ASSEMBLY_STATUSES.map((s) => (
          <StatTile
            key={s.value} tone={STATUS_TONES[s.value] || 'blue'} icon={s.value === 'CUTI_MC' ? 'alert' : 'check'}
            label={s.label.replace(/^\S+\s+/, '')} value={statusCounts[s.value]}
            bar={checkins.length ? statusCounts[s.value] / checkins.length : 0}
          />
        ))}
      </div>

      <div className="content-card">
        <div className="card-heading-row">
          <h3 className="card-heading">{t('assembly.checkinList')} ({formatDateLabel(today)})</h3>
          <ExportButtons
            filename={`perhimpunan-${today}`}
            title={`${t('assembly.checkinList')} · ${formatDateLabel(today)}`}
            headers={[t('assembly.colName'), t('assembly.colPosition'), t('assembly.colStatus')]}
            rows={checkins.map((c) => [c.teacherName, c.jawatan, ASSEMBLY_STATUSES.find((s) => s.value === c.status)?.label || c.status])}
          />
        </div>
        {loadingCheckins ? (
          <TableSkeleton rows={5} cols={3} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t('assembly.colName')}</th><th>{t('assembly.colPosition')}</th><th>{t('assembly.colStatus')}</th></tr>
              </thead>
              <tbody>
                {checkins.length === 0 && (
                  <tr><td colSpan={3} className="muted">{t('assembly.noneYet')}</td></tr>
                )}
                {checkins.map((c) => (
                  <tr key={c.id}>
                    <td>{c.teacherName}</td>
                    <td>{c.jawatan}</td>
                    <td>{ASSEMBLY_STATUSES.find((s) => s.value === c.status)?.label || c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmEnd}
        title={t('assembly.endConfirmTitle')}
        message={t('assembly.endConfirmMsg')}
        confirmLabel={t('assembly.endSession')}
        tone="warning"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={endSession}
      />
    </div>
  )
}
