import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext'

// A lightweight lightbox for a record's uploaded photos — reuses the same
// overlay/portal pattern as ConfirmModal so it escapes the sidebar's sticky
// stacking context, just with a wider card for the image grid.
export default function PhotoViewerModal({ open, title, photos, onClose }) {
  const { t } = useLanguage()
  if (!open) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {photos.length === 0 ? (
          <p>{t('common.noRecords')}</p>
        ) : (
          <div className="photo-grid">
            {photos.map((src, i) => (
              <img key={i} src={src} alt={`${title} ${i + 1}`} />
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-submit btn-block" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
