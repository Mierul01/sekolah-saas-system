import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { useLanguage } from '../context/LanguageContext'

const KIND_META = {
  erph_submitted: { icon: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z', color: 'bg-blue', key: 'erphSubmitted' },
  mmi_submitted: { icon: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2', color: 'bg-gold', key: 'mmiSubmitted' },
  coco_submitted: { icon: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5', color: 'bg-teal', key: 'cocoSubmitted' },
  assembly_code: { icon: 'M5 22V3m0 0h13l-3 5 3 5H5', color: 'bg-purple', key: 'assemblyCode' },
  assembly_ended: { icon: 'M5 22V3m0 0h13l-3 5 3 5H5', color: 'bg-navy', key: 'assemblyEnded' },
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function timeAgo(ts, locale) {
  if (!ts) return ''
  const date = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : null
  if (!date) return ''
  return date.toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { t, language } = useLanguage()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const recent = notifications.slice(0, 6)

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  function openNotification(n) {
    markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="notif-bell" ref={wrapRef}>
      <button className="notif-bell-btn" onClick={() => setOpen((o) => !o)} aria-label={t('notifications.title')}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <h4>{t('notifications.title')}</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>{t('notifications.markAllRead')}</button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="muted notif-empty">{t('notifications.empty')}</p>
          ) : (
            <div className="notif-list">
              {recent.map((n) => {
                const meta = KIND_META[n.kind] || KIND_META.erph_submitted
                return (
                  <button key={n.id} className={`notif-item ${n.read ? '' : 'notif-item-unread'}`} onClick={() => openNotification(n)}>
                    <span className={`notif-item-icon ${meta.color}`}><Icon path={meta.icon} /></span>
                    <span className="notif-item-text">
                      <span className="notif-item-msg">{t(`notifications.${meta.key}`, { name: n.teacherName })}</span>
                      <span className="notif-item-time">{timeAgo(n.createdAt, locale)}</span>
                    </span>
                    {!n.read && <span className="notif-item-dot" />}
                  </button>
                )
              })}
            </div>
          )}

          <div className="notif-dropdown-foot">
            <button className="notif-view-all" onClick={() => { setOpen(false); navigate('/app/notifikasi') }}>
              {t('notifications.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
