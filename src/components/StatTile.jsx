// Coloured summary tile used on every dashboard. Each tile carries a tone
// (the module's colour), an icon, the figure, and one small visual: a
// progress bar for "x of y" figures or a 7-day bar strip for trends.

export const TILE_ICONS = {
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  doc: 'M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5',
  flag: 'M5 22V3m0 0h13l-3 5 3 5H5',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  percent: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  student:'M12 3L2 8l10 5 10-5-10-5zM6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4',
}

function TileIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TILE_ICONS[name] || TILE_ICONS.doc} />
    </svg>
  )
}

// spark: [{ label, value }] oldest first; the last bar is today and is drawn solid.
function Spark({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const summary = data.map((d) => `${d.label}: ${d.value}`).join(', ')
  return (
    <div className="tile-spark" role="img" aria-label={summary}>
      {data.map((d, i) => (
        <span
          key={d.label + i}
          className={i === data.length - 1 ? 'is-today' : ''}
          style={{ height: `${Math.max(8, (d.value / max) * 100)}%` }}
          title={`${d.label}: ${d.value}`}
        />
      ))}
    </div>
  )
}

function Bar({ fraction }) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100)
  return (
    <div className="tile-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function StatTile({ tone = 'blue', icon = 'doc', label, value, suffix, note, bar, spark }) {
  return (
    <div className={`tile tile-${tone}`}>
      <div className="tile-head">
        <span className="tile-icon"><TileIcon name={icon} /></span>
        <span className="tile-label">{label}</span>
      </div>
      <div className="tile-body">
        <strong className="tile-value">
          {value}
          {suffix != null && <small>{suffix}</small>}
        </strong>
        {spark && <Spark data={spark} />}
      </div>
      {bar != null && <Bar fraction={bar} />}
      {note && <p className="tile-note">{note}</p>}
    </div>
  )
}

// Last n days as ISO dates, oldest first, ending today.
export function lastDays(n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    out.push(local.toISOString().slice(0, 10))
  }
  return out
}

// Counts records per day for the last n days, oldest first.
export function dailyCounts(records, n, locale, countFn = (rows) => rows.length) {
  return lastDays(n).map((iso) => {
    const rows = records.filter((r) => r.tarikh === iso)
    const label = new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { weekday: 'short' })
    return { iso, label, value: countFn(rows) }
  })
}
