import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, doc, setDoc, serverTimestamp, db } from '../../lib/db'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const DEPARTMENTS = [
  { name: 'Bahasa', subjects: ['Bahasa Melayu', 'Bahasa Inggeris', 'Bahasa Arab', 'Bahasa Antarabangsa'] },
  { name: 'STEM', subjects: ['Sains Teras', 'Matematik', 'Matematik Tambahan', 'Fizik', 'Kimia', 'Biologi', 'DLP'] },
  { name: 'Agama & Tahfiz', subjects: ['Pendidikan Islam', 'Syariah (PSI)', 'Al-Quran (PQS)', 'Hifz Al-Quran', 'Maharat Al-Quran'] },
  { name: 'Kemanusiaan & Teknikal', subjects: ['Sejarah', 'Geografi', 'PJK', 'PSV', 'RBT', 'GKT', 'Prinsip Perakaunan'] },
]

function getKpmSystems(t) {
  return [
    { name: 'e-Operasi', desc: t('curriculum.kpm1') },
    { name: 'HRMIS', desc: t('curriculum.kpm2') },
    { name: 'IDME', desc: t('curriculum.kpm3') },
  ]
}

function slug(dept, subject) {
  return `${dept}-${subject}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export default function Curriculum() {
  const { isAdmin, profile } = useAuth()
  const schoolId = profile?.schoolId
  const { t } = useLanguage()
  const [links, setLinks] = useState({})
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const kpmSystems = getKpmSystems(t)

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'curriculum_links'), where('schoolId', '==', schoolId))
    const unsub = onSnapshot(q, (snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.id] = d.data() })
      setLinks(map)
    })
    return () => unsub()
  }, [schoolId])

  function startEdit(key, currentUrl) {
    setEditingKey(key)
    setEditValue(currentUrl || '')
  }

  async function saveLink(key, department, subject) {
    await setDoc(doc(db, 'curriculum_links', key), {
      department,
      subject,
      schoolId,
      url: editValue.trim(),
      updatedAt: serverTimestamp(),
    })
    setEditingKey(null)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('curriculum.title')}</h1>
        <p>{t('curriculum.desc')}</p>
      </div>

      {DEPARTMENTS.map((dept) => (
        <div className="content-card" key={dept.name}>
          <h3 className="card-heading">{dept.name}</h3>
          <div className="curriculum-grid">
            {dept.subjects.map((subject) => {
              const key = slug(dept.name, subject)
              const link = links[key]
              const isEditing = editingKey === key
              return (
                <div className="curriculum-item" key={key}>
                  <span>{subject}</span>
                  {isEditing ? (
                    <div className="curriculum-edit">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={t('curriculum.linkPlaceholder')}
                        autoFocus
                      />
                      <button className="link-edit-btn" onClick={() => saveLink(key, dept.name, subject)}>{t('curriculum.save')}</button>
                    </div>
                  ) : link?.url ? (
                    <div className="curriculum-actions">
                      <a href={link.url} target="_blank" rel="noreferrer" className="card-link">{t('curriculum.openFolder')}</a>
                      {isAdmin && <button className="link-edit-btn" onClick={() => startEdit(key, link.url)}>{t('common.edit')}</button>}
                    </div>
                  ) : isAdmin ? (
                    <button className="link-edit-btn" onClick={() => startEdit(key, '')}>{t('curriculum.setLink')}</button>
                  ) : (
                    <span className="muted-inline">{t('curriculum.notSet')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="content-card">
        <h3 className="card-heading">{t('curriculum.kpmSystems')}</h3>
        <div className="kpm-grid">
          {kpmSystems.map((sys) => (
            <div className="kpm-card" key={sys.name}>
              <strong>{sys.name}</strong>
              <span>{sys.desc}</span>
            </div>
          ))}
        </div>
        <p className="form-note" style={{ marginTop: 14 }}>
          {t('curriculum.kpmNote')}
        </p>
      </div>
    </div>
  )
}
