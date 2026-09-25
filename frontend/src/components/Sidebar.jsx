import { NavLink } from "react-router-dom";
import Brand from "./Brand";

const SECTIONS = [
  {
    label: "Overview",
    links: [
      { to: "/app/dashboard", label: "Dashboard", icon: "🏠" },
      { to: "/app/inventory", label: "Inventory", icon: "📦" },
      { to: "/app/alerts", label: "Alerts", icon: "🔔", badgeKey: "alerts" },
    ],
  },
  {
    label: "Daily",
    links: [
      { to: "/app/purchases", label: "Add Purchase", icon: "🛒" },
      { to: "/app/consumption", label: "Record Consumption", icon: "🥣" },
      { to: "/app/shopping-list", label: "Shopping List", icon: "📋" },
      { to: "/app/reports", label: "Reports & Spending", icon: "📊" },
    ],
  },
  {
    label: "Manage",
    links: [
      { to: "/app/categories", label: "Categories", icon: "🗂️" },
      { to: "/app/locations", label: "Storage Locations", icon: "📍" },
      { to: "/app/suppliers", label: "Suppliers", icon: "🏪" },
      { to: "/app/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export default function Sidebar({ open, onNavigate, alertCount = 0 }) {
  let i = 0;
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <Brand />
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="nav-section-label">{section.label}</div>
          <nav>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={onNavigate}
                style={{ animationDelay: `${0.03 * i++}s` }}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
                {link.badgeKey === "alerts" && alertCount > 0 && <span className="badge-count">{alertCount}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
      <div className="sidebar-footer">Know what you have · Waste less · Spend smarter</div>
    </aside>
  );
}
