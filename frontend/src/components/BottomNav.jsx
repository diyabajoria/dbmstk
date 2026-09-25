import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/app/dashboard", label: "Home", icon: "🏠" },
  { to: "/app/inventory", label: "Inventory", icon: "📦" },
  { to: "/app/purchases", label: "Add", icon: "+", fab: true },
  { to: "/app/consumption", label: "Use", icon: "🥣" },
  { to: "/app/alerts", label: "Alerts", icon: "🔔", badgeKey: "alerts" },
];

export default function BottomNav({ alertCount = 0 }) {
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `${isActive ? "active" : ""} ${l.fab ? "fab" : ""}`}>
          <span className="bn-icon">{l.icon}</span>
          <span>{l.label}</span>
          {l.badgeKey === "alerts" && alertCount > 0 && <span className="bn-badge">{alertCount > 9 ? "9+" : alertCount}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
