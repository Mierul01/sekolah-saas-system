import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  updatePassword as updateAuthPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp, db } from '../lib/db'
import { auth, googleProvider, ALLOWED_EMAIL_DOMAIN, DEVELOPER_EMAIL, firebaseReady } from '../lib/firebase'
import { getSessionUid, setSessionUid, subscribeSession, slugify } from '../lib/localAuth'
import { DEFAULT_SCHOOL_ID } from '../lib/constants'
import { ensureTestAccounts } from '../lib/seedData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [systemLocked, setSystemLocked] = useState(false)
  const [lockMessage, setLockMessage] = useState('')

  // Developer kill switch — a single shared doc everyone signed in can read,
  // so a lock flipped by the developer takes effect for active sessions
  // immediately, not just on next login. Only subscribed once signed in,
  // since the security rule requires it and a signed-out visitor has
  // nothing to be locked out of anyway.
  useEffect(() => {
    if (!user) {
      setSystemLocked(false)
      setLockMessage('')
      return
    }
    const unsub = onSnapshot(doc(db, 'system', 'status'), (snap) => {
      const data = snap.exists() ? snap.data() : null
      setSystemLocked(Boolean(data?.locked))
      setLockMessage(data?.message || '')
    })
    return () => unsub()
  }, [user])

  // Auto-logout after 15 minutes of no mouse/keyboard/touch/scroll activity.
  // Tracked via a plain ref (not state) so activity itself never triggers a
  // re-render — only a periodic check compares elapsed time against the
  // limit and signs out if it's been exceeded.
  useEffect(() => {
    if (!user) return
    const IDLE_LIMIT_MS = 15 * 60 * 1000
    let lastActivity = Date.now()
    const markActive = () => { lastActivity = Date.now() }
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }))
    const interval = setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        signOutUser()
      }
    }, 30 * 1000)
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, markActive))
      clearInterval(interval)
    }
  }, [user])

  // ---------- Local demo mode (no Firebase configured) ----------
  useEffect(() => {
    if (firebaseReady) return

    async function loadLocalSession(uid) {
      if (!uid) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      const userRef = doc(db, 'users', uid)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data = snap.data()
        setUser({ uid, email: data.email, displayName: data.name, photoURL: data.photoURL || '' })
        setProfile({ id: uid, ...data })
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }

    loadLocalSession(getSessionUid())
    const unsub = subscribeSession(loadLocalSession)
    return unsub
  }, [])

  // ---------- Real Firebase mode ----------
  useEffect(() => {
    if (!firebaseReady) return

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setError('')
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (ALLOWED_EMAIL_DOMAIN && !firebaseUser.email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
        await firebaseSignOut(auth)
        setUser(null)
        setProfile(null)
        setError(`Sila log masuk menggunakan e-mel rasmi sekolah (@${ALLOWED_EMAIL_DOMAIN}).`)
        setLoading(false)
        return
      }

      // A slow/offline Firestore connection right as the session restores
      // must never leave the app stuck on the loading screen indefinitely
      // (Firestore's own retry/backoff before giving up can take a long
      // time) — cap the wait, then fall back to a profile built from the
      // Auth user itself so routing/role checks still work.
      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snap = await Promise.race([
          getDoc(userRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('profile-fetch-timeout')), 8000)),
        ])

        if (!snap.exists()) {
          const newProfile = {
            name: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            role: 'guru',
            schoolId: DEFAULT_SCHOOL_ID,
            createdAt: serverTimestamp(),
          }
          await setDoc(userRef, newProfile)
          setProfile({ id: firebaseUser.uid, ...newProfile })
        } else {
          setProfile({ id: firebaseUser.uid, ...snap.data() })
        }
      } catch {
        setProfile({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || '',
          role: 'guru',
          schoolId: DEFAULT_SCHOOL_ID,
        })
        setError('Gagal memuatkan profil. Sambungan tidak stabil, sila muat semula halaman.')
      }

      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function signInWithGoogle() {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Log masuk gagal. Sila cuba lagi.')
      }
    }
  }

  async function registerLocal({ name, email, phone, password, role, pdpaConsent }) {
    setError('')
    const normalizedEmail = email.trim().toLowerCase()
    const snap = await getDocs(collection(db, 'users'))
    const exists = snap.docs.some((d) => d.data().email?.trim().toLowerCase() === normalizedEmail)
    if (exists) {
      return { ok: false, reason: 'exists' }
    }
    const uid = slugify(normalizedEmail)
    const profileData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      password,
      photoURL: '',
      role,
      schoolId: DEFAULT_SCHOOL_ID,
      pdpaConsent: Boolean(pdpaConsent),
      pdpaConsentAt: pdpaConsent ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', uid), profileData)
    setSessionUid(uid)
    return { ok: true }
  }

  async function loginLocal(email, password, remember = true) {
    setError('')
    await ensureTestAccounts()
    const target = email.trim().toLowerCase()
    const snap = await getDocs(collection(db, 'users'))
    const match = snap.docs.find((d) => d.data().email?.trim().toLowerCase() === target)
    if (!match) {
      return { ok: false, reason: 'not-found' }
    }
    if (match.data().password !== password) {
      return { ok: false, reason: 'wrong-password' }
    }
    setSessionUid(match.id, remember)
    return { ok: true }
  }

  async function registerWithEmail({ name, email, phone, password, pdpaConsent }) {
    setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      await updateAuthProfile(cred.user, { displayName: name.trim() })
      // Written explicitly (rather than left to the onAuthStateChanged
      // auto-create branch) so the name is guaranteed correct — there's no
      // guarantee the displayName update above lands before that listener
      // fires. Role is always "guru" here regardless of any UI selector:
      // the security rules only allow self-registering as guru anyway.
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        photoURL: '',
        role: 'guru',
        schoolId: DEFAULT_SCHOOL_ID,
        pdpaConsent: Boolean(pdpaConsent),
        pdpaConsentAt: pdpaConsent ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
      })
      return { ok: true }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') return { ok: false, reason: 'exists' }
      if (err.code === 'auth/weak-password') return { ok: false, reason: 'weak-password' }
      if (err.code === 'auth/invalid-email') return { ok: false, reason: 'invalid-email' }
      return { ok: false, reason: 'unknown' }
    }
  }

  async function loginWithEmail(email, password) {
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      return { ok: true }
    } catch (err) {
      if (err.code === 'auth/user-not-found') return { ok: false, reason: 'not-found' }
      return { ok: false, reason: 'wrong-password' }
    }
  }

  // Firebase requires a "recent login" for sensitive changes like a password
  // update — reauthenticating with the current password first also doubles
  // as proof the caller actually knows it, rather than trusting whoever is
  // currently in the session.
  async function changePasswordWithReauth(currentPassword, newPassword) {
    setError('')
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updateAuthPassword(auth.currentUser, newPassword)
      return { ok: true }
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') return { ok: false, reason: 'wrong-password' }
      if (err.code === 'auth/weak-password') return { ok: false, reason: 'weak-password' }
      return { ok: false, reason: 'unknown' }
    }
  }

  async function signOutUser() {
    if (firebaseReady) {
      await firebaseSignOut(auth)
    } else {
      setSessionUid(null)
    }
  }

  async function updateProfile(data) {
    if (!profile?.id) return
    await setDoc(doc(db, 'users', profile.id), data, { merge: true })
    setProfile((p) => ({ ...p, ...data }))
  }

  async function deleteAccount() {
    if (!profile?.id) return
    await deleteDoc(doc(db, 'users', profile.id))
    await signOutUser()
  }

  const isDeveloper = Boolean(DEVELOPER_EMAIL) && user?.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()

  async function setSystemLock(locked, message = '') {
    if (!isDeveloper) return
    await setDoc(doc(db, 'system', 'status'), { locked, message, updatedAt: serverTimestamp() }, { merge: true })
  }

  const value = {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    isDeveloper,
    systemLocked,
    lockMessage,
    setSystemLock,
    loading,
    error,
    firebaseReady,
    signInWithGoogle,
    registerLocal,
    loginLocal,
    registerWithEmail,
    loginWithEmail,
    changePasswordWithReauth,
    signOutUser,
    updateProfile,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
