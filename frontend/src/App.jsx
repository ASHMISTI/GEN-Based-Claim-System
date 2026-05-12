import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

import BridgestoneLanding from "./components/BridgestoneLanding";
import Login     from "./components/Login";
import Dashboard from "./components/Dashboard";
import Upload    from "./components/Upload";
import AllClaims from "./components/AllClaims";
import Analytics from "./components/Analytics";
import Settings  from "./components/Settings";
import WeatherTab from "./components/WeatherTab";

import { getClaimsAPI } from "./services/api";

/* ── Sidebar nav config ── */
const NAV_MAIN = [
  {
    id: "dashboard", label: "Overview",
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
    id: "upload", label: "Submit Claim",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v10M5 4l3-3 3 3M2 12v1.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V12"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "claims", label: "All Claims", showBadge: true,
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
          stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics", label: "Analytics",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l4-4 3 3 5-7"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "weather", label: "Weather & Risk",
    icon: (
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 11a3.5 3.5 0 017 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M8 1.5v1M8 8.5v1M1.5 5h1M12.5 5h1M3.3 2.8l.7.7M11.3 2.8l-.7.7"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const PAGE_TITLES = {
  dashboard: "Overview",
  upload:    "Submit Claim",
  claims:    "All Claims",
  analytics: "Analytics",
  weather:   "Weather & Tyre Risk",
  settings:  "Settings",
};

export default function App() {
  const [showLanding, setShowLanding]   = useState(true);
  const [loggedIn, setLoggedIn]         = useState(false);
  const [currentUser, setCurrentUser]   = useState("");
  const [page, setPage]                 = useState("dashboard");
  const [claims, setClaims]             = useState([]);
  const [toast, setToast]               = useState("");
  const [loading, setLoading]           = useState(false);

  /* ── Fetch claims ── */
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClaimsAPI();
      const withTime = res.data.map((c) => ({
        ...c,
        time:   c.time   || new Date().toISOString(),
        status: c.status || "Pending",
      }));
      setClaims(withTime);
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchClaims();
  }, [loggedIn, fetchClaims]);

  /* ── Toast ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const handleClaimAdded = (claim) => {
    setClaims((prev) => [
      ...prev,
      { ...claim, time: claim.time || new Date().toISOString(), status: claim.status || "Pending" },
    ]);
  };

  const handleStatusChange = (id, status) => {
    setClaims((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  };

  const handleClearClaims = () => setClaims([]);

  const handleLogout = () => {
    setLoggedIn(false);
    setClaims([]);
    setPage("dashboard");
    setShowLanding(true);
  };

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  const manualCount = claims.filter((c) => c.manual_intervention).length;

  /* ── Show Bridgestone landing first ── */
  if (showLanding) {
    return <BridgestoneLanding onSkip={() => setShowLanding(false)} />;
  }

  if (!loggedIn) {
    return <Login setLoggedIn={setLoggedIn} setCurrentUser={setCurrentUser} />;
  }

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
              id={`nav-${item.id}`}
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
            id="nav-settings"
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

        <div className="sidebar-section">
          <div className="sidebar-label">Bridgestone</div>
          <button
            id="nav-intro"
            className="nav-item"
            onClick={() => setShowLanding(true)}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            About Bridgestone
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

        <main className="content">
          {page === "dashboard" && (
            <Dashboard claims={claims} navigateTo={setPage} loading={loading} />
          )}
          {page === "upload" && (
            <Upload onClaimAdded={handleClaimAdded} showToast={showToast} navigateTo={setPage} />
          )}
          {page === "claims" && (
            <AllClaims
              claims={claims}
              navigateTo={setPage}
              onStatusChange={handleStatusChange}
              showToast={showToast}
              loading={loading}
            />
          )}
          {page === "analytics" && <Analytics claims={claims} />}
          {page === "weather"   && <WeatherTab />}
          {page === "settings"  && (
            <Settings showToast={showToast} onClearClaims={handleClearClaims} claimsCount={claims.length} />
          )}
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}