import React, { useEffect, useRef } from "react";
import { updateStatusAPI } from "../services/api";

const STATUS_OPTIONS = ["Pending", "Under Review", "Approved", "Rejected"];

const statusClass = (s) => {
  if (s === "Approved")     return "badge badge-green";
  if (s === "Rejected")     return "badge badge-red";
  if (s === "Under Review") return "badge badge-amber";
  return "badge badge-gray";
};

const damageColor = (d) =>
  d === "Severe" ? "var(--red)" : d === "Moderate" ? "var(--amber)" : "var(--green)";

export default function ClaimModal({ claim, onClose, onStatusChange, showToast }) {
  const overlayRef = useRef();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusAPI(claim.id, newStatus);
      onStatusChange(claim.id, newStatus);
      showToast(`Status updated → ${newStatus}`);
    } catch {
      showToast("Failed to update status");
    }
  };

  const t = claim.time
    ? new Date(claim.time).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const sevColor = damageColor(claim.damage);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="modal-panel" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-claim-id">
              Claim <span style={{ fontFamily: "var(--mono)" }}>
                #{String(claim.id).padStart(5, "0")}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{t}</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Severity ring + damage */}
        <div className="modal-hero">
          <div className={`result-severity-ring ${claim.damage.toLowerCase()}`}>
            <span>{claim.severity}</span>
            <span className="result-severity-sublabel">/100</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: sevColor }}>
              {claim.damage} Damage
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
              Decision: <strong style={{ color: "var(--text)" }}>{claim.decision}</strong>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={`badge ${claim.damage === "Severe" ? "badge-red" : claim.damage === "Moderate" ? "badge-amber" : "badge-green"}`}>
                {claim.damage}
              </span>
              {claim.manual_intervention && (
                <span className="badge badge-amber">⚠ Manual Review</span>
              )}
              {claim.ai_powered && (
                <span className="badge badge-blue">✦ Gemini AI</span>
              )}
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        {claim.explanation && (
          <div className="modal-explanation">
            <div className="modal-section-title">✦ AI Analysis</div>
            <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
              {claim.explanation}
            </p>
          </div>
        )}
        {!claim.explanation && (
          <div className="modal-explanation" style={{ opacity: 0.6 }}>
            <div className="modal-section-title">Analysis Method</div>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>
              Assessed via image variance heuristic (Gemini API key not configured).
            </p>
          </div>
        )}

        {/* Status workflow */}
        <div className="modal-section">
          <div className="modal-section-title">Claim Status</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`status-btn ${claim.status === s ? "active" : ""}`}
                data-status={s}
                onClick={() => handleStatusChange(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <span className={statusClass(claim.status)}>{claim.status}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="modal-info-grid">
          <div className="modal-info-item">
            <div className="result-info-label">Severity Score</div>
            <div className="result-info-value" style={{ color: sevColor, fontSize: 20 }}>
              {claim.severity}
              <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 400 }}> /100</span>
            </div>
          </div>
          <div className="modal-info-item">
            <div className="result-info-label">Decision</div>
            <div className="result-info-value">{claim.decision}</div>
          </div>
          <div className="modal-info-item">
            <div className="result-info-label">Manual Review</div>
            <div className="result-info-value">
              {claim.manual_intervention
                ? <span style={{ color: "var(--amber)" }}>⚠ Yes</span>
                : <span style={{ color: "var(--green)" }}>✓ No</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
