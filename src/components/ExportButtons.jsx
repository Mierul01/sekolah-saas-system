import { exportToExcel, exportToPdf } from '../lib/exportTable'

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function ExportButtons({ filename, title, headers, rows }) {
  const disabled = !rows || rows.length === 0

  return (
    <div className="export-actions">
      <button
        type="button"
        className="export-btn"
        disabled={disabled}
        onClick={() => exportToExcel(filename, headers, rows)}
      >
        <Icon path="M4 3h11l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM9 12l6 6M15 12l-6 6" />
        Excel
      </button>
      <button
        type="button"
        className="export-btn"
        disabled={disabled}
        onClick={() => exportToPdf(filename, title, headers, rows)}
      >
        <Icon path="M4 3h11l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM8 17h1.5a1.5 1.5 0 000-3H8v5M13 14v5M13 16.5h2M17 14v5" />
        PDF
      </button>
    </div>
  )
}
