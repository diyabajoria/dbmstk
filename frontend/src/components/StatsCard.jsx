import useCountUp from "../hooks/useCountUp";

/**
 * value can be a number (animated count-up) or a preformatted string.
 * Pass `format` to format the animated number (e.g. formatCurrency).
 */
export default function StatsCard({ label, value, tone, sub, icon, format }) {
  const isNumber = typeof value === "number";
  const animated = useCountUp(isNumber ? value : 0);
  const display = isNumber ? (format ? format(animated) : Math.round(animated).toLocaleString("en-IN")) : value;

  return (
    <div className={`stat-card ${tone ? `tone-${tone}` : ""}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="label">{label}</div>
      <div className={`value ${tone || ""}`}>{display}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
