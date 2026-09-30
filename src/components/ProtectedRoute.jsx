import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function SystemLockedScreen({ message }) {
  const { t } = useLanguage()
  const { signOutUser } = useAuth()
  return (
    <div className="system-locked-screen">
      <div className="system-locked-card">
        <h2>{t('systemLock.title')}</h2>
        <p>{message || t('systemLock.defaultMessage')}</p>
        <button className="btn-ghost-app" onClick={signOutUser}>{t('account.signOut')}</button>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, isDeveloper, systemLocked, lockMessage, loading } = useAuth()

  if (loading) {
    return <div className="page-loading">Memuatkan...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (systemLocked && !isDeveloper) {
    return <SystemLockedScreen message={lockMessage} />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/app" replace />
  }

  return children
}
