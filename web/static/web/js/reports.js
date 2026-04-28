// ── reports.js ────────────────────────────────────────────────────────────────
import { api, sp, emp, money } from "./core.js";

export function renderReports() {
  const c = document.getElementById("content");
  c.innerHTML = `
<div class="rbtns">
  <button class="btn bp" onclick="window._runReport('stock','Stock per Warehouse')">Stock per Warehouse</button>
  <button class="btn bp" onclick="window._runReport('movements','Movement History')">Movement History</button>
  <button class="btn bp" onclick="window._runReport('lowstock','Low Stock Products')">Low Stock</button>
  <button class="btn bp" onclick="window._runReport('value','Inventory Value')">Inventory Value</button>
</div>
<div id="rout"></div>`;

  window._runReport = runReport;
}

// ── Current report state (for export) ────────────────────────────────────────
let _currentData = null;
let _currentTitle = "";
let _currentKeys = [];

async function runReport(type, title) {
  const out = document.getElementById("rout");
  out.innerHTML = sp();
  _currentData = null;
  _currentTitle = title;

  try {
    let data;
    if (type === "stock") data = await api("/reports/stock/");
    else if (type === "movements") data = await api("/reports/movements/");
    else if (type === "lowstock") data = await api("/reports/low-stock/");
    else data = await api("/reports/value/");

    // ── Non-array (inventory value) ───────────────────────────────────────────
    if (!Array.isArray(data)) {
      _currentData = [data];
      _currentKeys = Object.keys(data);
      out.innerHTML = `
<div class="rcard">
  <div class="rhdr">
    <span class="rlbl">${title}</span>
    <div class="rexp">
      <button class="btn bsm bg" onclick="window._exportCSV()">⬇ CSV</button>
      <button class="btn bsm bp" onclick="window._exportPDF()">⬇ PDF</button>
    </div>
  </div>
  ${Object.entries(data)
    .map(
      ([k, v]) =>
        `<div class="rkv"><span class="rkk">${k.replace(/_/g, " ")}</span><span class="rkv2">${typeof v === "number" ? money(v) : v}</span></div>`,
    )
    .join("")}
</div>`;
      bindExports();
      return;
    }

    // ── Empty ─────────────────────────────────────────────────────────────────
    if (data.length === 0) {
      out.innerHTML = `<div class="rcard">${emp("No data for this report")}</div>`;
      return;
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    _currentData = data;
    _currentKeys = Object.keys(data[0]);

    out.innerHTML = `
<div class="rcard">
  <div class="rhdr">
    <span class="rlbl">${title}</span>
    <div style="display:flex;align-items:center;gap:10px">
      <span class="rcnt">${data.length} records</span>
      <button class="btn bsm bg" onclick="window._exportCSV()">⬇ CSV</button>
      <button class="btn bsm bp" onclick="window._exportPDF()">⬇ PDF</button>
    </div>
  </div>
  <div class="tw" style="border:none"><table>
    <thead><tr>${_currentKeys.map((k) => `<th>${k.toUpperCase()}</th>`).join("")}</tr></thead>
    <tbody>${data
      .map(
        (row) =>
          `<tr>${_currentKeys.map((k) => `<td>${row[k] ?? "—"}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody>
  </table></div>
</div>`;

    bindExports();
  } catch (e) {
    out.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

// ── Bind export handlers ──────────────────────────────────────────────────────
function bindExports() {
  window._exportCSV = exportCSV;
  window._exportPDF = exportPDF;
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV() {
  if (!_currentData) return;
  const keys = _currentKeys;
  const rows = [
    keys.join(","),
    ..._currentData.map((row) =>
      keys
        .map((k) => {
          const val = row[k] ?? "";
          const s = String(val).replace(/"/g, '""');
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s}"`
            : s;
        })
        .join(","),
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${_currentTitle.replace(/\s+/g, "_")}_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF Export (using browser print with styled HTML) ─────────────────────────
function exportPDF() {
  if (!_currentData) return;
  const keys = _currentKeys;
  const isValueReport =
    _currentData.length === 1 && !Array.isArray(_currentData[0]);

  const tableHTML = isValueReport
    ? Object.entries(_currentData[0])
        .map(
          ([k, v]) => `
        <tr>
          <td style="font-weight:600;text-transform:capitalize;padding:10px 16px;border-bottom:1px solid #e0e0f0">${k.replace(/_/g, " ")}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e0e0f0;font-family:monospace;color:#7c6af7;font-size:18px;font-weight:700">${typeof v === "number" ? money(v) : v}</td>
        </tr>`,
        )
        .join("")
    : `<thead><tr>${keys
        .map(
          (k) =>
            `<th style="background:#7c6af7;color:#fff;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase">${k}</th>`,
        )
        .join("")}</tr></thead>
      <tbody>${_currentData
        .map(
          (row, i) =>
            `<tr style="background:${i % 2 === 0 ? "#f4f3ff" : "#fff"}">${keys
              .map(
                (k) =>
                  `<td style="padding:9px 14px;border-bottom:1px solid #e8e7ff;font-size:12px">${row[k] ?? "—"}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}</tbody>`;

  const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8"/>
<title>${_currentTitle}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#1a1a2e;background:#fff;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #7c6af7;margin-bottom:28px}
  .brand{font-size:28px;font-weight:800;color:#7c6af7;letter-spacing:.15em}
  .meta{text-align:right;font-size:11px;color:#888;line-height:1.8}
  h2{font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  .footer{margin-top:32px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:16px}
  @media print{body{padding:16px}}
</style>
</head><body>
<div class="header">
  <div class="brand">▦ STOCKR</div>
  <div class="meta">
    <div><strong>Report:</strong> ${_currentTitle}</div>
    <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    ${Array.isArray(_currentData) ? `<div><strong>Records:</strong> ${_currentData.length}</div>` : ""}
  </div>
</div>
<h2>${_currentTitle}</h2>
<table>${tableHTML}</table>
<div class="footer">STOCKR Inventory Management System — Confidential</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}
