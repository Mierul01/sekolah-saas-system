import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TransitionLink from '../components/TransitionLink'
import { playPageWipe } from '../lib/pageTransition'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PRODUCT_NAME, SCHOOL_NAME, ALLOWED_EMAIL_DOMAIN, firebaseReady } from '../lib/firebase'
import { getRememberedCredentials, setRememberedCredentials, clearRememberedCredentials } from '../lib/localAuth'
import BrandMark from '../components/BrandMark'
import SearchableSelect from '../components/SearchableSelect'
import LanguageSwitcher from '../components/LanguageSwitcher'

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder, required, autoFocus, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      <button type="button" className="password-toggle" tabIndex={-1} onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? (
          <Icon path="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.65 20.65 0 015.17-6.19M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.65 20.65 0 01-4.19 5.19M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22" />
        ) : (
          <Icon path="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        )}
      </button>
    </div>
  )
}

function RegisterForm({ onDone, switchToLogin }) {
  const { registerLocal, registerWithEmail, firebaseReady } = useAuth()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('guru')
  const [pdpaConsent, setPdpaConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorKind, setErrorKind] = useState('')

  const roleOptions = [
    { value: 'guru', label: t('common.teacher') },
    { value: 'admin', label: t('common.admin') },
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setErrorKind('')
    if (password.length < 6) {
      setErrorMsg(t('profile.passwordTooShort'))
      setErrorKind('password')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('profile.passwordMismatch'))
      setErrorKind('password')
      return
    }
    if (!pdpaConsent) {
      setErrorMsg(t('login.pdpaRequired'))
      setErrorKind('pdpa')
      return
    }
    setErrorMsg('')
    setSubmitting(true)
    const result = firebaseReady
      ? await registerWithEmail({ name, email, phone, password, pdpaConsent })
      : await registerLocal({ name, email, phone, password, role, pdpaConsent })
    setSubmitting(false)
    if (!result.ok) {
      if (result.reason === 'weak-password') {
        setErrorMsg(t('login.weakPassword'))
        setErrorKind('password')
      } else if (result.reason === 'invalid-email') {
        setErrorMsg(t('login.invalidEmail'))
        setErrorKind('email')
      } else if (result.reason === 'exists') {
        setErrorMsg(t('login.accountExists'))
        setErrorKind('exists')
      } else {
        setErrorMsg(t('common.failedRetry'))
        setErrorKind('')
      }
      return
    }
    if (!firebaseReady) setRememberedCredentials(email, password)
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} className="local-login-form">
      {errorMsg && (
        <div className="alert alert-error">
          {errorMsg}{' '}
          {errorKind === 'exists' && (
            <button type="button" className="inline-link-btn" onClick={switchToLogin}>{t('login.loginNow')}</button>
          )}
        </div>
      )}
      <div className="field">
        <label>{t('login.fullName')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('login.namePlaceholder')} required autoFocus autoComplete="name" />
      </div>
      <div className="field">
        <label>{t('login.email')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} required autoComplete="email" />
      </div>
      <div className="field">
        <label>{t('login.phone')}</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('login.phonePlaceholder')} autoComplete="tel" />
      </div>
      <div className="form-row">
        <div className="field">
          <label>{t('login.password')}</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required autoComplete="new-password" />
        </div>
        <div className="field">
          <label>{t('profile.confirmPassword')}</label>
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required autoComplete="new-password" />
        </div>
      </div>
      {!firebaseReady && (
        <div className="field">
          <label>{t('login.roleForTesting')}</label>
          <SearchableSelect value={role} onChange={setRole} options={roleOptions} />
        </div>
      )}
      <label className="consent-row">
        <input type="checkbox" checked={pdpaConsent} onChange={(e) => setPdpaConsent(e.target.checked)} />
        <span>
          {t('login.pdpaAgree')}{' '}
          <a href="/pdpa" target="_blank" rel="noreferrer">{t('login.pdpaLink')}</a>
        </span>
      </label>
      <button className="btn-submit btn-block" type="submit" disabled={submitting}>
        {submitting ? t('login.registering') : t('login.registerBtn')}
      </button>
    </form>
  )
}

function LoginForm({ switchToRegister }) {
  const { loginLocal, loginWithEmail, firebaseReady } = useAuth()
  const { t } = useLanguage()
  const remembered = firebaseReady ? null : getRememberedCredentials()
  const [email, setEmail] = useState(remembered?.email || '')
  const [password, setPassword] = useState(remembered?.password || '')
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setErrorMsg('')
    setSubmitting(true)
    const result = firebaseReady
      ? await loginWithEmail(email, password)
      : await loginLocal(email, password, rememberMe)
    setSubmitting(false)
    if (!result.ok) {
      setErrorMsg(result.reason === 'wrong-password' ? t('login.wrongPassword') : t('login.accountNotFound'))
      return
    }
    if (!firebaseReady) {
      if (rememberMe) {
        setRememberedCredentials(email, password)
      } else {
        clearRememberedCredentials()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="local-login-form">
      {errorMsg && (
        <div className="alert alert-error">
          {errorMsg}{' '}
          <button type="button" className="inline-link-btn" onClick={switchToRegister}>{t('login.registerNew')}</button>
        </div>
      )}
      <div className="field">
        <label>{t('login.email')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} required autoFocus autoComplete="username" />
      </div>
      <div className="field">
        <label>{t('login.password')}</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required autoComplete="current-password" />
        <p className="form-note">{t('login.useSameEmail')}</p>
      </div>
      {!firebaseReady && (
        <div className="login-options-row">
          <label className="remember-me">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            {t('login.rememberMe')}
          </label>
        </div>
      )}
      <button className="btn-submit btn-block" type="submit" disabled={submitting}>
        {submitting ? t('common.loading') : t('login.loginBtn')}
      </button>
    </form>
  )
}

export default function Login() {
  const { user, loading, error, signInWithGoogle } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState('login')
  const navigate = useNavigate()

  // Signed in (just now, or already): wipe into the system instead of jumping.
  useEffect(() => {
    if (!loading && user) playPageWipe(navigate, '/app', { replace: true })
  }, [loading, user, navigate])

  if (loading) return <div className="page-loading">{t('common.loading')}</div>

  return (
    <div className="login-screen">
      <div className="login-showcase">
        <div className="login-showcase-top">
          <TransitionLink to="/" className="login-showcase-brand">
            <BrandMark />
            <strong>{PRODUCT_NAME}</strong>
          </TransitionLink>
          <h1>{t('login.showcaseTitle')}</h1>
          <p>{t('login.showcaseBody')}</p>
        </div>
        <p className="login-showcase-footer">{t('login.showcaseFooter', { school: SCHOOL_NAME })}</p>
      </div>

      <div className="login-form-panel">
        <div className="login-form-panel-inner">
          <div className="login-top-row">
            <TransitionLink to="/" className="login-back-link">
              <Icon path="M19 12H5M12 19l-7-7 7-7" />
              {t('login.backToHome')}
            </TransitionLink>
            <LanguageSwitcher />
          </div>

          <BrandMark className="login-mark login-mobile-brand" />
          <h1>{SCHOOL_NAME}</h1>
          <p className="login-sub">{PRODUCT_NAME}: {t('login.tagline')}</p>

          {error && <div className="alert alert-error">{error}</div>}

          {firebaseReady && (
            <>
              <button className="btn-google" onClick={signInWithGoogle}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                </svg>
                {t('login.googleSignIn')}
              </button>
              {ALLOWED_EMAIL_DOMAIN && (
                <p className="login-hint">{t('login.useSchoolEmail', { domain: ALLOWED_EMAIL_DOMAIN })}</p>
              )}
              <div className="login-divider"><span>{t('login.or')}</span></div>
            </>
          )}

          {/* data-tab moves the sliding highlight; the keyed pane replays its slide-in on every switch. */}
          <div className="auth-tabs" data-tab={tab}>
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')} type="button" aria-pressed={tab === 'login'}>
              {t('login.tabLogin')}
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')} type="button" aria-pressed={tab === 'register'}>
              {t('login.tabRegister')}
            </button>
          </div>

          <div key={tab} className={`auth-pane auth-pane-${tab}`}>
            {tab === 'login' ? (
              <LoginForm switchToRegister={() => setTab('register')} />
            ) : (
              <RegisterForm switchToLogin={() => setTab('login')} onDone={() => {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
