import React, { useState } from "react";

export default function Settings({ showToast, onClearClaims, claimsCount }) {
  const [apiUrl, setApiUrl]       = useState("http://localhost:8000");
  const [model, setModel]         = useState("MobileNetV2 (Default)");
  const [threshSevere, setTS]     = useState(80);
  const [threshModerate, setTM]   = useState(50);

  const handleSave = () => showToast("Settings saved successfully");

  const handleClear = () => {
    if (claimsCount === 0) { showToast("No claims to clear"); return; }
    onClearClaims();
    showToast("All claims cleared");
  };

  return (
    <div style={{ maxWidth: 600 }}>
      {/* API config */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>API Configuration</div>
        <div className="form-group">
          <label className="form-label">Backend Endpoint</label>
          <input
            className="form-input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">AI Model Version</label>
          <select
            className="form-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option>MobileNetV2 (Default)</option>
            <option>ResNet-50 (High Accuracy)</option>
            <option>EfficientNet-B4 (Balanced)</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Configuration
        </button>
      </div>

      {/* Thresholds */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Severity Thresholds</div>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
          Adjust AI decision boundaries for your retailer policy
        </p>
        <div className="form-group">
          <label className="form-label">Severe → Replace threshold</label>
          <input
            type="range" min={50} max={95} value={threshSevere}
            onChange={(e) => setTS(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span className="range-val">{threshSevere}%</span>
        </div>
        <div className="form-group">
          <label className="form-label">Moderate → Partial Refund threshold</label>
          <input
            type="range" min={20} max={70} value={threshModerate}
            onChange={(e) => setTM(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span className="range-val">{threshModerate}%</span>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Thresholds
        </button>
      </div>

      {/* Danger zone */}
      <div className="card">
        <div className="danger-zone-title">Danger Zone</div>
        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>
          This will permanently delete all {claimsCount} claim{claimsCount !== 1 ? "s" : ""} from this session.
        </p>
        <button className="btn btn-danger" onClick={handleClear}>
          Clear All Claims Data
        </button>
      </div>
    </div>
  );
}