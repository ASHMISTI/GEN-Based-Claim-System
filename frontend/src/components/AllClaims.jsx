import React, { useState, useMemo } from "react";

function damageBadge(damage) {
  if (damage === "Severe") return "badge badge-red";
  if (damage === "Moderate") return "badge badge-amber";
  return "badge badge-green";

}

function decisionBadge(decision) {
  if (decision === "Replace") return "badge badge-red";
  if (decision === "Partial Refund") return "badge badge-amber";
  return "badge badge-blue";
}

export default function AllClaims({ claims, navigateTo }) {
  const [search, setSearch] = useState("");
  const [sevFilter, setSev] = useState("");
  const [decFilter, setDec] = useState("");

  const filtered = useMemo(() => {
    return claims
      .slice()
      .reverse()
      .filter((c) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          String(c.id).includes(q) ||
          c.damage.toLowerCase().includes(q) ||
          c.decision.toLowerCase().includes(q);
        const matchSev = !sevFilter || c.damage === sevFilter;
        const matchDec = !decFilter || c.decision === decFilter;
        return matchSearch && matchSev && matchDec;
      });
  }, [claims, search, sevFilter, decFilter]);

  return (
    <div>
      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Search by ID, damage, decision..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={sevFilter} onChange={(e) => setSev(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Severe">Severe</option>
          <option value="Moderate">Moderate</option>
          <option value="Minor">Minor</option>
        </select>
        <select className="filter-select" value={decFilter} onChange={(e) => setDec(e.target.value)}>
          <option value="">All Decisions</option>
          <option value="Replace">Replace</option>
          <option value="Partial Refund">Partial Refund</option>
          <option value="Manual Review">Manual Review</option>
        </select>
        <span className="claims-count-label">
          {filtered.length} claim{filtered.length !== 1 ? "s" : ""}
        </span>
        <button className="btn btn-primary" onClick={() => navigateTo("upload")}>
          + New Claim
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Damage</th>
                <th>Severity Score</th>
                <th>Decision</th>
                <th>Manual Review</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">☁</div>
                      <div className="empty-text">
                        {claims.length === 0 ? "No claims submitted yet" : "No claims match your filters"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const sevColor =
                    c.damage === "Severe" ? "var(--red)" :
                      c.damage === "Moderate" ? "var(--amber)" : "var(--green)";
                  const t = c.time
                    ? new Date(c.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                    : "—";
                  return (
                    <tr key={c.id}>
                      <td className="td-mono">#{String(c.id).padStart(5, "0")}</td>
                      <td><span className={damageBadge(c.damage)}>{c.damage}</span></td>
                      <td style={{ minWidth: 140 }}>
                        <div className="severity-bar-inline">
                          <div className="severity-bar-track">
                            <div
                              className="severity-bar-fill"
                              style={{ width: `${c.severity}%`, background: sevColor }}
                            />
                          </div>
                          <span className="severity-score">{c.severity}</span>
                        </div>
                      </td>
                      <td><span className={decisionBadge(c.decision)}>{c.decision}</span></td>
                      <td>
                        {c.manual_intervention
                          ? <span style={{ color: "var(--amber)" }}>⚠ Yes</span>
                          : <span style={{ color: "var(--green)" }}>✓ No</span>
                        }
                      </td>
                      <td><span className="badge badge-gray">Processed</span></td>
                      <td style={{ fontSize: 12, color: "var(--text3)" }}>{t}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}