import { useEffect, useMemo, useRef, useState } from 'react'

function normalize(options) {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih',
  searchPlaceholder = 'Cari...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const searchRef = useRef(null)

  const normalized = useMemo(() => normalize(options), [options])
  const selected = normalized.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    function onEscape(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
  }, [open])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return normalized
    return normalized.filter((o) => o.label.toLowerCase().includes(term))
  }, [normalized, query])

  function selectOption(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`sselect ${disabled ? 'sselect-disabled' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="sselect-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'sselect-placeholder'}>{selected ? selected.label : placeholder}</span>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`sselect-chevron ${open ? 'open' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="sselect-panel">
          <div className="sselect-search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="sselect-options">
            {filtered.length === 0 && <div className="sselect-empty">Tiada padanan</div>}
            {filtered.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className={`sselect-option ${opt.value === value ? 'active' : ''}`}
                onClick={() => selectOption(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
