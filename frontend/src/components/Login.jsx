import React, { useState } from "react";
import { loginAPI } from "../services/api";

export default function Login({ setLoggedIn, setCurrentUser }) {
  const [username, setUsername] = useState("retailer1");
  const [password, setPassword] = useState("1234");
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(false);
    try {
      const fd = new FormData();
      fd.append("username", username);
      fd.append("password", password);
      const res = await loginAPI(fd);
      if (res.data.status === "success") {
        setCurrentUser(username);
        setLoggedIn(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">T</div>
          <div>
            <div className="login-title">TyreGuard AI</div>
            <div className="login-sub">Claims Intelligence Platform</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className={`form-input ${error ? "error" : ""}`}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false); }}
            onKeyDown={handleKey}
            placeholder="retailer1"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className={`form-input ${error ? "error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={handleKey}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>
            Invalid credentials. Try retailer1 / 1234
          </p>
        )}

        <button
          className="btn btn-primary btn-full"
          onClick={handleLogin}
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? "Signing in..." : "Sign in to Dashboard"}
        </button>

        <div className="login-footer">
          TyreGuard v2.4 · Enterprise Edition · Protected by AI Fraud Detection
        </div>
      </div>
    </div>
  );
}