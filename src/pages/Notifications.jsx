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
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function formatWhen(ts, locale) {
  if (!ts) return ''
  const date = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : null
  if (!date) return ''
  return date.toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'

  function openNotification(n) {
    markRead(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('notifications.title')}</h1>
        <p>{t('notifications.desc')}</p>
      </div>

      <div className="content-card">
        <div className="card-toolbar">
          <h3 className="card-heading" style={{ marginBottom: 0 }}>
            {t('notifications.title')} {unreadCount > 0 && <span className="chip chip-count">{unreadCount}</span>}
          </h3>
          {unreadCount > 0 && (
            <button className="btn-ghost-app" onClick={markAllRead}>{t('notifications.markAllRead')}</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="muted">{t('notifications.empty')}</p>
        ) : (
          <div className="notif-list notif-list-page">
            {notifications.map((n) => {
              const meta = KIND_META[n.kind] || KIND_META.erph_submitted
              return (
                <button key={n.id} className={`notif-item ${n.read ? '' : 'notif-item-unread'}`} onClick={() => openNotification(n)}>
                  <span className={`notif-item-icon ${meta.color}`}><Icon path={meta.icon} /></span>
                  <span className="notif-item-text">
                    <span className="notif-item-msg">{t(`notifications.${meta.key}`, { name: n.teacherName })}</span>
                    <span className="notif-item-time">{formatWhen(n.createdAt, locale)}</span>
                  </span>
                  {!n.read && <span className="notif-item-dot" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
