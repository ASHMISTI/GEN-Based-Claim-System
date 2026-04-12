import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

import Login     from "./components/Login";
import Dashboard from "./components/Dashboard";
import Upload    from "./components/Upload";
import AllClaims from "./components/AllClaims";
import Analytics from "./components/Analytics";
import Settings  from "./components/Settings";

import { getClaimsAPI } from "./services/api";

/* ── Sidebar nav config ── */
const NAV_MAIN = [
  {
    id: "dashboard",
    label: "Overview",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
      </svg>
    ),
  },
  {
    id: "upload",
    label: "Submit Claim",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v10M5 4l3-3 3 3M2 12v1.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V12"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "claims",
    label: "All Claims",
    showBadge: true,
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
          stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l4-4 3 3 5-7"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const PAGE_TITLES = {
  dashboard: "Overview",
  upload:    "Submit Claim",
  claims:    "All Claims",
  analytics: "Analytics",
  settings:  "Settings",
};

export default function App() {
  const [loggedIn, setLoggedIn]       = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [page, setPage]               = useState("dashboard");
  const [claims, setClaims]           = useState([]);
  const [toast, setToast]             = useState("");

  /* ── Fetch claims from backend ── */
  const fetchClaims = useCallback(async () => {
    try {
      const res = await getClaimsAPI();
      // attach a local timestamp if the backend doesn't return one
      const withTime = res.data.map((c) => ({ ...c, time: c.time || new Date().toISOString() }));
      setClaims(withTime);
    } catch {
      /* silently ignore — toast shown elsewhere */
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchClaims();
  }, [loggedIn, fetchClaims]);

  /* ── Toast helper ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  /* ── Claim added from Upload ── */
  const handleClaimAdded = (claim) => {
    setClaims((prev) => [...prev, { ...claim, time: new Date().toISOString() }]);
  };

  /* ── Clear all claims ── */
  const handleClearClaims = () => setClaims([]);

  /* ── Logout ── */
  const handleLogout = () => {
    setLoggedIn(false);
    setClaims([]);
    setPage("dashboard");
  };

  /* ── Date string ── */
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  const manualCount = claims.filter((c) => c.manual_intervention).length;

  /* ── Not logged in → show Login ── */
  if (!loggedIn) {
    return <Login setLoggedIn={setLoggedIn} setCurrentUser={setCurrentUser} />;
  }

  /* ── Initials from username ── */
  const initials = currentUser
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">T</div>
          <div>
            <div className="logo-text">TyreGuard AI</div>
            <div className="logo-sub">Claims Platform</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Main</div>
          {NAV_MAIN.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
              {item.showBadge && claims.length > 0 && (
                <span className="nav-badge">{claims.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Settings</div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => setPage("settings")}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.2 3.2l.7.7M12.1 12.1l.7.7M12.8 3.2l-.7.7M3.9 12.1l-.7.7"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Settings
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="avatar">{initials || "R"}</div>
            <div>
              <div className="user-name">{currentUser}</div>
              <div className="user-role">Authorized Retailer</div>
            </div>
          </div>
          <button className="nav-item danger" style={{ marginTop: 8 }} onClick={handleLogout}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <span className="topbar-title">{PAGE_TITLES[page] || page}</span>
          <div className="topbar-spacer" />
          {manualCount > 0 && (
            <span
              className="badge badge-amber"
              style={{ cursor: "pointer" }}
              onClick={() => setPage("claims")}
              title="Click to review"
            >
              ⚠ {manualCount} pending review
            </span>
          )}
          <span className="topbar-tag">● System Online</span>
          <span className="topbar-date">{dateStr}</span>
        </header>

        {/* Page content */}
        <main className="content">
          {page === "dashboard" && (
            <Dashboard
              claims={claims}
              navigateTo={setPage}
            />
          )}

          {page === "upload" && (
            <Upload
              onClaimAdded={handleClaimAdded}
              showToast={showToast}
              navigateTo={setPage}
            />
          )}

          {page === "claims" && (
            <AllClaims
              claims={claims}
              navigateTo={setPage}
            />
          )}

          {page === "analytics" && (
            <Analytics claims={claims} />
          )}

          {page === "settings" && (
            <Settings
              showToast={showToast}
              onClearClaims={handleClearClaims}
              claimsCount={claims.length}
            />
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}