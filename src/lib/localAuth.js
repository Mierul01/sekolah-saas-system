// Session tracking for local demo mode — who's "signed in" right now.
// "Remember me" controls whether this survives a browser restart (localStorage)
// or only the current tab session (sessionStorage).

const SESSION_KEY = 'ldb_session_uid'
const listeners = new Set()

export function getSessionUid() {
  return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
}

export function setSessionUid(uid, remember = true) {
  if (uid) {
    if (remember) {
      localStorage.setItem(SESSION_KEY, uid)
      sessionStorage.removeItem(SESSION_KEY)
    } else {
      sessionStorage.setItem(SESSION_KEY, uid)
      localStorage.removeItem(SESSION_KEY)
    }
  } else {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }
  listeners.forEach((cb) => cb(uid))
}

export function subscribeSession(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// "Remember me" also pre-fills the login form next time, so a returning user
// doesn't have to retype their email/password.
const REMEMBER_KEY = 'ldb_remember_creds'

export function getRememberedCredentials() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setRememberedCredentials(email, password) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }))
}

export function clearRememberedCredentials() {
  localStorage.removeItem(REMEMBER_KEY)
}

export function slugify(name) {
  return (
    'local-' +
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  )
}
