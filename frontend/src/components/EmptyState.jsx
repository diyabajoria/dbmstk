export default function EmptyState({ message = "Nothing here yet.", icon = "🌿", children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-msg">{message}</div>
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}
