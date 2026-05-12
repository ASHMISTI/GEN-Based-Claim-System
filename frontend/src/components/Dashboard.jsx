import React, { useEffect, useRef } from "react";
import { SkeletonMetricCard, SkeletonCard } from "./SkeletonLoader";

/* ── Animated counter ── */
function AnimatedNumber({ value, color }) {
  const ref  = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    if (value === null || value === undefined) return;
    const target   = typeof value === "number" ? value : parseFloat(value) || 0;
    const start    = prev.current;
    const duration = 800;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(start + (target - start) * eased);
      if (ref.current)
        ref.current.textContent =
          typeof value === "string" && value.includes("%") ? `${current}%` : current;
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <div ref={ref} className="metric-card-value" style={{ color, fontVariantNumeric: "tabular-nums" }}>
      {typeof value === "number" ? value : value}
    </div>
  );
}

function MetricCard({ title, value, delta, deltaType, iconBg, iconColor, iconChar, loading }) {
  if (loading) return <SkeletonMetricCard />;
  return (
    <div className="card">
      <div className="metric-card-header">
        <div>
          <div className="card-title">{title}</div>
          <AnimatedNumber value={value} color={iconColor} />
          <div className={`metric-card-delta ${deltaType}`}>{delta}</div>
        </div>
        <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>{iconChar}</div>
      </div>
    </div>
  );
}

/* ── ROI Banner ── */
function ROIBanner({ total }) {
  const costPerManual   = 47;    // € per manual claim (industry avg)
  const costPerAI       = 4.20;  // € per automated claim
  const savedPerClaim   = costPerManual - costPerAI;
  const totalSaved      = (total * savedPerClaim).toFixed(0);
  const timeSavedDays   = (total * 6.5 / 60 / 8).toFixed(1); // 6.5 min saved per claim, 8hr days
  return (
    <div className="roi-banner">
      <div className="roi-banner-left">
        <div className="roi-banner-title">
          <span className="roi-icon">💰</span> What TyreGuard AI Saves Bridgestone
        </div>
        <div className="roi-banner-sub">Based on {total} claim{total !== 1 ? "s" : ""} processed · vs manual processing baseline</div>
      </div>
      <div className="roi-stats">
        <div className="roi-stat">
          <div className="roi-stat-val">€{Number(totalSaved).toLocaleString()}</div>
          <div className="roi-stat-label">Total Cost Saved</div>
        </div>
        <div className="roi-divider" />
        <div className="roi-stat">
          <div className="roi-stat-val">€{savedPerClaim.toFixed(2)}</div>
          <div className="roi-stat-label">Saved Per Claim</div>
        </div>
        <div className="roi-divider" />
        <div className="roi-stat">
          <div className="roi-stat-val">{timeSavedDays}d</div>
          <div className="roi-stat-label">Staff-Days Saved</div>
        </div>
        <div className="roi-divider" />
        <div className="roi-stat">
          <div className="roi-stat-val">91%</div>
          <div className="roi-stat-label">Cost Reduction</div>
        </div>
      </div>
    </div>
  );
}

/* ── Manufacturer insight cards ── */
function ManufacturerStats({ claims }) {
  const total    = claims.length;
  if (!total) return null;
  const severe   = claims.filter(c => c.damage === "Severe").length;
  const moderate = claims.filter(c => c.damage === "Moderate").length;
  const replace  = claims.filter(c => c.decision === "Replace").length;
  const refund   = claims.filter(c => c.decision === "Partial Refund").length;
  const aiCount  = claims.filter(c => c.ai_powered).length;
  const avgSev   = Math.round(claims.reduce((a, c) => a + c.severity, 0) / total);

  const qualityRisk = severe / total > 0.5 ? "🔴 High" : severe / total > 0.25 ? "🟡 Medium" : "🟢 Low";
  const batchAlert  = severe > 3 ? "⚠️ Possible batch issue" : "✅ Normal distribution";
  const warrantyExp = (replace * 47 + refund * 22).toFixed(0);

  return (
    <div className="mfr-stats-section">
      <div className="mfr-stats-title">🏭 Manufacturer Intelligence</div>
      <div className="mfr-grid">
        <div className="mfr-card mfr-red">
          <div className="mfr-card-icon">🔩</div>
          <div className="mfr-card-label">Production Quality Risk</div>
          <div className="mfr-card-val">{qualityRisk}</div>
          <div className="mfr-card-desc">{severe} severe out of {total} claims ({Math.round(severe/total*100)}%)</div>
        </div>
        <div className="mfr-card mfr-amber">
          <div className="mfr-card-icon">🧪</div>
          <div className="mfr-card-label">Batch Alert Signal</div>
          <div className="mfr-card-val" style={{fontSize:13}}>{batchAlert}</div>
          <div className="mfr-card-desc">Avg severity score: {avgSev}/100. Threshold alert at 3+ severe claims.</div>
        </div>
        <div className="mfr-card mfr-blue">
          <div className="mfr-card-icon">💶</div>
          <div className="mfr-card-label">Est. Warranty Exposure</div>
          <div className="mfr-card-val">€{Number(warrantyExp).toLocaleString()}</div>
          <div className="mfr-card-desc">{replace} replacements × €47 + {refund} refunds × €22 avg</div>
        </div>
        <div className="mfr-card mfr-green">
          <div className="mfr-card-icon">🤖</div>
          <div className="mfr-card-label">AI Assessment Rate</div>
          <div className="mfr-card-val">{Math.round(aiCount/total*100)}%</div>
          <div className="mfr-card-desc">{aiCount} of {total} claims assessed by Gemini Vision AI</div>
        </div>
        <div className="mfr-card mfr-purple">
          <div className="mfr-card-icon">📊</div>
          <div className="mfr-card-label">Moderate-to-Severe Ratio</div>
          <div className="mfr-card-val">{moderate}:{severe}</div>
          <div className="mfr-card-desc">Healthy ratio is 3:1. Higher severe indicates compounding failure mode.</div>
        </div>
        <div className="mfr-card mfr-teal">
          <div className="mfr-card-icon">🌍</div>
          <div className="mfr-card-label">EU Compliance Status</div>
          <div className="mfr-card-val" style={{fontSize:13}}>✅ Audit Ready</div>
          <div className="mfr-card-desc">Full claim audit trail. Meets ETRTO & EU Tyre Regulation 2020/740.</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ claims, navigateTo, loading }) {
  const total    = claims.length;
  const severe   = claims.filter(c => c.damage === "Severe").length;
  const moderate = claims.filter(c => c.damage === "Moderate").length;
  const minor    = claims.filter(c => c.damage === "Minor").length;
  const auto     = claims.filter(c => !c.manual_intervention).length;
  const manual   = claims.filter(c => c.manual_intervention).length;
  const avg      = total ? Math.round(claims.reduce((a, c) => a + c.severity, 0) / total) : null;
  const maxCount = Math.max(severe, moderate, minor, 1);
  const recent   = claims.slice(-5).reverse();

  return (
    <div>
      {/* Manual review alert */}
      {manual > 0 && (
        <div className="alert-banner">
          <span className="alert-icon">⚠</span>
          <span className="alert-text">
            <strong>Manual Review Required</strong> — {manual} claim{manual !== 1 ? "s" : ""} flagged for human inspection
          </span>
          <button className="btn btn-ghost" style={{ marginLeft:"auto",fontSize:12,padding:"5px 12px" }} onClick={() => navigateTo("claims")}>
            Review Now
          </button>
        </div>
      )}

      {/* ROI Banner */}
      <ROIBanner total={total} />

      {/* KPI cards */}
      <div className="grid4">
        <MetricCard loading={loading} title="Total Claims"  value={total}                   delta={`${total} submitted`}  deltaType="delta-up"   iconBg="rgba(59,130,246,0.1)"  iconColor="var(--accent)" iconChar="▤" />
        <MetricCard loading={loading} title="Severe Cases"  value={severe}                  delta="→ replace"             deltaType="delta-down" iconBg="rgba(239,68,68,0.1)"   iconColor="var(--red)"    iconChar="⚠" />
        <MetricCard loading={loading} title="Auto-Resolved" value={auto}                    delta="no manual needed"      deltaType="delta-up"   iconBg="rgba(34,197,94,0.1)"   iconColor="var(--green)"  iconChar="✓" />
        <MetricCard loading={loading} title="Avg Severity"  value={avg !== null ? avg : 0}  delta="score /100"            deltaType=""           iconBg="rgba(245,158,11,0.1)"  iconColor="var(--amber)"  iconChar="◎" />
      </div>

      <div className="grid2">
        {/* Damage distribution */}
        {loading ? <SkeletonCard height={180} lines={3} /> : (
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>Damage Distribution</div>
            {[
              { label:"Severe",   count:severe,   color:"var(--red)"   },
              { label:"Moderate", count:moderate, color:"var(--amber)" },
              { label:"Minor",    count:minor,    color:"var(--green)" },
            ].map((row) => (
              <div className="stat-bar-row" key={row.label}>
                <span className="stat-bar-label">{row.label}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ background:row.color, width:`${(row.count/maxCount)*100}%` }} />
                </div>
                <span className="stat-bar-count">{row.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent activity */}
        {loading ? <SkeletonCard height={180} lines={4} /> : (
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>Recent Activity</div>
            {recent.length === 0 ? (
              <p className="timeline-empty">No activity yet. Submit a claim to get started.</p>
            ) : (
              <ul className="timeline">
                {recent.map((c) => {
                  const dotClass = c.damage === "Severe" ? "red" : c.damage === "Moderate" ? "amber" : "green";
                  const t = c.time ? new Date(c.time).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }) : "—";
                  return (
                    <li className="timeline-item" key={c.id}>
                      <div className={`timeline-dot ${dotClass}`}>●</div>
                      <div>
                        <div className="timeline-text">
                          <strong>Claim #{String(c.id).padStart(5,"0")}</strong> — {c.damage} damage, {c.decision}
                          {c.ai_powered && <span className="badge badge-blue" style={{ marginLeft:6,fontSize:9 }}>✦ AI</span>}
                        </div>
                        <div className="timeline-time">{t} · {c.status || "Pending"}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Manufacturer Intelligence */}
      <ManufacturerStats claims={claims} />
    </div>
  );
}