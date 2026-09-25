import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onMenuClick, onSearch, alertCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const debounce = useRef(null);

  // "/" focuses search from anywhere
  useEffect(() => {
    function onKey(e) {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onSearch?.(v), 300);
  }

  const initials = (user?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <div className="search-box">
        <span className="search-icon">🔎</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search items, brands, rooms…"
          value={search}
          onChange={handleSearchChange}
          onKeyDown={(e) => e.key === "Enter" && onSearch?.(search)}
        />
        <kbd>/</kbd>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" onClick={() => navigate("/app/alerts")} aria-label="Alerts">
          <span className="bell">🔔</span>
          {alertCount > 0 && <span className="dot" />}
        </button>
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm logout-btn" onClick={handleLogout} title="Log out">
          ⎋ <span className="logout-text">Log out</span>
        </button>
      </div>
    </header>
  );
}
