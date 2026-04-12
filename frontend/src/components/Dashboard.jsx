import React from "react";

function MetricCard({ title, value, delta, deltaType, iconBg, iconColor, iconChar }) {
  return (
    <div className="card">
      <div className="metric-card-header">
        <div>
          <div className="card-title">{title}</div>
          <div className="metric-card-value" style={{ color: iconColor }}>{value}</div>
          <div className={`metric-card-delta ${deltaType}`}>{delta}</div>
        </div>
        <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>
          {iconChar}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ claims, navigateTo }) {
  const total    = claims.length;
  const severe   = claims.filter((c) => c.damage === "Severe").length;
  const moderate = claims.filter((c) => c.damage === "Moderate").length;
  const minor    = claims.filter((c) => c.damage === "Minor").length;
  const auto     = claims.filter((c) => !c.manual_intervention).length;
  const manual   = claims.filter((c) => c.manual_intervention).length;
  const avg      = total ? Math.round(claims.reduce((a, c) => a + c.severity, 0) / total) : null;
  const maxCount = Math.max(severe, moderate, minor, 1);

  const recent = claims.slice(-5).reverse();

  return (
    <div>
      {/* Manual review alert */}
      {manual > 0 && (
        <div className="alert-banner">
          <span className="alert-icon">⚠</span>
          <span className="alert-text">
            <strong>Manual Review Required</strong> — {manual} claim{manual !== 1 ? "s" : ""} flagged for human inspection
          </span>
          <button
            className="btn btn-ghost"
            style={{ marginLeft: "auto", fontSize: 12, padding: "5px 12px" }}
            onClick={() => navigateTo("claims")}
          >
            Review Now
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid4">
        <MetricCard
          title="Total Claims"
          value={total}
          delta={`${total} submitted`}
          deltaType="delta-up"
          iconBg="rgba(59,130,246,0.1)"
          iconColor="var(--accent)"
          iconChar="▤"
        />
        <MetricCard
          title="Severe Cases"
          value={severe}
          delta="— replace"
          deltaType="delta-down"
          iconBg="rgba(239,68,68,0.1)"
          iconColor="var(--red)"
          iconChar="⚠"
        />
        <MetricCard
          title="Auto-Resolved"
          value={auto}
          delta="— no manual needed"
          deltaType="delta-up"
          iconBg="rgba(34,197,94,0.1)"
          iconColor="var(--green)"
          iconChar="✓"
        />
        <MetricCard
          title="Avg Severity"
          value={avg !== null ? avg : "—"}
          delta="score /100"
          deltaType=""
          iconBg="rgba(245,158,11,0.1)"
          iconColor="var(--amber)"
          iconChar="◎"
        />
      </div>

      <div className="grid2">
        {/* Damage distribution */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Damage Distribution</div>
          {[
            { label: "Severe",   count: severe,   color: "var(--red)" },
            { label: "Moderate", count: moderate, color: "var(--amber)" },
            { label: "Minor",    count: minor,    color: "var(--green)" },
          ].map((row) => (
            <div className="stat-bar-row" key={row.label}>
              <span className="stat-bar-label">{row.label}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{ background: row.color, width: `${(row.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="stat-bar-count">{row.count}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Recent Activity</div>
          {recent.length === 0 ? (
            <p className="timeline-empty">No activity yet. Submit a claim to get started.</p>
          ) : (
            <ul className="timeline">
              {recent.map((c) => {
                const dotClass = c.damage === "Severe" ? "red" : c.damage === "Moderate" ? "amber" : "green";
                const t = c.time ? new Date(c.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                  <li className="timeline-item" key={c.id}>
                    <div className={`timeline-dot ${dotClass}`}>●</div>
                    <div>
                      <div className="timeline-text">
                        <strong>Claim #{String(c.id).padStart(5, "0")}</strong> — {c.damage} damage, {c.decision}
                      </div>
                      <div className="timeline-time">{t}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}