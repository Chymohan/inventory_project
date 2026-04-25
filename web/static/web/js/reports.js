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

async function runReport(type, title) {
  const out = document.getElementById("rout");
  out.innerHTML = sp();
  try {
    let data;
    if (type === "stock") data = await api("/reports/stock/");
    else if (type === "movements") data = await api("/reports/movements/");
    else if (type === "lowstock") data = await api("/reports/low-stock/");
    else data = await api("/reports/value/");

    if (!Array.isArray(data)) {
      out.innerHTML = `<div class="rcard">
<div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px">${title}</div>
${Object.entries(data).map(([k, v]) =>
  `<div class="rkv"><span class="rkk">${k.replace(/_/g, " ")}</span><span class="rkv2">${typeof v === "number" ? money(v) : v}</span></div>`
).join("")}</div>`;
      return;
    }
    if (data.length === 0) {
      out.innerHTML = `<div class="rcard">${emp("No data for this report")}</div>`;
      return;
    }
    const keys = Object.keys(data[0]);
    out.innerHTML = `<div class="rcard">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
  <span style="font-family:'Space Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase">${title}</span>
  <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted2)">${data.length} records</span>
</div>
<div class="tw" style="border:none"><table>
  <thead><tr>${keys.map((k) => `<th>${k.toUpperCase()}</th>`).join("")}</tr></thead>
  <tbody>${data.map((row) => `<tr>${keys.map((k) => `<td>${row[k] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
</table></div>
</div>`;
  } catch (e) {
    out.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}
