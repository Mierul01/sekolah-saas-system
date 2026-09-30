import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30]

// Lives with the filter/export controls above the table (not the pagination
// footer) so "how many rows" sits next to the other display controls. A
// custom popover instead of a native <select> so it matches the rest of the
// app's dropdowns instead of looking like a bare browser control.
export function PageSizeSelect({ pageSize, onPageSizeChange }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

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
    <div className="pagination-size" ref={wrapRef}>
      <span className="pagination-size-label">{t('common.showEntries')}</span>
      <div className="sselect page-size-select">
        <button type="button" className="sselect-trigger" onClick={() => setOpen((o) => !o)}>
          <span>{pageSize}</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`sselect-chevron ${open ? 'open' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="sselect-panel">
            <div className="sselect-options">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`sselect-option ${n === pageSize ? 'active' : ''}`}
                  onClick={() => {
                    onPageSizeChange(n)
                    setOpen(false)
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Windows the page numbers around the current page (plus first/last) instead
// of listing every page, so this stays usable once a table has dozens of pages.
function buildPageList(page, totalPages) {
  const pages = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
}

export default function Pagination({ page, pageSize, totalItems, onPageChange }) {
  const { t } = useLanguage()
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  const pages = buildPageList(page, totalPages)

  return (
    <div className="pagination">
      <span className="pagination-summary">{t('common.showingEntries', { from, to, total: totalItems })}</span>
      <div className="pagination-controls">
        <button type="button" className="pagination-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          {t('common.previous')}
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="pagination-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          {t('common.next')}
        </button>
      </div>
    </div>
  )
}
