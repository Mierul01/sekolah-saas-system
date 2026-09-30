import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, query, where, setDoc, serverTimestamp, db } from '../lib/db'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

function getTime(ts) {
  if (!ts) return 0
  if (typeof ts === 'string') return new Date(ts).getTime()
  if (ts.toDate) return ts.toDate().getTime()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

export function NotificationProvider({ children }) {
  const { user, profile } = useAuth()
  const [all, setAll] = useState([])

  // Only subscribed once signed in — the security rule requires it, and an
  // anonymous visitor (landing/login pages) has no notifications to show
  // anyway. Re-subscribes on every auth change since this listener doesn't
  // otherwise know when a new user has signed in.
  useEffect(() => {
    if (!user || !profile?.schoolId) {
      setAll([])
      return
    }
    const q = query(collection(db, 'notifications'), where('schoolId', '==', profile.schoolId))
    const unsub = onSnapshot(q, (snap) => {
      setAll(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user, profile?.schoolId])

  const notifications = useMemo(() => {
    if (!user || !profile) return []
    return all
      .filter((n) => n.toUid === user.uid || n.toRole === profile.role || n.toRole === 'all')
      .map((n) => ({ ...n, read: (n.readBy || []).includes(user.uid) }))
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
  }, [all, user, profile])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function markRead(id) {
    if (!user) return
    const notif = all.find((n) => n.id === id)
    if (!notif || (notif.readBy || []).includes(user.uid)) return
    await setDoc(doc(db, 'notifications', id), { readBy: [...(notif.readBy || []), user.uid] }, { merge: true })
  }

  async function markAllRead() {
    await Promise.all(notifications.filter((n) => !n.read).map((n) => markRead(n.id)))
  }

  async function notify({ toRole, toUid = null, kind, teacherName = '', link = '' }) {
    if (!profile?.schoolId) return
    await addDoc(collection(db, 'notifications'), {
      toRole, toUid, kind, teacherName, link, schoolId: profile.schoolId, readBy: [], createdAt: serverTimestamp(),
    })
  }

  const value = { notifications, unreadCount, markRead, markAllRead, notify }
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
