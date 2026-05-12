import React, { useEffect, useRef, useState } from "react";
import "./BridgestoneLanding.css";

const SLIDES = [
  {
    id: "intro",
    label: "About Bridgestone",
    title: "Bridgestone Europe",
    subtitle: "Leading the Future of Mobility",
    body: "Founded in 1931 in Japan, Bridgestone is the world's largest tyre and rubber company. In Europe, Bridgestone serves over 50 countries, delivering premium tyres that power everything from passenger cars to heavy commercial vehicles — built for Europe's diverse, demanding road conditions.",
    stat1: { value: "150M+", label: "Tyres produced annually" },
    stat2: { value: "140+", label: "Countries served" },
    stat3: { value: "€6.2B", label: "European revenue 2023" },
    stat4: { value: "1931", label: "Founded" },
    accent: "#e63312",
  },
  {
    id: "europe",
    label: "Europe Division",
    title: "Bridgestone in Europe",
    subtitle: "Engineered for European Roads",
    body: "Bridgestone's European operations span 8 manufacturing plants, 3 R&D centres, and over 15,000 employees. The company leads the European premium tyre market with its flagship Turanza, Potenza, and Blizzak ranges — designed specifically for cold Nordic winters, Alpine conditions, and motorway cruising.",
    stat1: { value: "8", label: "EU Manufacturing Plants" },
    stat2: { value: "15,000+", label: "European Employees" },
    stat3: { value: "3", label: "R&D Centres" },
    stat4: { value: "#1", label: "Premium EU Market" },
    accent: "#e63312",
  },
  {
    id: "manufacturing",
    label: "How Tyres Are Made",
    title: "Tyre Manufacturing",
    subtitle: "Precision Engineered in 7 Stages",
    steps: [
      { icon: "🧪", label: "Compound Mixing", desc: "Natural & synthetic rubber blended with carbon black, silica and chemicals at 160°C" },
      { icon: "🔩", label: "Steel Belts", desc: "High-tensile steel cord calendered into rubber strips for structural strength" },
      { icon: "🏗️", label: "Component Assembly", desc: "Bead wire, ply fabric, inner liner, sidewalls assembled on a drum" },
      { icon: "🔥", label: "Vulcanisation", desc: "Green tyre cured in mould under 200°C/22 bar pressure for 10–15 minutes" },
      { icon: "🔍", label: "X-Ray Inspection", desc: "Each tyre X-rayed for internal defects, voids, wire misalignment" },
      { icon: "⚖️", label: "Uniformity Testing", desc: "Force variation, balance and dynamic roundness measured to 0.01mm" },
      { icon: "✅", label: "Quality Release", desc: "Only tyres passing 300+ checks ship to retailers and distributors" },
    ],
    accent: "#e63312",
  },
  {
    id: "precautions",
    label: "Tyre Precautions",
    title: "Safety Precautions",
    subtitle: "Protecting Lives on European Roads",
    precautions: [
      { icon: "🌡️", title: "Cold Weather Inflation", desc: "Tyre pressure drops 1 PSI per 5°C drop. In European winters, check pressure monthly — under-inflation increases wear by 25%." },
      { icon: "📏", title: "Tread Depth", desc: "EU legal minimum is 1.6mm, but Bridgestone recommends replacing at 3mm. Below 3mm, wet braking distance increases by 44%." },
      { icon: "🔄", title: "Rotation", desc: "Rotate every 10,000km to equalise wear. Front tyres on FWD cars wear 2–3× faster than rears." },
      { icon: "⚡", title: "Speed & Load Ratings", desc: "Never exceed the tyre's speed index (e.g. 'H'=210km/h). Overloading reduces tyre life by up to 50%." },
      { icon: "❄️", title: "Winter Tyres", desc: "EU studies show winter tyres reduce accident risk by 57% below 7°C. Blizzak WS90 stops 3.5m shorter than all-season at -10°C." },
      { icon: "👁️", title: "Visual Inspection", desc: "Inspect sidewalls for cracks, bulges and embedded objects monthly. A 2cm sidewall crack can cause blowout at motorway speed." },
    ],
    accent: "#e63312",
  },
  {
    id: "solution",
    label: "Our Solution",
    title: "TyreGuard AI",
    subtitle: "Transforming the Tyre Claim Process",
    problems: [
      { icon: "⏱️", label: "Manual Processing", before: "5–7 days per claim", after: "< 30 seconds with AI" },
      { icon: "❌", label: "Fraud Detection", before: "~12% fraud rate", after: "AI flags anomalies instantly" },
      { icon: "💰", label: "Cost per Claim", before: "€47 average", after: "€4.20 automated cost" },
      { icon: "😤", label: "Retailer Satisfaction", before: "62% CSAT", after: "94% CSAT target" },
    ],
    features: [
      "Gemini Vision AI analyses tyre images in seconds",
      "Automated Severe / Moderate / Minor damage classification",
      "Instant Replace / Partial Refund / Manual Review decision",
      "Full audit trail with email notifications to any recipient",
      "Analytics dashboard with fraud risk indicators",
      "Weather-aware insights for European climate conditions",
    ],
    accent: "#e63312",
  },
];

export default function BridgestoneLanding({ onSkip }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("forward");
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const autoTimer = useRef(null);
  const [brightness, setBrightness] = useState(1.0);
  const brightnessDir = useRef(1);

  // Breathing light animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBrightness((prev) => {
        let next = prev + brightnessDir.current * 0.012;
        if (next >= 1.25) { brightnessDir.current = -1; next = 1.25; }
        if (next <= 0.7)  { brightnessDir.current =  1; next = 0.7; }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    autoTimer.current = setTimeout(() => {
      if (activeSlide < SLIDES.length - 1) goTo(activeSlide + 1, "forward");
    }, 7000);
    return () => clearTimeout(autoTimer.current);
  }, [activeSlide]);

  // Intersection observer for stats
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeSlide]);

  const goTo = (idx, dir = "forward") => {
    if (animating || idx === activeSlide) return;
    setDirection(dir);
    setAnimating(true);
    setStatsVisible(false);
    setTimeout(() => {
      setActiveSlide(idx);
      setAnimating(false);
    }, 350);
  };

  const slide = SLIDES[activeSlide];

  return (
    <div className="bs-landing" style={{ filter: `brightness(${brightness})` }}>
      {/* Animated background */}
      <div className="bs-bg-orb bs-orb1" />
      <div className="bs-bg-orb bs-orb2" />
      <div className="bs-bg-orb bs-orb3" />
      <div className="bs-grid-lines" />

      {/* Top bar */}
      <div className="bs-topbar">
        <div className="bs-logo-row">
          <div className="bs-logo-circle">B</div>
          <div>
            <div className="bs-logo-name">BRIDGESTONE</div>
            <div className="bs-logo-tagline">Europe · TyreGuard AI Platform</div>
          </div>
        </div>
        <div className="bs-slide-tabs">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`bs-tab ${i === activeSlide ? "active" : ""}`}
              onClick={() => goTo(i, i > activeSlide ? "forward" : "back")}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="bs-skip-btn" onClick={onSkip} id="skip-to-login">
          Skip to Login →
        </button>
      </div>

      {/* Slide content */}
      <div className={`bs-slide ${animating ? (direction === "forward" ? "exit-left" : "exit-right") : "enter"}`}>

        {/* INTRO / EUROPE SLIDES */}
        {(slide.id === "intro" || slide.id === "europe") && (
          <div className="bs-content-center">
            <div className="bs-eyebrow">SLIDE {activeSlide + 1} / {SLIDES.length}</div>
            <h1 className="bs-h1" style={{ color: slide.accent }}>{slide.title}</h1>
            <div className="bs-subtitle">{slide.subtitle}</div>
            <p className="bs-body">{slide.body}</p>
            <div className="bs-stat-grid" ref={statsRef}>
              {[slide.stat1, slide.stat2, slide.stat3, slide.stat4].map((s, i) => (
                <div key={i} className={`bs-stat-card ${statsVisible ? "visible" : ""}`} style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="bs-stat-value" style={{ color: slide.accent }}>{s.value}</div>
                  <div className="bs-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUFACTURING SLIDE */}
        {slide.id === "manufacturing" && (
          <div className="bs-content-wide">
            <div className="bs-eyebrow">MANUFACTURING PROCESS</div>
            <h1 className="bs-h1" style={{ color: slide.accent }}>{slide.title}</h1>
            <div className="bs-subtitle">{slide.subtitle}</div>
            <div className="bs-steps-row">
              {slide.steps.map((step, i) => (
                <div key={i} className="bs-step-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="bs-step-num">{i + 1}</div>
                  <div className="bs-step-icon">{step.icon}</div>
                  <div className="bs-step-label">{step.label}</div>
                  <div className="bs-step-desc">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRECAUTIONS SLIDE */}
        {slide.id === "precautions" && (
          <div className="bs-content-wide">
            <div className="bs-eyebrow">SAFETY FIRST</div>
            <h1 className="bs-h1" style={{ color: slide.accent }}>{slide.title}</h1>
            <div className="bs-subtitle">{slide.subtitle}</div>
            <div className="bs-precautions-grid">
              {slide.precautions.map((p, i) => (
                <div key={i} className="bs-precaution-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="bs-prec-icon">{p.icon}</div>
                  <div className="bs-prec-title">{p.title}</div>
                  <div className="bs-prec-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOLUTION SLIDE */}
        {slide.id === "solution" && (
          <div className="bs-content-wide">
            <div className="bs-eyebrow">THE SOLUTION WE BUILT</div>
            <h1 className="bs-h1" style={{ color: slide.accent }}>{slide.title}</h1>
            <div className="bs-subtitle">{slide.subtitle}</div>
            <div className="bs-solution-grid">
              <div className="bs-before-after-grid">
                <div className="bs-ba-header">Problem → Solution</div>
                {slide.problems.map((p, i) => (
                  <div key={i} className="bs-ba-row" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="bs-ba-icon">{p.icon}</div>
                    <div className="bs-ba-label">{p.label}</div>
                    <div className="bs-ba-before">{p.before}</div>
                    <div className="bs-ba-arrow">→</div>
                    <div className="bs-ba-after">{p.after}</div>
                  </div>
                ))}
              </div>
              <div className="bs-features-list">
                <div className="bs-features-header">Platform Features</div>
                {slide.features.map((f, i) => (
                  <div key={i} className="bs-feature-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span className="bs-feature-dot">✦</span>
                    {f}
                  </div>
                ))}
                <button className="bs-cta-btn" onClick={onSkip}>
                  Launch TyreGuard AI →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dot navigation */}
      <div className="bs-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`bs-dot ${i === activeSlide ? "active" : ""}`}
            onClick={() => goTo(i, i > activeSlide ? "forward" : "back")}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="bs-progress-track">
        <div className="bs-progress-fill" style={{ width: `${((activeSlide + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {/* Bottom skip button */}
      <button className="bs-skip-bottom" onClick={onSkip} id="skip-bottom-btn">
        Skip Introduction · Go to Login →
      </button>
    </div>
  );
}
