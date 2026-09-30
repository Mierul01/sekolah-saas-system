import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import ConfirmModal from './ConfirmModal'

function getMenuItems(t) {
  return [
    { to: '/app/profil', label: t('account.viewProfile'), icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0', tint: 'blue' },
    { to: '/app/bantuan', label: t('account.help'), icon: 'M18.5 19a8.5 8.5 0 10-13 0M6 15v4a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H6zM17 15h1a1 1 0 011 1v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a1 1 0 011-1z', tint: 'teal' },
  ]
}

function Icon({ path, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={path} />
    </svg>
  )
}

export default function AccountMenu() {
  const { profile, isAdmin, signOutUser } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuItems = getMenuItems(t)

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

  return (
    <div className="sidebar-account" ref={wrapRef}>
      {open && (
        <div className="account-dropdown account-dropdown-up">
          <div className="account-card">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" />
            ) : (
              <div className="user-avatar user-avatar-lg">{profile?.name?.[0] || '?'}</div>
            )}
            <div className="account-card-meta">
              <strong>{profile?.name}</strong>
              <span className="account-email">{profile?.email}</span>
              <div className="account-card-badges">
                <span className="account-online"><i /> {t('account.online')}</span>
                <span className="pill pill-role">{isAdmin ? t('common.admin') : t('common.teacher')}</span>
              </div>
            </div>
          </div>

          <div className="account-divider" />

          <nav className="account-links">
            {menuItems.map((item) => (
              <Link key={item.to} to={item.to} className="account-link" onClick={() => setOpen(false)}>
                <span className={`account-link-icon tint-${item.tint}`}><Icon path={item.icon} /></span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="account-divider" />

          <button
            className="account-link account-link-danger"
            onClick={() => {
              setOpen(false)
              setConfirmOpen(true)
            }}
          >
            <span className="account-link-icon tint-red"><Icon path="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></span>
            {t('account.signOut')}
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={t('account.signOutTitle')}
        message={t('account.signOutMsg')}
        confirmLabel={t('account.signOut')}
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          signOutUser()
        }}
      />

      <button className="sidebar-account-trigger" onClick={() => setOpen((o) => !o)} aria-label="Akaun">
        <span className="sidebar-account-avatar">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" />
          ) : (
            <div className="user-avatar">{profile?.name?.[0] || '?'}</div>
          )}
          <span className="account-status-dot" />
        </span>
        <span className="sidebar-account-meta">
          <strong>{profile?.name}</strong>
          <span>{profile?.email}</span>
        </span>
        <Icon path="M7 15l5 5 5-5M7 9l5-5 5 5" className={`sidebar-account-chevron ${open ? 'open' : ''}`} />
      </button>
    </div>
  )
}
