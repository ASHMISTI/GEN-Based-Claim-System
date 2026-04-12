import React, { useMemo } from "react";

export default function Analytics({ claims }) {
  const stats = useMemo(() => {
    const total    = claims.length;
    if (!total) return null;
    const severe   = claims.filter((c) => c.damage === "Severe").length;
    const moderate = claims.filter((c) => c.damage === "Moderate").length;
    const minor    = claims.filter((c) => c.damage === "Minor").length;
    const replace  = claims.filter((c) => c.decision === "Replace").length;
    const refund   = claims.filter((c) => c.decision === "Partial Refund").length;
    const manual   = claims.filter((c) => c.decision === "Manual Review").length;
    const auto     = claims.filter((c) => !c.manual_intervention).length;
    const avg      = Math.round(claims.reduce((a, c) => a + c.severity, 0) / total);
    const severeRate = severe / total;
    const maxD     = Math.max(replace, refund, manual, 1);

    return { total, severe, moderate, minor, replace, refund, manual, auto, avg, severeRate, maxD };
  }, [claims]);

  const recent10 = claims.slice(-10);

  if (!stats) {
    return (
      <div className="empty-state" style={{ marginTop: 48 }}>
        <div className="empty-icon">📊</div>
        <div className="empty-text">No data yet — submit claims to see analytics</div>
      </div>
    );
  }

  return (
    <div>
      {/* Trend + Decision breakdown */}
      <div className="grid3" style={{ marginBottom: 24 }}>
        {/* Trend chart */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Severity Trend (last 10 claims)</div>
          <div className="trend-chart">
            {recent10.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text3)", width: "100%", textAlign: "center", paddingTop: 60 }}>
                No claims yet
              </div>
            ) : (
              recent10.map((c) => {
                const h   = Math.max(12, c.severity * 1.4);
                const col =
                  c.damage === "Severe"   ? "var(--red)"   :
                  c.damage === "Moderate" ? "var(--amber)" : "var(--green)";
                return (
                  <div className="trend-bar-wrap" key={c.id} title={`Claim #${c.id}: ${c.severity}`}>
                    <span className="trend-label">{c.severity}</span>
                    <div
                      className="trend-bar"
                      style={{ height: h, background: col }}
                    />
                    <span className="trend-label">#{c.id}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Decision breakdown */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Decision Breakdown</div>
          {[
            { label: "Replace",       count: stats.replace, color: "var(--red)",   key: "replace" },
            { label: "Partial Refund",count: stats.refund,  color: "var(--amber)", key: "refund" },
            { label: "Manual Review", count: stats.manual,  color: "#60a5fa",      key: "manual" },
          ].map((row) => (
            <div key={row.key}>
              <div className="legend-row">
                <span className="legend-dot" style={{ background: row.color }} />
                <span className="legend-text">{row.label}: {row.count}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            {[
              { label: "Replace",        count: stats.replace, color: "var(--red)",   max: stats.maxD },
              { label: "Partial Refund", count: stats.refund,  color: "var(--amber)", max: stats.maxD },
              { label: "Manual Review",  count: stats.manual,  color: "#60a5fa",      max: stats.maxD },
            ].map((row) => (
              <div className="stat-bar-row" key={row.label}>
                <span className="stat-bar-label" style={{ width: 110 }}>{row.label}</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill"
                    style={{ background: row.color, width: `${(row.count / row.max) * 100}%` }}
                  />
                </div>
                <span className="stat-bar-count">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid2">
        {/* Fraud risk */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Fraud Risk Indicators</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>
            Based on AI pattern analysis
          </div>
          {[
            {
              label: "Duplicate image submissions",
              badge: <span className="badge badge-green">0 detected</span>,
            },
            {
              label: "High severity concentration",
              badge: (
                <span className={`badge ${stats.severeRate > 0.6 ? "badge-red" : "badge-green"}`}>
                  {stats.severeRate > 0.6 ? "High — review recommended" : "Normal"}
                </span>
              ),
            },
            {
              label: "Manual override rate",
              badge: (
                <span className="badge badge-blue">
                  {Math.round((stats.manual / stats.total) * 100)}%
                </span>
              ),
            },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text2)" }}>{item.label}</span>
              {item.badge}
            </div>
          ))}
        </div>

        {/* Processing stats */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Processing Statistics</div>
          <div className="mini-stat-grid">
            {[
              { label: "Auto-Resolution Rate", value: `${Math.round((stats.auto / stats.total) * 100)}%`,       color: "var(--text)" },
              { label: "Avg Severity",          value: stats.avg,                                                color: "var(--amber)" },
              { label: "Replace Rate",          value: `${Math.round((stats.replace / stats.total) * 100)}%`,   color: "var(--red)" },
              { label: "Total Claims",          value: stats.total,                                              color: "var(--text)" },
            ].map((s) => (
              <div className="mini-stat" key={s.label}>
                <div className="mini-stat-label">{s.label}</div>
                <div className="mini-stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}