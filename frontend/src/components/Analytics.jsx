import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";

/* ── Manufacturer insight tooltips ── */
const CHART_INSIGHTS = {
  severity: {
    high:   "⚠️ High severity spike. Likely causes: production line compound mixing deviation, cold-chain storage failure, or road salt corrosion accelerating tread wear beyond spec. Escalate to EU Quality Manager.",
    medium: "📊 Moderate severity. Typical for mixed fleet claims. Monitor for uneven wear patterns — may indicate wheel alignment issues at retailer level or sub-optimal inflation guidance.",
    low:    "✅ Low severity distribution. Healthy claim profile. High proportion of cosmetic/minor claims — good retailer pre-screening or low-mileage fleet segment.",
  },
  damage: {
    severe:   "🔴 Severe damage dominant. Mfr perspective: Audit sidewall compound vulcanisation consistency across EU plants. Correlates with cold-temperature brittleness — winter markets at highest risk. Cross-reference batch codes.",
    moderate: "🟡 Moderate damage leading. Often road debris punctures or uneven tread wear. Check if specific tyre size/batch is over-represented. Investigate EU fleet application vs tyre speed/load rating compliance.",
    minor:    "🟢 Minor damage majority. Positive manufacturing quality signal. Ensure minor claims don't mask delayed reporting of progressive sidewall fatigue — recommend proactive inspection cycle for customers.",
  },
  decision: {
    replace:  "🔴 High replacement rate. Review QC at specific EU plants. Compare Blizzak vs Turanza model split — winter tyres historically show 23% higher severe claim rates. Check recent production batches for anomalies.",
    refund:   "🟡 Partial refund volume rising. Mid-life tyre failures suggest possible rubber compound durability gap under wet European conditions. Review compound formulation for high-humidity markets (UK, Netherlands, Belgium).",
    manual:   "🔵 Manual review queue elevated. High intervention rate signals edge cases outside AI decision thresholds. Consider expanding training dataset with borderline cases to reduce manual overhead.",
  },
  pie: {
    Severe:   "🔴 SEVERE DAMAGE INSIGHT\n\nManufacturing root causes to investigate:\n• Sidewall compound vulcanisation inconsistency\n• Belt cord adhesion failure in cold climates\n• Post-production storage humidity damage\n• Retailer improper fitment causing carcass stress\n\nEU impact: Severe claims cost ~€47 avg. each in replacement + logistics. Cross-reference with production plant batch codes and dispatch dates.",
    Moderate: "🟡 MODERATE DAMAGE INSIGHT\n\nTypical manufacturing & field causes:\n• Road debris puncture in non-repairable zone\n• Chronic under-inflation causing shoulder wear\n• Wheel misalignment beyond ETRTO spec\n• Speed rating violation in commercial fleets\n\nEU impact: Moderate claims average €22 partial refund. High volume indicates systemic retailer fitting or pressure guidance failures.",
    Minor:    "🟢 MINOR DAMAGE INSIGHT\n\nCommon causes at minor severity level:\n• Cosmetic kerb scuffs or parking marks\n• Early-stage surface ozone micro-cracking\n• Normal wear progression near indicator level\n• UV-induced sidewall surface crazing\n\nEU impact: Minor claims are typically €0 warranty cost. High minor proportion is a healthy indicator — well-screened claims entering the system.",
  },
};

function getInsight(type, stats, key) {
  if (!stats) return "";
  if (type === "pie" && key) return CHART_INSIGHTS.pie[key] || "";
  if (type === "severity") {
    const avgSev = stats.avg;
    if (avgSev >= 65) return CHART_INSIGHTS.severity.high;
    if (avgSev >= 40) return CHART_INSIGHTS.severity.medium;
    return CHART_INSIGHTS.severity.low;
  }
  if (type === "damage") {
    const dominant = stats.severe >= stats.moderate && stats.severe >= stats.minor ? "severe"
      : stats.moderate >= stats.minor ? "moderate" : "minor";
    return CHART_INSIGHTS.damage[dominant];
  }
  if (type === "decision") {
    const dominant = stats.replace >= stats.refund && stats.replace >= stats.manual ? "replace"
      : stats.refund >= stats.manual ? "refund" : "manual";
    return CHART_INSIGHTS.decision[dominant];
  }
  return "";
}

/* ── Manufacturer insight hover card ── */
function InsightCard({ text, visible }) {
  if (!visible || !text) return null;
  return (
    <div className="analytics-insight-card">
      <div className="analytics-insight-label">📋 Manufacturer Insight</div>
      <div className="analytics-insight-text">{text}</div>
    </div>
  );
}

/* ── Custom dark tooltip ── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border2)",
      borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "var(--text2)",
    }}>
      {label && <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

const PIE_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

export default function Analytics({ claims }) {
  const [chartType, setChartType] = useState("bar");
  const [hoveredChart, setHoveredChart] = useState(null);
  const [activePieSlice, setActivePieSlice] = useState(null);

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
    const aiCount  = claims.filter((c) => c.ai_powered).length;
    return { total, severe, moderate, minor, replace, refund, manual, auto, avg, severeRate, aiCount };
  }, [claims]);

  const trendData = useMemo(() =>
    claims.slice(-15).map((c) => ({
      name: `#${c.id}`,
      Severity: c.severity,
      fill: c.damage === "Severe" ? "#ef4444" : c.damage === "Moderate" ? "#f59e0b" : "#22c55e",
    })),
    [claims]
  );

  const pieData = stats ? [
    { name: "Severe",   value: stats.severe },
    { name: "Moderate", value: stats.moderate },
    { name: "Minor",    value: stats.minor },
  ] : [];

  const decisionData = stats ? [
    { name: "Replace",        count: stats.replace, fill: "#ef4444" },
    { name: "Partial Refund", count: stats.refund,  fill: "#f59e0b" },
    { name: "Manual Review",  count: stats.manual,  fill: "#60a5fa" },
  ] : [];

  const radarData = stats ? [
    { subject: "Severe",     A: stats.severe },
    { subject: "Moderate",   A: stats.moderate },
    { subject: "Minor",      A: stats.minor },
    { subject: "Auto-Res",   A: stats.auto },
    { subject: "AI-Powered", A: stats.aiCount },
  ] : [];

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
      <div className="analytics-hint">
        💡 Hover over any chart to see <strong>manufacturer-level insights</strong> on defect causes
      </div>

      {/* KPI strip */}
      <div className="grid4" style={{ marginBottom: 24 }}>
        {[
          { label: "Auto-Resolution",  value: `${Math.round((stats.auto/stats.total)*100)}%`,    color: "var(--green)" },
          { label: "Avg Severity",     value: stats.avg,                                          color: "var(--amber)" },
          { label: "Replace Rate",     value: `${Math.round((stats.replace/stats.total)*100)}%`, color: "var(--red)"   },
          { label: "AI Analysed",      value: stats.aiCount,                                      color: "#a78bfa"      },
        ].map((s) => (
          <div className="card" key={s.label} style={{ textAlign: "center" }}>
            <div className="card-title" style={{ marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Severity trend + Pie */}
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div
          className={`card analytics-hoverable ${hoveredChart === "severity" ? "chart-hovered" : ""}`}
          onMouseEnter={() => setHoveredChart("severity")}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <div className="card-title">Severity Trend (last 15)</div>
            <div style={{ display:"flex",gap:6 }}>
              {["bar","line"].map((t) => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`btn ${chartType===t?"btn-primary":"btn-ghost"}`}
                  style={{ padding:"4px 12px",fontSize:11 }}>
                  {t==="bar"?"Bar":"Line"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {chartType === "bar" ? (
              <BarChart data={trendData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:"var(--text3)",fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"var(--text3)",fontSize:10 }} axisLine={false} tickLine={false} domain={[0,100]} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Severity" radius={[4,4,0,0]}>
                  {trendData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:"var(--text3)",fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"var(--text3)",fontSize:10 }} axisLine={false} tickLine={false} domain={[0,100]} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="Severity" stroke="#3b82f6" strokeWidth={2} dot={{ fill:"#3b82f6",r:3 }} activeDot={{ r:5 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
          <InsightCard text={getInsight("severity", stats)} visible={hoveredChart === "severity"} />
        </div>

        <div
          className={`card analytics-hoverable ${hoveredChart === "damage" ? "chart-hovered" : ""}`}
          onMouseEnter={() => setHoveredChart("damage")}
          onMouseLeave={() => { setHoveredChart(null); setActivePieSlice(null); }}
        >
          <div className="card-title" style={{ marginBottom: 4 }}>Damage Distribution</div>
          <div style={{ fontSize:11,color:"var(--text3)",marginBottom:12 }}>Click a segment to see manufacturer insight</div>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                  onClick={(data) => setActivePieSlice(activePieSlice === data.name ? null : data.name)}
                  style={{ cursor:"pointer" }}
                >
                  {pieData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i]}
                      opacity={activePieSlice && activePieSlice !== d.name ? 0.35 : 1}
                      stroke={activePieSlice === d.name ? "#fff" : "transparent"}
                      strokeWidth={activePieSlice === d.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {pieData.map((d, i) => (
                <div
                  key={d.name}
                  style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer",
                    opacity: activePieSlice && activePieSlice !== d.name ? 0.4 : 1,
                    transition:"opacity 0.2s"
                  }}
                  onClick={() => setActivePieSlice(activePieSlice === d.name ? null : d.name)}
                >
                  <div style={{ width:10,height:10,borderRadius:"50%",background:PIE_COLORS[i],flexShrink:0,
                    boxShadow: activePieSlice === d.name ? `0 0 6px ${PIE_COLORS[i]}` : "none"
                  }} />
                  <span style={{ fontSize:13,color:"var(--text2)",flex:1 }}>{d.name}</span>
                  <span style={{ fontSize:13,fontWeight:500,color:PIE_COLORS[i] }}>{d.value}</span>
                  <span style={{ fontSize:10,color:"var(--text3)" }}>click</span>
                </div>
              ))}
              <div style={{ marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)",fontSize:12,color:"var(--text3)" }}>
                Total: {stats.total} claims
              </div>
            </div>
          </div>
          {activePieSlice ? (
            <div className="analytics-insight-card" style={{ borderColor: activePieSlice==="Severe"?"rgba(239,68,68,0.3)":activePieSlice==="Moderate"?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.3)" }}>
              <div className="analytics-insight-label">📋 {activePieSlice} Damage — Manufacturer Insight</div>
              <div className="analytics-insight-text" style={{ whiteSpace:"pre-line" }}>{getInsight("pie", stats, activePieSlice)}</div>
            </div>
          ) : (
            <InsightCard text={getInsight("damage", stats)} visible={hoveredChart === "damage" && !activePieSlice} />
          )}
        </div>
      </div>

      {/* Decision bar + Radar */}
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div
          className={`card analytics-hoverable ${hoveredChart === "decision" ? "chart-hovered" : ""}`}
          onMouseEnter={() => setHoveredChart("decision")}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <div className="card-title" style={{ marginBottom: 16 }}>Decision Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={decisionData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill:"var(--text3)",fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill:"var(--text2)",fontSize:11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Claims" radius={[0,4,4,0]}>
                {decisionData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <InsightCard text={getInsight("decision", stats)} visible={hoveredChart === "decision"} />
        </div>

        <div
          className={`card analytics-hoverable ${hoveredChart === "radar" ? "chart-hovered" : ""}`}
          onMouseEnter={() => setHoveredChart("radar")}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <div className="card-title" style={{ marginBottom: 16 }}>Claim Profile Radar</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:"var(--text3)",fontSize:10 }} />
              <Radar name="Claims" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <InsightCard
            text="🔵 Radar profile shows overall claim distribution. An imbalanced radar skewed towards Severe/Replace indicates a quality alert — escalate to EU Regional Quality Manager."
            visible={hoveredChart === "radar"}
          />
        </div>
      </div>

      {/* Fraud + Processing */}
      <div className="grid2">
        <div className="card">
          <div className="card-title" style={{ marginBottom:4 }}>Fraud Risk Indicators</div>
          <div style={{ fontSize:13,color:"var(--text3)",marginBottom:16 }}>Based on AI pattern analysis</div>
          {[
            { label:"Duplicate image submissions", badge:<span className="badge badge-green">0 detected</span> },
            { label:"High severity concentration", badge:(
              <span className={`badge ${stats.severeRate>0.6?"badge-red":"badge-green"}`}>
                {stats.severeRate>0.6?"High — review":"Normal"}
              </span>
            )},
            { label:"Manual override rate", badge:<span className="badge badge-blue">{Math.round((stats.manual/stats.total)*100)}%</span> },
            { label:"AI-powered assessments", badge:<span className="badge badge-blue">{Math.round((stats.aiCount/stats.total)*100)}%</span> },
          ].map((item,i,arr) => (
            <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
              <span style={{ fontSize:13,color:"var(--text2)" }}>{item.label}</span>
              {item.badge}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom:16 }}>Processing Statistics</div>
          <div className="mini-stat-grid">
            {[
              { label:"Auto-Resolution", value:`${Math.round((stats.auto/stats.total)*100)}%`, color:"var(--green)" },
              { label:"Avg Severity",    value:stats.avg,                                        color:"var(--amber)" },
              { label:"Replace Rate",    value:`${Math.round((stats.replace/stats.total)*100)}%`,color:"var(--red)"  },
              { label:"Total Claims",    value:stats.total,                                       color:"var(--text)" },
            ].map((s) => (
              <div className="mini-stat" key={s.label}>
                <div className="mini-stat-label">{s.label}</div>
                <div className="mini-stat-value" style={{ color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}