import React, { useState, useMemo } from "react";
import ClaimModal from "./ClaimModal";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SkeletonTableRow } from "./SkeletonLoader";

const STATUS_OPTIONS = ["", "Pending", "Under Review", "Approved", "Rejected"];

function damageBadge(damage) {
  if (damage === "Severe")   return "badge badge-red";
  if (damage === "Moderate") return "badge badge-amber";
  return "badge badge-green";
}

function decisionBadge(decision) {
  if (decision === "Replace")        return "badge badge-red";
  if (decision === "Partial Refund") return "badge badge-amber";
  return "badge badge-blue";
}

function statusBadge(status) {
  if (status === "Approved")     return "badge badge-green";
  if (status === "Rejected")     return "badge badge-red";
  if (status === "Under Review") return "badge badge-amber";
  return "badge badge-gray";
}

/* ── Export CSV ── */
function exportCSV(claims) {
  const rows = claims.map((c) => ({
    "Claim ID":      `#${String(c.id).padStart(5, "0")}`,
    "Damage":        c.damage,
    "Severity":      c.severity,
    "Decision":      c.decision,
    "Manual Review": c.manual_intervention ? "Yes" : "No",
    "Status":        c.status || "Pending",
    "AI Powered":    c.ai_powered ? "Yes" : "No",
    "AI Explanation": c.explanation || "",
    "Time":          c.time ? new Date(c.time).toLocaleString("en-GB") : "",
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `tyreguard-claims-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ── Export PDF ── */
function exportPDF(claims) {
  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFillColor(17, 20, 24);
  doc.rect(0, 0, 300, 20, "F");
  doc.setTextColor(232, 237, 242);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TyreGuard AI — Claims Report", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 106, 126);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 200, 13);

  autoTable(doc, {
    startY: 24,
    head: [["Claim ID", "Damage", "Severity", "Decision", "Manual", "Status", "AI", "Time"]],
    body: claims.map((c) => [
      `#${String(c.id).padStart(5, "0")}`,
      c.damage,
      `${c.severity}/100`,
      c.decision,
      c.manual_intervention ? "Yes" : "No",
      c.status || "Pending",
      c.ai_powered ? "Yes" : "No",
      c.time ? new Date(c.time).toLocaleString("en-GB") : "—",
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [31, 38, 48], textColor: [232, 237, 242], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [17, 20, 24] },
    bodyStyles: { textColor: [138, 154, 176] },
    columnStyles: {
      2: { halign: "center" },
      4: { halign: "center" },
      6: { halign: "center" },
    },
  });

  doc.save(`tyreguard-claims-${Date.now()}.pdf`);
}

const PAGE_SIZE = 10;

export default function AllClaims({ claims, navigateTo, onStatusChange, showToast, loading }) {
  const [search, setSearch]       = useState("");
  const [sevFilter, setSev]       = useState("");
  const [decFilter, setDec]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);   // claim for modal
  const [sortKey, setSortKey]     = useState("id");
  const [sortDir, setSortDir]     = useState("desc");

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...claims];

    // Filter
    list = list.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(c.id).includes(q) ||
        c.damage.toLowerCase().includes(q) ||
        c.decision.toLowerCase().includes(q) ||
        (c.explanation || "").toLowerCase().includes(q);
      const matchSev    = !sevFilter    || c.damage    === sevFilter;
      const matchDec    = !decFilter    || c.decision  === decFilter;
      const matchStatus = !statusFilter || (c.status || "Pending") === statusFilter;
      return matchSearch && matchSev && matchDec && matchStatus;
    });

    // Sort
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "id" || sortKey === "severity") { av = Number(av); bv = Number(bv); }
      else { av = String(av || ""); bv = String(bv || ""); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  }, [claims, search, sevFilter, decFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }) => (
    <span style={{ marginLeft: 4, opacity: sortKey === k ? 1 : 0.3, fontSize: 10 }}>
      {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div>
      {/* Filter row */}
      <div className="filter-row">
        <input
          id="claims-search"
          className="search-input"
          placeholder="Search by ID, damage, decision, explanation..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select id="sev-filter"    className="filter-select" value={sevFilter}    onChange={(e) => { setSev(e.target.value); setPage(1); }}>
          <option value="">All Severities</option>
          <option>Severe</option><option>Moderate</option><option>Minor</option>
        </select>
        <select id="dec-filter"    className="filter-select" value={decFilter}    onChange={(e) => { setDec(e.target.value); setPage(1); }}>
          <option value="">All Decisions</option>
          <option>Replace</option><option>Partial Refund</option><option>Manual Review</option>
        </select>
        <select id="status-filter" className="filter-select" value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option>Pending</option><option>Under Review</option><option>Approved</option><option>Rejected</option>
        </select>
        <span className="claims-count-label">{filtered.length} claim{filtered.length !== 1 ? "s" : ""}</span>

        {/* Export buttons */}
        <button id="export-csv" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => exportCSV(filtered)} title="Export to CSV">
          ⬇ CSV
        </button>
        <button id="export-pdf" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => exportPDF(filtered)} title="Export to PDF">
          ⬇ PDF
        </button>
        <button id="new-claim-btn" className="btn btn-primary" onClick={() => navigateTo("upload")}>
          + New Claim
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("id")}>Claim ID <SortIcon k="id" /></th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("damage")}>Damage <SortIcon k="damage" /></th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("severity")}>Severity <SortIcon k="severity" /></th>
                <th>Decision</th>
                <th>Manual</th>
                <th>Status</th>
                <th>AI</th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("time")}>Time <SortIcon k="time" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-icon">☁</div>
                      <div className="empty-text">
                        {claims.length === 0 ? "No claims submitted yet" : "No claims match your filters"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((c) => {
                  const sevColor =
                    c.damage === "Severe" ? "var(--red)" :
                    c.damage === "Moderate" ? "var(--amber)" : "var(--green)";
                  const t = c.time
                    ? new Date(c.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                    : "—";
                  return (
                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                      <td className="td-mono">#{String(c.id).padStart(5, "0")}</td>
                      <td><span className={damageBadge(c.damage)}>{c.damage}</span></td>
                      <td style={{ minWidth: 130 }}>
                        <div className="severity-bar-inline">
                          <div className="severity-bar-track">
                            <div className="severity-bar-fill" style={{ width: `${c.severity}%`, background: sevColor }} />
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
                      <td><span className={statusBadge(c.status || "Pending")}>{c.status || "Pending"}</span></td>
                      <td>
                        {c.ai_powered
                          ? <span className="badge badge-blue" style={{ fontSize: 10 }}>✦ Gemini</span>
                          : <span style={{ color: "var(--text3)", fontSize: 11 }}>Heuristic</span>
                        }
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text3)" }}>{t}</td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-row">
          <button
            className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }}
            disabled={page === 1} onClick={() => setPage((p) => p - 1)}
          >← Prev</button>
          <span style={{ fontSize: 13, color: "var(--text3)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: 12 }}
            disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
          >Next →</button>
        </div>
      )}

      {/* Claim detail modal */}
      {selected && (
        <ClaimModal
          claim={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => {
            onStatusChange(id, status);
            setSelected((prev) => prev ? { ...prev, status } : null);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}