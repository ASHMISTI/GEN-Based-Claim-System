import React, { useState, useRef } from "react";
import { uploadAPI } from "../services/api";

const PROCESSING_MSGS = [
  "Uploading image...",
  "Running AI damage assessment...",
  "Calculating severity score...",
  "Generating recommendation...",
];

function getDecisionDesc(decision) {
  if (decision === "Replace")       return "Full tyre replacement recommended";
  if (decision === "Partial Refund") return "Partial compensation applicable";
  return "Requires human inspector review";
}

function getDecisionBadge(decision) {
  if (decision === "Replace")       return "badge badge-red";
  if (decision === "Partial Refund") return "badge badge-amber";
  return "badge badge-blue";
}

export default function Upload({ onClaimAdded, showToast, navigateTo }) {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [processing, setProcessing]       = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [result, setResult]               = useState(null);
  const [drag, setDrag]                   = useState(false);
  const [step, setStep]                   = useState(1);
  const [refId, setRefId]                 = useState("");
  const [brand, setBrand]                 = useState("");
  const [desc, setDesc]                   = useState("");
  const [targetEmail, setTargetEmail]     = useState("");
  const [sendingEmail, setSendingEmail]   = useState(false);
  const [emailSent, setEmailSent]         = useState(false);
  const [msgIdx, setMsgIdx]               = useState(0);
  const fileRef = useRef();
  const intervalRef = useRef();

  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setResult(null);
    setStep(1);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) { showToast("Please select an image first"); return; }
    setProcessing(true);
    setResult(null);
    setStep(2);
    let idx = 0;
    setProcessingMsg(PROCESSING_MSGS[0]);
    intervalRef.current = setInterval(() => {
      idx++;
      if (idx < PROCESSING_MSGS.length) setProcessingMsg(PROCESSING_MSGS[idx]);
    }, 700);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await uploadAPI(fd);
      clearInterval(intervalRef.current);
      setResult(res.data);
      setStep(3);
      onClaimAdded(res.data);
      showToast("Claim submitted successfully!");
    } catch (err) {
      clearInterval(intervalRef.current);
      showToast("Upload failed — is the backend running on port 8000?");
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!targetEmail || !result) return;
    setSendingEmail(true);
    try {
      // Need to import sendEmailAPI at the top, or just use axios directly. I'll use the API service.
      const { sendEmailAPI } = require("../services/api");
      await sendEmailAPI(result.id, targetEmail);
      setEmailSent(true);
      showToast("Email sent successfully!");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setStep(1);
    setRefId(""); setBrand(""); setDesc("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const stepClass = (n) => {
    if (n < step) return "step done";
    if (n === step) return "step active";
    return "step";
  };
  const lineClass = (n) => (n < step ? "step-line done" : "step-line");

  return (
    <div className="grid2" style={{ maxWidth: 960, alignItems: "start" }}>
      {/* Left column */}
      <div>
        {/* Steps */}
        <div className="step-row">
          <div className={stepClass(1)}><div className="step-num">1</div><div className="step-label">Upload Image</div></div>
          <div className={lineClass(1)} />
          <div className={stepClass(2)}><div className="step-num">2</div><div className="step-label">AI Analysis</div></div>
          <div className={lineClass(2)} />
          <div className={stepClass(3)}><div className="step-num">3</div><div className="step-label">Decision</div></div>
        </div>

        {/* Drop zone */}
        <div
          className={`upload-zone ${drag ? "drag" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <div className="upload-zone-icon">⬆</div>
          <div className="upload-zone-text">Drop tyre image here</div>
          <div className="upload-zone-sub">JPEG, PNG, WEBP · Max 10MB</div>
          {selectedFile && (
            <div className="file-chosen">✓ {selectedFile.name}</div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => applyFile(e.target.files[0])}
        />

        {/* Claim details form */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Claim Details</div>
          <div className="form-group">
            <label className="form-label">Retailer Reference ID</label>
            <input className="form-input" value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="e.g. RET-2024-00123" />
          </div>
          <div className="form-group">
            <label className="form-label">Tyre Brand / Model</label>
            <input className="form-input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Michelin Pilot Sport 4" />
          </div>
          <div className="form-group">
            <label className="form-label">Issue Description</label>
            <textarea className="form-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the reported issue..." rows={3} style={{ resize: "vertical" }} />
          </div>
        </div>

        {/* Processing state */}
        {processing && (
          <div className="processing-state">
            <div className="processing-dots">
              <span /><span /><span />
            </div>
            <div className="processing-msg">{processingMsg}</div>
          </div>
        )}

        {/* Submit button */}
        {!processing && (
          <button className="btn btn-primary btn-full" onClick={handleSubmit}>
            Analyse Tyre &amp; Submit Claim
          </button>
        )}
      </div>

      {/* Right column */}
      <div>
        {/* Image preview */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Image Preview</div>
          <div className="img-preview-box">
            {preview
              ? <img src={preview} alt="tyre preview" />
              : "No image selected"
            }
          </div>
        </div>

        {/* Detection criteria */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Detection Criteria</div>
          {[
            { col: "var(--red)",   text: "Sidewall cracks / bulges" },
            { col: "var(--red)",   text: "Tread depth below 2mm" },
            { col: "var(--amber)", text: "Uneven tread wear patterns" },
            { col: "var(--amber)", text: "Puncture or embedded object" },
            { col: "var(--green)", text: "Surface scuffing / cosmetic" },
          ].map((item, i) => (
            <div className="criteria-item" key={i}>
              <span className="criteria-dot" style={{ color: item.col }}>●</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Result panel */}
        {result && (
          <div className="result-panel">
            <div className="result-label-small">AI Assessment Result</div>
            <div className="result-header">
              <div className={`result-severity-ring ${result.damage.toLowerCase()}`}>
                <span>{result.severity}</span>
                <span className="result-severity-sublabel">{result.damage}</span>
              </div>
              <div>
                <div className="result-damage-title">{result.damage} Damage Detected</div>
                <div className="result-decision-desc">{getDecisionDesc(result.decision)}</div>
                {result.manual_intervention && (
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-amber">⚠ Manual Review Required</span>
                  </div>
                )}
              </div>
            </div>
            <div className="result-info-grid">
              <div className="result-info-item">
                <div className="result-info-label">Claim ID</div>
                <div className="result-info-value" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                  #{String(result.id).padStart(5, "0")}
                </div>
              </div>
              <div className="result-info-item">
                <div className="result-info-label">Decision</div>
                <div className="result-info-value">
                  <span className={getDecisionBadge(result.decision)}>{result.decision}</span>
                </div>
              </div>
              <div className="result-info-item">
                <div className="result-info-label">Manual Review</div>
                <div className="result-info-value">
                  {result.manual_intervention
                    ? <span style={{ color: "var(--amber)" }}>Yes</span>
                    : <span style={{ color: "var(--green)" }}>No</span>
                  }
                </div>
              </div>
            </div>

            {/* Email Form */}
            <div style={{ marginTop: 24, padding: 16, background: "rgba(59,130,246,0.05)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.1)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--accent)" }}>Want an email notification?</div>
              {!emailSent ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. hehe34554@gmail.com"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px" }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !targetEmail}
                    style={{ padding: "8px 16px" }}
                  >
                    {sendingEmail ? "Sending..." : "Send"}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--green)" }}>✓ Email sent successfully</div>
              )}
            </div>

            <div className="action-btns">
              <button className="btn btn-ghost" onClick={() => navigateTo("claims")}>View All Claims</button>
              <button className="btn btn-ghost" onClick={handleReset}>New Claim</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}