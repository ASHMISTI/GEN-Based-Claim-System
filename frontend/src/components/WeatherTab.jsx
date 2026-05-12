import React, { useState, useEffect } from "react";

const WEATHER_CITIES = [
  { city: "London",     country: "UK",          temp: 9,  condition: "Overcast",       humidity: 78, risk: "High", riskColor: "#ef4444" },
  { city: "Berlin",     country: "Germany",     temp: 6,  condition: "Light Rain",      humidity: 82, risk: "High", riskColor: "#ef4444" },
  { city: "Paris",      country: "France",      temp: 11, condition: "Cloudy",          humidity: 71, risk: "Medium", riskColor: "#f59e0b" },
  { city: "Amsterdam",  country: "Netherlands", temp: 8,  condition: "Drizzle",         humidity: 85, risk: "High", riskColor: "#ef4444" },
  { city: "Madrid",     country: "Spain",       temp: 16, condition: "Partly Cloudy",   humidity: 52, risk: "Low",  riskColor: "#22c55e" },
  { city: "Stockholm",  country: "Sweden",      temp: 2,  condition: "Snow",            humidity: 88, risk: "Critical", riskColor: "#a855f7" },
  { city: "Warsaw",     country: "Poland",      temp: 3,  condition: "Freezing Rain",   humidity: 90, risk: "Critical", riskColor: "#a855f7" },
  { city: "Rome",       country: "Italy",       temp: 14, condition: "Sunny",           humidity: 45, risk: "Low",  riskColor: "#22c55e" },
];

const WINTER_TIPS = [
  { icon: "❄️", title: "Freezing Point Alert", desc: "Below 7°C, all-season tyres lose 30% grip. Switch to winter tyres. Blizzak WS90 recommended for European winters." },
  { icon: "🌧️", title: "Wet Road Aquaplaning", desc: "Heavy rain + worn tread = aquaplaning risk. At 80km/h, a tyre with 1.6mm tread needs 26m more to stop than 4mm tread." },
  { icon: "🌨️", title: "Snow & Black Ice", desc: "Nordic and Alpine routes require M+S rated tyres. Bridgestone Blizzak grips 57% better than summer tyres on snow." },
  { icon: "💨", title: "Cold Pressure Drop", desc: "Every 5°C drop reduces tyre pressure by ~1 PSI. Under-inflated tyres in winter = 12% higher blowout risk on motorways." },
  { icon: "🛞", title: "Sidewall Cracking", desc: "UV + freeze-thaw cycles accelerate sidewall cracking. Claims spike 34% in January–February across European markets." },
  { icon: "🏔️", title: "Alpine Route Regulations", desc: "Austria, Switzerland, Germany: Winter tyres mandatory Oct–Apr. Non-compliance = €5,000 fine + liability for accidents." },
];

const DEFECT_SEASON_DATA = [
  { month: "Jan", claims: 142, weather: "Severe Winter" },
  { month: "Feb", claims: 138, weather: "Severe Winter" },
  { month: "Mar", claims: 95,  weather: "Early Spring" },
  { month: "Apr", claims: 61,  weather: "Spring" },
  { month: "May", claims: 43,  weather: "Mild" },
  { month: "Jun", claims: 38,  weather: "Summer" },
  { month: "Jul", claims: 32,  weather: "Summer" },
  { month: "Aug", claims: 36,  weather: "Summer" },
  { month: "Sep", claims: 55,  weather: "Autumn" },
  { month: "Oct", claims: 88,  weather: "Wet Autumn" },
  { month: "Nov", claims: 118, weather: "Cold" },
  { month: "Dec", claims: 135, weather: "Winter" },
];

const maxClaims = Math.max(...DEFECT_SEASON_DATA.map(d => d.claims));

function WeatherCard({ data, idx }) {
  const getIcon = (cond) => {
    if (cond.includes("Snow") || cond.includes("Freez")) return "❄️";
    if (cond.includes("Rain") || cond.includes("Drizzle")) return "🌧️";
    if (cond.includes("Overcast") || cond.includes("Cloud")) return "☁️";
    if (cond.includes("Sunny")) return "☀️";
    return "🌤️";
  };
  return (
    <div className="wt-city-card" style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className="wt-city-top">
        <div>
          <div className="wt-city-name">{data.city}</div>
          <div className="wt-city-country">{data.country}</div>
        </div>
        <div className="wt-city-icon">{getIcon(data.condition)}</div>
      </div>
      <div className="wt-city-temp">{data.temp}°C</div>
      <div className="wt-city-cond">{data.condition}</div>
      <div className="wt-city-hum">💧 {data.humidity}% humidity</div>
      <div className="wt-risk-badge" style={{ color: data.riskColor, borderColor: data.riskColor + "44", background: data.riskColor + "15" }}>
        {data.risk} Tyre Risk
      </div>
    </div>
  );
}

export default function WeatherTab() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="wt-header">
        <div>
          <div className="wt-title">European Weather & Tyre Risk Monitor</div>
          <div className="wt-subtitle">Real-time conditions affecting tyre performance across Bridgestone Europe markets</div>
        </div>
        <div className="wt-live-badge">● LIVE</div>
      </div>

      {/* City cards */}
      <div className="wt-city-grid">
        {WEATHER_CITIES.map((d, i) => <WeatherCard key={d.city} data={d} idx={i} />)}
      </div>

      {/* Seasonal defect chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Tyre Claim Seasonality — Europe (Historical Average)</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
          Claim volumes correlate strongly with cold/wet weather events in Europe
        </div>
        <div className="wt-season-chart">
          {DEFECT_SEASON_DATA.map((d, i) => (
            <div key={d.month} className="wt-season-bar-wrap">
              <div className="wt-season-count">{d.claims}</div>
              <div
                className="wt-season-bar"
                style={{
                  height: `${(d.claims / maxClaims) * 120}px`,
                  background: d.claims > 100
                    ? "linear-gradient(180deg,#ef4444,#991b1b)"
                    : d.claims > 70
                    ? "linear-gradient(180deg,#f59e0b,#b45309)"
                    : "linear-gradient(180deg,#22c55e,#15803d)",
                }}
                title={`${d.weather}: ${d.claims} claims`}
              />
              <div className="wt-season-month">{d.month}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {[["#ef4444","High Season (>100)"],["#f59e0b","Mid Season (70–100)"],["#22c55e","Low Season (<70)"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text3)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Winter tips grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>European Climate Tyre Advisory</div>
        <div className="wt-tips-grid">
          {WINTER_TIPS.map((tip, i) => (
            <div key={i} className="wt-tip-card">
              <div className="wt-tip-icon">{tip.icon}</div>
              <div className="wt-tip-title">{tip.title}</div>
              <div className="wt-tip-desc">{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk summary */}
      <div className="grid4">
        {[
          { label: "Cities at High/Critical Risk", value: "4/8", color: "#ef4444" },
          { label: "Avg Temperature (EU)", value: "8.6°C", color: "#60a5fa" },
          { label: "Winter Season Claims Spike", value: "+284%", color: "#f59e0b" },
          { label: "Recommended Tyre", value: "Blizzak", color: "#a855f7" },
        ].map(s => (
          <div className="card" key={s.label} style={{ textAlign: "center" }}>
            <div className="card-title" style={{ marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
