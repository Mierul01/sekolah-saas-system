import { TILE_ICONS } from '../lib/tiles'

// Coloured summary tile used on every dashboard. Each tile carries a tone
// (the module's colour), an icon, the figure, and one small visual: a
// progress bar for "x of y" figures or a 7-day bar strip for trends.

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
