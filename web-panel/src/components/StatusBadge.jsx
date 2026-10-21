export default function StatusBadge({ status, children }) {
  const value = String(status || '').toLowerCase();
  const color = ['active', 'approved', 'confirmed', 'verified'].includes(value)
    ? 'status-approved'
    : ['pending', 'pending_review', 'submitted'].includes(value)
      ? 'status-pending'
      : ['blocked', 'rejected', 'revoked', 'cancelled'].includes(value)
        ? 'status-blocked' : 'status-neutral';
  return <span className={`account-status-badge ${color}`}>{children ?? (value.replaceAll('_', ' ') || 'Not provided')}</span>;
}
