/** Shimmering skeleton that roughly matches a page layout. */
export default function LoadingSpinner({ variant = "page" }) {
  if (variant === "inline") return <div className="spinner" />;
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: 34, width: "40%" }} />
      <div className="skeleton-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 110 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 260 }} />
    </div>
  );
}
