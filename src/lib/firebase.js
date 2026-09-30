import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || ''
export const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'SMKA Tok Bachok'

// The developer's own account — the only one that can flip the system-wide
// kill switch (see system/status in Firestore + AuthContext) and that stays
// exempt from it, so testers can be locked out without locking yourself out.
export const DEVELOPER_EMAIL = import.meta.env.VITE_DEVELOPER_EMAIL || ''
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// Product-level branding (the SaaS itself, as opposed to SCHOOL_NAME which is
// the individual school/tenant using it once logged in).
export const PRODUCT_NAME = 'SchoolManage'
export const PRODUCT_TAGLINE = 'Satu Sistem, Semua Urusan Sekolah'

const app = firebaseReady ? initializeApp(firebaseConfig) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

export const googleProvider = new GoogleAuthProvider()
if (ALLOWED_EMAIL_DOMAIN) {
  googleProvider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN })
}
