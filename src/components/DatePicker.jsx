import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { toLocalISODate } from '../lib/constants'

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

const CALENDAR_ICON = 'M8 2v4M16 2v4M3.5 9h17M4.5 5h15a1 1 0 011 1v14a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z'
const YEAR_BLOCK_SIZE = 12

function isSameDay(a, b) {
  return Boolean(a) && Boolean(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DatePicker({ value, onChange, disabled = false }) {
  const { t, language } = useLanguage()
  const locale = language === 'en' ? 'en-MY' : 'ms-MY'
  const [open, setOpen] = useState(false)
  // 'day' shows the usual calendar grid; 'month' and 'year' are quick-jump
  // views so getting from "now" to e.g. a 1995 birth date is a couple of
  // clicks instead of paging back one month at a time for 25+ years.
  const [viewMode, setViewMode] = useState('day')
  const wrapRef = useRef(null)

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const [viewDate, setViewDate] = useState(selectedDate || new Date())

  useEffect(() => {
    if (open) {
      setViewDate(selectedDate || new Date())
      setViewMode('day')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

  const weekdayLabels = useMemo(() => {
    const sunday = new Date(2023, 0, 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return d.toLocaleDateString(locale, { weekday: 'short' })
    })
  }, [locale])

  const monthLabels = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(2023, i, 1).toLocaleDateString(locale, { month: 'short' }))
  }, [locale])

  const monthLabel = viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const yearBlockStart = Math.floor(viewDate.getFullYear() / YEAR_BLOCK_SIZE) * YEAR_BLOCK_SIZE
  const years = Array.from({ length: YEAR_BLOCK_SIZE }, (_, i) => yearBlockStart + i)

  const weeks = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const startOffset = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [viewDate])

  function changeMonth(delta) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function changeYear(delta) {
    setViewDate((d) => new Date(d.getFullYear() + delta, d.getMonth(), 1))
  }

  function changeYearBlock(delta) {
    setViewDate((d) => new Date(d.getFullYear() + delta * YEAR_BLOCK_SIZE, d.getMonth(), 1))
  }

  function pickMonth(monthIndex) {
    setViewDate((d) => new Date(d.getFullYear(), monthIndex, 1))
    setViewMode('day')
  }

  function pickYear(year) {
    setViewDate((d) => new Date(year, d.getMonth(), 1))
    setViewMode('month')
  }

  function selectDay(d) {
    onChange(toLocalISODate(d))
    setOpen(false)
  }

  const today = new Date()
  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={`datepicker ${disabled ? 'sselect-disabled' : ''}`} ref={wrapRef}>
      <button type="button" className="sselect-trigger" onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled}>
        <span className={displayLabel ? '' : 'sselect-placeholder'}>{displayLabel || t('common.chooseOption')}</span>
        <Icon path={CALENDAR_ICON} />
      </button>

      {open && (
        <div className="datepicker-panel">
          {viewMode === 'day' && (
            <>
              <div className="datepicker-header">
                <button type="button" className="datepicker-nav" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <Icon path="M15 18l-6-6 6-6" />
                </button>
                <button type="button" className="datepicker-header-label" onClick={() => setViewMode('month')}>
                  {monthLabel}
                </button>
                <button type="button" className="datepicker-nav" onClick={() => changeMonth(1)} aria-label="Next month">
                  <Icon path="M9 18l6-6-6-6" />
                </button>
              </div>
              <div className="datepicker-weekdays">
                {weekdayLabels.map((w, i) => <span key={i}>{w}</span>)}
              </div>
              <div className="datepicker-grid">
                {weeks.map((row, ri) => (
                  <div className="datepicker-row" key={ri}>
                    {row.map((d, di) => (
                      <button
                        type="button"
                        key={di}
                        className={[
                          'datepicker-day',
                          !d ? 'is-empty' : '',
                          isSameDay(d, selectedDate) ? 'is-selected' : '',
                          isSameDay(d, today) && !isSameDay(d, selectedDate) ? 'is-today' : '',
                        ].join(' ').trim()}
                        disabled={!d}
                        onClick={() => d && selectDay(d)}
                      >
                        {d ? d.getDate() : ''}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="datepicker-footer">
                <button type="button" className="datepicker-today-btn" onClick={() => selectDay(new Date())}>{t('common.today')}</button>
              </div>
            </>
          )}

          {viewMode === 'month' && (
            <>
              <div className="datepicker-header">
                <button type="button" className="datepicker-nav" onClick={() => changeYear(-1)} aria-label="Previous year">
                  <Icon path="M15 18l-6-6 6-6" />
                </button>
                <button type="button" className="datepicker-header-label" onClick={() => setViewMode('year')}>
                  {viewDate.getFullYear()}
                </button>
                <button type="button" className="datepicker-nav" onClick={() => changeYear(1)} aria-label="Next year">
                  <Icon path="M9 18l6-6-6-6" />
                </button>
              </div>
              <div className="datepicker-cell-grid">
                {monthLabels.map((label, i) => (
                  <button
                    type="button"
                    key={label}
                    className={`datepicker-cell ${i === viewDate.getMonth() ? 'is-selected' : ''}`}
                    onClick={() => pickMonth(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {viewMode === 'year' && (
            <>
              <div className="datepicker-header">
                <button type="button" className="datepicker-nav" onClick={() => changeYearBlock(-1)} aria-label="Previous years">
                  <Icon path="M15 18l-6-6 6-6" />
                </button>
                <strong>{years[0]} &ndash; {years[years.length - 1]}</strong>
                <button type="button" className="datepicker-nav" onClick={() => changeYearBlock(1)} aria-label="Next years">
                  <Icon path="M9 18l6-6-6-6" />
                </button>
              </div>
              <div className="datepicker-cell-grid">
                {years.map((y) => (
                  <button
                    type="button"
                    key={y}
                    className={`datepicker-cell ${y === viewDate.getFullYear() ? 'is-selected' : ''}`}
                    onClick={() => pickYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
