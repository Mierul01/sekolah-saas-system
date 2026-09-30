import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext'

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

const ICON_PATHS = {
  danger: 'M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 004 21h16a2 2 0 001.89-3.14l-8.18-14a2 2 0 00-3.42 0z',
  warning: 'M12 9v4m0 4h.01M12 3l9 16H3l9-16z',
  info: 'M12 12v5m0-9h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage()
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm')
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel')

  useEffect(() => {
    if (!open) return
    function onEscape(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={`modal-icon modal-icon-${tone}`}>
          <Icon path={ICON_PATHS[tone] || ICON_PATHS.warning} />
        </div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="modal-actions">
          <button className="btn-ghost-app btn-block" onClick={onCancel}>{resolvedCancelLabel}</button>
          <button
            className={tone === 'danger' ? 'btn-danger-solid btn-block' : 'btn-submit btn-block'}
            onClick={onConfirm}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
