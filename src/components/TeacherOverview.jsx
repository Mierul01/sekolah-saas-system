import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where, db } from '../lib/db'
import { todayStr } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { StatRowSkeleton } from './Skeleton'
import StatTile, { dailyCounts, lastDays } from './StatTile'

// The signed-in teacher's own last 7 days, one tile per module.
export default function TeacherOverview() {
  const { user, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t, language } = useLanguage()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const today = todayStr()
  const week = useMemo(() => lastDays(7), [today]) // eslint-disable-line react-hooks/exhaustive-deps
  const [data, setData] = useState({ erph: null, mmi: null, coco: null })
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!user || !schoolId) return
    const subs = ['erph', 'mmi', 'coco_reports'].map((name) => {
      const key = name === 'coco_reports' ? 'coco' : name
      const q = query(
        collection(db, name),
        where('teacherUid', '==', user.uid),
        where('schoolId', '==', schoolId),
        where('tarikh', 'in', week)
      )
      return onSnapshot(q, (snap) => {
        setData((d) => ({ ...d, [key]: snap.docs.map((doc) => doc.data()) }))
      }, () => setFailed(true))
    })
    return () => subs.forEach((unsub) => unsub())
  }, [user, schoolId, week])

  if (failed) return <div className="alert alert-error" role="alert">{t('adminOverview.loadError')}</div>
  if (!data.erph || !data.mmi || !data.coco) return <StatRowSkeleton count={3} />

  const erphTrend = dailyCounts(data.erph, 7, locale)
  const mmiTrend = dailyCounts(data.mmi, 7, locale)
  const cocoTrend = dailyCounts(data.coco, 7, locale)
  const erphToday = erphTrend[erphTrend.length - 1].value
  const mmiToday = mmiTrend[mmiTrend.length - 1].value
  const cocoStudents = data.coco.reduce((sum, r) => sum + (Number(r.kehadiranPelajar) || 0), 0)

  return (
    <div className="tile-row">
      <StatTile
        tone="blue" icon="doc" label={t('home.weekErph')} value={data.erph.length} spark={erphTrend}
        note={erphToday > 0 ? t('home.tileErphToday') : t('home.tileErphPending')}
      />
      <StatTile
        tone="gold" icon="clock" label={t('home.weekMmi')} value={data.mmi.length} spark={mmiTrend}
        note={t('home.tileMmiToday', { n: mmiToday })}
      />
      <StatTile
        tone="teal" icon="award" label={t('home.weekCoco')} value={data.coco.length} spark={cocoTrend}
        note={t('adminOverview.cocoStudents', { n: cocoStudents })}
      />
    </div>
  )
}
