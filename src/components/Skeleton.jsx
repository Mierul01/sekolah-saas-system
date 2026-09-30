export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap">
      <table>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><span className="skeleton skeleton-text" style={{ width: `${50 + ((r + c) % 4) * 12}%` }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="activity-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="activity-row" key={i}>
          <span className="skeleton skeleton-dot" />
          <div className="activity-row-text">
            <span className="skeleton skeleton-text" style={{ width: '55%', marginBottom: 6 }} />
            <span className="skeleton skeleton-text" style={{ width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatRowSkeleton({ count = 4 }) {
  return (
    <div className="stat-row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <span className="skeleton skeleton-circle" style={{ margin: '0 auto 10px' }} />
          <span className="skeleton skeleton-text" style={{ width: '40%', height: 20, margin: '0 auto 8px' }} />
          <span className="skeleton skeleton-text" style={{ width: '70%', margin: '0 auto' }} />
        </div>
      ))}
    </div>
  )
}
