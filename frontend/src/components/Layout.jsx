import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { getAlerts } from "../services/alertService";

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getAlerts()
      .then((res) => setAlertCount(res.data.filter((a) => !a.isRead).length))
      .catch(() => {});
  }, [location.pathname]);

  // Close drawer + scroll to top on navigation
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [drawerOpen]);

  function handleSearch(term) {
    if (term.trim()) navigate(`/app/inventory?search=${encodeURIComponent(term.trim())}`);
  }

  return (
    <div className="app-shell">
      <div className={`mobile-drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <Sidebar open={drawerOpen} onNavigate={() => setDrawerOpen(false)} alertCount={alertCount} />
      <div className="main-area">
        <Topbar onMenuClick={() => setDrawerOpen((v) => !v)} onSearch={handleSearch} alertCount={alertCount} />
        <main className="content">
          <div key={location.pathname} className="page-transition">{children}</div>
        </main>
      </div>
      <BottomNav alertCount={alertCount} />
    </div>
  );
}
