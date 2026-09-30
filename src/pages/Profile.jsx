import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { firebaseReady } from '../lib/firebase'
import { compressImageFile } from '../lib/imageUpload'
import { runProductionSeed } from '../lib/seedProduction'
import { JAWATAN_LIST, SUBJECTS, FORMS, CLASSES } from '../lib/constants'
import SearchableSelect from '../components/SearchableSelect'
import DatePicker from '../components/DatePicker'
import ConfirmModal from '../components/ConfirmModal'

const CLASS_OPTIONS = FORMS.flatMap((f) => CLASSES.map((c) => `${f} ${c}`))

function getGenderOptions(t) {
  return [
    { value: 'lelaki', label: t('profile.genderMale') },
    { value: 'perempuan', label: t('profile.genderFemale') },
  ]
}

function getEmploymentOptions(t) {
  return [
    { value: 'sepenuh-masa', label: t('profile.employmentFullTime') },
    { value: 'separuh-masa', label: t('profile.employmentPartTime') },
    { value: 'kontrak', label: t('profile.employmentContract') },
  ]
}

function getStatusOptions(t) {
  return [
    { value: 'aktif', label: t('profile.statusActive') },
    { value: 'tidak-aktif', label: t('profile.statusInactive') },
  ]
}

function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label || ''
}

function DetailItem({ label, value }) {
  return (
    <div className="profile-field-item">
      <label>{label}</label>
      <p>{value}</p>
    </div>
  )
}

function DetailBlock({ label, children }) {
  return (
    <div className="profile-field-item profile-field-item-wide">
      <label>{label}</label>
      <div className="profile-field-value">{children}</div>
    </div>
  )
}

function formatTimestamp(ts, locale) {
  if (!ts) return null
  const date = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : null
  if (!date) return null
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

// A picked-from-a-list multi-value field (subjects taught, classes assigned)
// — pick one from the dropdown, it becomes a removable chip, already-picked
// values drop out of the dropdown so nothing gets added twice.
function MultiSelectField({ label, options, values, onChange, addLabel, pickPlaceholder }) {
  const [draft, setDraft] = useState('')
  const available = options.filter((o) => !values.includes(o))

  function addValue() {
    if (draft && !values.includes(draft)) {
      onChange([...values, draft])
      setDraft('')
    }
  }

  function removeValue(v) {
    onChange(values.filter((x) => x !== v))
  }

  return (
    <div className="field">
      <label>{label}</label>
      {values.length > 0 && (
        <div className="profile-chip-list">
          {values.map((v) => (
            <span className="profile-chip" key={v}>
              {v}
              <button type="button" onClick={() => removeValue(v)} aria-label="Remove">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="dynamic-input-row">
        <SearchableSelect value={draft} onChange={setDraft} options={available} placeholder={pickPlaceholder} />
        <button type="button" className="btn-add-row" onClick={addValue} disabled={!draft}>{addLabel}</button>
      </div>
    </div>
  )
}

const emptyDraft = {
  name: '', phone: '', gender: '', dob: '', staffId: '', position: '', department: '',
  employmentType: '', dateJoined: '', qualifications: '', status: 'aktif', subjects: [], classes: [],
}

function draftFromProfile(profile) {
  return {
    name: profile?.name || '',
    phone: profile?.phone || '',
    gender: profile?.gender || '',
    dob: profile?.dob || '',
    staffId: profile?.staffId || '',
    position: profile?.position || '',
    department: profile?.department || '',
    employmentType: profile?.employmentType || '',
    dateJoined: profile?.dateJoined || '',
    qualifications: profile?.qualifications || '',
    status: profile?.status || 'aktif',
    subjects: profile?.subjects || [],
    classes: profile?.classes || [],
  }
}

export default function Profile() {
  const { user, profile, isAdmin, isDeveloper, systemLocked, lockMessage, setSystemLock, updateProfile, changePasswordWithReauth, deleteAccount } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'

  // Google-only accounts have no password to change here; email/password
  // accounts (whether created via the register form or in local demo mode)
  // do. Firebase exposes this per-account via providerData, not firebaseReady
  // alone — firebaseReady just means "real backend", not "signed in with Google".
  const hasPasswordProvider = !firebaseReady || user?.providerData?.some((p) => p.providerId === 'password')

  const genderOptions = getGenderOptions(t)
  const employmentOptions = getEmploymentOptions(t)
  const statusOptions = getStatusOptions(t)

  const [lockDraft, setLockDraft] = useState(systemLocked)
  const [lockMessageDraft, setLockMessageDraft] = useState(lockMessage)
  const [savingLock, setSavingLock] = useState(false)
  const [lockSaved, setLockSaved] = useState(false)

  useEffect(() => {
    setLockDraft(systemLocked)
    setLockMessageDraft(lockMessage)
  }, [systemLocked, lockMessage])

  const [editingProfile, setEditingProfile] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [photoDraft, setPhotoDraft] = useState(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false)
  const [runningSeed, setRunningSeed] = useState(false)
  const [seedResult, setSeedResult] = useState(null)

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function startEditingProfile() {
    setDraft(draftFromProfile(profile))
    setPhotoDraft(null)
    setEditingProfile(true)
  }

  function cancelEditingProfile() {
    setEditingProfile(false)
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoProcessing(true)
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 320, quality: 0.75 })
      setPhotoDraft(dataUrl)
    } finally {
      setPhotoProcessing(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    setSavingProfile(true)
    const updates = { ...draft, name: draft.name.trim() }
    if (photoDraft) updates.photoURL = photoDraft
    await updateProfile(updates)
    setSavingProfile(false)
    setEditingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError(t('profile.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'))
      return
    }
    setChangingPassword(true)
    if (firebaseReady) {
      const result = await changePasswordWithReauth(currentPassword, newPassword)
      setChangingPassword(false)
      if (!result.ok) {
        setPasswordError(result.reason === 'weak-password' ? t('profile.passwordTooShort') : t('profile.currentPasswordWrong'))
        return
      }
    } else {
      await updateProfile({ password: newPassword })
      setChangingPassword(false)
    }
    setPasswordMsg(t('profile.passwordUpdated'))
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordMsg(''), 3000)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    await deleteAccount()
    setDeleting(false)
    setConfirmDeleteOpen(false)
    navigate('/')
  }

  async function handleSaveLock(e) {
    e.preventDefault()
    setSavingLock(true)
    await setSystemLock(lockDraft, lockMessageDraft.trim())
    setSavingLock(false)
    setLockSaved(true)
    setTimeout(() => setLockSaved(false), 3000)
  }

  async function handleRunSeed() {
    setConfirmSeedOpen(false)
    if (!profile?.schoolId) return
    setRunningSeed(true)
    setSeedResult(null)
    try {
      const results = await runProductionSeed(profile.schoolId, user.uid, profile?.name || user.email)
      setSeedResult({ ok: !results.some((r) => r.error), results })
    } catch (err) {
      console.error('[seed] failed', err)
      setSeedResult({ ok: false, results: [] })
    } finally {
      setRunningSeed(false)
    }
  }

  const consentDate = formatTimestamp(profile?.pdpaConsentAt, locale)
  const joinedDate = formatTimestamp(profile?.createdAt, locale)
  const dobLabel = formatTimestamp(profile?.dob, locale)
  const dateJoinedLabel = formatTimestamp(profile?.dateJoined, locale)
  const notSet = t('profile.notSet')

  return (
    <div>
      <div className="page-head">
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.desc')}</p>
      </div>

      <div className="profile-layout">
        <div className="content-card profile-summary-card">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="profile-avatar" />
          ) : (
            <div className="user-avatar user-avatar-xl">{profile?.name?.[0] || '?'}</div>
          )}
          <h2>{profile?.name}</h2>
          <p className="profile-summary-email">{profile?.email}</p>
          <span className="pill">{isAdmin ? t('common.admin') : t('common.teacher')}</span>

          {joinedDate && (
            <div className="profile-summary-meta">
              <div className="profile-summary-meta-row">
                <span>{t('profile.memberSince')}</span>
                <strong>{joinedDate}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="profile-settings">
          {profileSaved && <div className="alert alert-success">{t('profile.changesSaved')}</div>}

          {!editingProfile ? (
            <>
              <div className="content-card">
                <div className="card-heading-row">
                  <h3 className="card-heading">{t('profile.personalInfo')}</h3>
                  <button type="button" className="btn-ghost-app" onClick={startEditingProfile}>{t('profile.editBtn')}</button>
                </div>
                <div className="profile-field-grid">
                  <DetailItem label={t('profile.fullName')} value={profile?.name || notSet} />
                  <DetailItem label={t('profile.email')} value={profile?.email} />
                  <DetailItem label={t('profile.phone')} value={profile?.phone || notSet} />
                  <DetailItem label={t('profile.gender')} value={labelFor(genderOptions, profile?.gender) || notSet} />
                  <DetailItem label={t('profile.dob')} value={dobLabel || notSet} />
                </div>
              </div>

              <div className="content-card">
                <h3 className="card-heading">{t('profile.employmentInfo')}</h3>
                <div className="profile-field-grid">
                  <DetailItem label={t('profile.staffId')} value={profile?.staffId || notSet} />
                  <DetailItem label={t('profile.position')} value={profile?.position || notSet} />
                  <DetailItem label={t('profile.department')} value={profile?.department || notSet} />
                  <DetailItem label={t('profile.employmentType')} value={labelFor(employmentOptions, profile?.employmentType) || notSet} />
                  <DetailItem label={t('profile.dateJoined')} value={dateJoinedLabel || notSet} />
                  <DetailItem label={t('profile.status')} value={labelFor(statusOptions, profile?.status) || notSet} />
                  <DetailBlock label={t('profile.qualifications')}>{profile?.qualifications || notSet}</DetailBlock>
                  <DetailBlock label={t('profile.subjects')}>
                    {profile?.subjects?.length > 0 ? (
                      <div className="profile-chip-list">
                        {profile.subjects.map((s) => <span className="profile-chip profile-chip-static" key={s}>{s}</span>)}
                      </div>
                    ) : notSet}
                  </DetailBlock>
                  <DetailBlock label={t('profile.classes')}>
                    {profile?.classes?.length > 0 ? (
                      <div className="profile-chip-list">
                        {profile.classes.map((c) => <span className="profile-chip profile-chip-static" key={c}>{c}</span>)}
                      </div>
                    ) : notSet}
                  </DetailBlock>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="content-card">
                <h3 className="card-heading">{t('profile.personalInfo')}</h3>
                <div className="field">
                  <label>{t('profile.profilePhoto')}</label>
                  <div className="profile-photo-edit-row">
                    {photoDraft || profile?.photoURL ? (
                      <img src={photoDraft || profile.photoURL} alt="" className="profile-avatar profile-avatar-md" />
                    ) : (
                      <div className="user-avatar user-avatar-lg">{draft.name?.[0] || '?'}</div>
                    )}
                    <label className="btn-ghost-app photo-choose-btn">
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} disabled={photoProcessing} />
                      {photoProcessing ? t('profile.processingPhoto') : t('profile.choosePhoto')}
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.fullName')}</label>
                    <input type="text" value={draft.name} onChange={(e) => update('name', e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>{t('profile.email')}</label>
                    <input type="email" value={profile?.email || ''} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.phone')}</label>
                    <input type="tel" value={draft.phone} onChange={(e) => update('phone', e.target.value)} placeholder="01X-XXX XXXX" />
                  </div>
                  <div className="field">
                    <label>{t('profile.gender')}</label>
                    <SearchableSelect value={draft.gender} onChange={(v) => update('gender', v)} options={genderOptions} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('profile.dob')}</label>
                  <DatePicker value={draft.dob} onChange={(v) => update('dob', v)} />
                </div>
              </div>

              <div className="content-card">
                <h3 className="card-heading">{t('profile.employmentInfo')}</h3>
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.staffId')}</label>
                    <input type="text" value={draft.staffId} onChange={(e) => update('staffId', e.target.value)} placeholder="TCH-00124" />
                  </div>
                  <div className="field">
                    <label>{t('profile.position')}</label>
                    <SearchableSelect value={draft.position} onChange={(v) => update('position', v)} options={JAWATAN_LIST} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.department')}</label>
                    <input type="text" value={draft.department} onChange={(e) => update('department', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('profile.employmentType')}</label>
                    <SearchableSelect value={draft.employmentType} onChange={(v) => update('employmentType', v)} options={employmentOptions} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.dateJoined')}</label>
                    <DatePicker value={draft.dateJoined} onChange={(v) => update('dateJoined', v)} />
                  </div>
                  <div className="field">
                    <label>{t('profile.status')}</label>
                    <SearchableSelect value={draft.status} onChange={(v) => update('status', v)} options={statusOptions} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('profile.qualifications')}</label>
                  <textarea rows={2} value={draft.qualifications} onChange={(e) => update('qualifications', e.target.value)} />
                </div>

                <MultiSelectField
                  label={t('profile.subjects')}
                  options={SUBJECTS}
                  values={draft.subjects}
                  onChange={(v) => update('subjects', v)}
                  addLabel={t('profile.addItem')}
                  pickPlaceholder={t('profile.pickSubject')}
                />
                <MultiSelectField
                  label={t('profile.classes')}
                  options={CLASS_OPTIONS}
                  values={draft.classes}
                  onChange={(v) => update('classes', v)}
                  addLabel={t('profile.addItem')}
                  pickPlaceholder={t('profile.pickClass')}
                />
              </div>

              <div className="content-card profile-actions-card">
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="btn-submit" type="submit" disabled={savingProfile || photoProcessing}>
                    {savingProfile ? t('common.saving') : t('profile.saveChanges')}
                  </button>
                  <button type="button" className="btn-ghost-app" onClick={cancelEditingProfile}>{t('common.cancel')}</button>
                </div>
              </div>
            </form>
          )}

          <div className="content-card">
            <h3 className="card-heading">{t('profile.password')}</h3>
            {!hasPasswordProvider ? (
              <p className="form-note">{t('profile.googleManaged')}</p>
            ) : (
              <form onSubmit={handleChangePassword}>
                {passwordMsg && <div className="alert alert-success">{passwordMsg}</div>}
                {passwordError && <div className="alert alert-error">{passwordError}</div>}
                {firebaseReady && (
                  <div className="field">
                    <label>{t('profile.currentPassword')}</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;" required />
                  </div>
                )}
                <div className="form-row">
                  <div className="field">
                    <label>{t('profile.newPassword')}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;" />
                  </div>
                  <div className="field">
                    <label>{t('profile.confirmPassword')}</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;" />
                  </div>
                </div>
                <button className="btn-submit" type="submit" disabled={!newPassword || !confirmPassword || (firebaseReady && !currentPassword) || changingPassword}>
                  {changingPassword ? t('common.saving') : t('profile.updatePasswordBtn')}
                </button>
              </form>
            )}
          </div>

          <div className="content-card">
            <h3 className="card-heading">{t('profile.privacyConsent')}</h3>
            <p className="form-note" style={{ marginBottom: 12 }}>
              {consentDate
                ? `${t('profile.consentedOn')} ${consentDate}.`
                : t('profile.reviewPrivacy')}
            </p>
            <a href="/pdpa" target="_blank" rel="noreferrer" className="btn-ghost-app">{t('profile.viewPdpa')}</a>
          </div>

          {isDeveloper && (
            <div className="content-card">
              <h3 className="card-heading">{t('developerControls.title')}</h3>
              <p className="form-note" style={{ marginBottom: 14 }}>{t('developerControls.desc')}</p>
              {lockSaved && <div className="alert alert-success">{t('developerControls.saved')}</div>}
              <div className={`alert ${systemLocked ? 'alert-error' : 'alert-success'}`}>
                {systemLocked ? t('developerControls.statusLocked') : t('developerControls.statusUnlocked')}
              </div>
              <form onSubmit={handleSaveLock}>
                <label className="consent-row" style={{ marginBottom: 18 }}>
                  <input type="checkbox" checked={lockDraft} onChange={(e) => setLockDraft(e.target.checked)} />
                  <span>{t('developerControls.lockLabel')}</span>
                </label>
                <div className="field">
                  <label>{t('developerControls.messageLabel')}</label>
                  <input
                    type="text"
                    value={lockMessageDraft}
                    onChange={(e) => setLockMessageDraft(e.target.value)}
                    placeholder={t('developerControls.messagePlaceholder')}
                  />
                </div>
                <button className="btn-submit" type="submit" disabled={savingLock}>
                  {savingLock ? t('common.saving') : t('developerControls.save')}
                </button>
              </form>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-color, #e6e9f0)' }}>
                <h4 style={{ margin: '0 0 6px' }}>Sample data seeder</h4>
                <p className="form-note" style={{ marginBottom: 12 }}>
                  Tops up every collection to at least 15 records with realistic-looking demo data (fake teachers, students, e-RPH/MMI/co-curriculum entries, timetable slots, assembly sessions, notifications). Every seeded document is tagged so it's identifiable later. Safe to click more than once — it only adds what's still missing.
                </p>
                {seedResult && (
                  <div className={`alert ${seedResult.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
                    {seedResult.results.length > 0 ? (
                      <div>
                        <strong>{seedResult.ok ? 'Done.' : 'Finished with some errors:'}</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                          {seedResult.results.map((r) => (
                            <li key={r.collection} style={r.error ? { color: 'var(--danger, #c0392b)' } : undefined}>
                              {r.collection}: {r.error ? `failed — ${r.error}` : `+${r.created}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      'Seeding failed — check the browser console and try again.'
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="btn-ghost-app"
                  disabled={runningSeed}
                  onClick={() => setConfirmSeedOpen(true)}
                >
                  {runningSeed ? 'Seeding…' : 'Seed sample data'}
                </button>
              </div>
            </div>
          )}

          <div className="content-card danger-zone">
            <h3 className="card-heading">{t('profile.dangerZone')}</h3>
            <p className="form-note" style={{ marginBottom: 14 }}>
              {t('profile.dangerZoneDesc')}
            </p>
            <button className="btn-danger-solid" onClick={() => setConfirmDeleteOpen(true)}>{t('profile.deleteAccount')}</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMsg')}
        confirmLabel={deleting ? t('profile.deleting') : t('profile.deleteAccount')}
        tone="danger"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
      />

      <ConfirmModal
        open={confirmSeedOpen}
        title="Seed sample data?"
        message="This adds fake teachers, students, and demo records across every collection in production, tagged as seed data. Safe to run more than once."
        confirmLabel="Seed data"
        tone="warning"
        onCancel={() => setConfirmSeedOpen(false)}
        onConfirm={handleRunSeed}
      />
    </div>
  )
}
