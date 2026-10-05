export function Spinner({ size = 20, color = 'var(--primary)' }) {
  return (
    <div style={{
      width: size, height: size, border: `2.5px solid #e2e8f0`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', display: 'inline-block'
    }} />
  )
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px', flexDirection: 'column', gap: 12 }}>
      <Spinner size={36} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading, please wait…</p>
    </div>
  )
}

export function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>{[...Array(cols).keys()].map(i => (
            <th key={i}><SkeletonBlock width="80px" height={12} /></th>
          ))}</tr>
        </thead>
        <tbody>
          {[...Array(rows).keys()].map(r => (
            <tr key={r}>
              {[...Array(cols).keys()].map(c => (
                <td key={c}><SkeletonBlock height={14} width={c === 0 ? '150px' : '90px'} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid-4">
      {[...Array(count).keys()].map(i => (
        <div key={i} className="stat-card">
          <SkeletonBlock width={52} height={52} radius={14} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBlock height={26} width="60px" />
            <SkeletonBlock height={12} width="100px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon || '📭'}</div>
      <h3>{title || 'No data found'}</h3>
      <p>{message || 'There is nothing to display here yet.'}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h3>Unable to Load Data</h3>
      <p>{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}
