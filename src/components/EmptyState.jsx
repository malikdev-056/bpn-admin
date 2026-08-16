import './EmptyState.css'

export default function EmptyState({ icon = '📭', title, description, compact = false }) {
  return (
    <div className={`empty-state-panel ${compact ? 'compact' : ''}`}>
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  )
}
