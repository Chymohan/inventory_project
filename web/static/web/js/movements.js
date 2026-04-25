// ── movements.js ──────────────────────────────────────────────────────────────
import { api, sp, emp, pill } from "./core.js";

const SECTION = "mv-table";

function refreshTable(rows) {
  const q = (document.getElementById("mvsrch") || {}).value || "";
  const t = (document.getElementById("mvtype") || {}).value || "";
  const filtered = rows.filter((r) =>
    (!q || (r.product || "").toLowerCase().includes(q.toLowerCase())) &&
    (!t || r.type === t)
  );
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  const countEl = document.getElementById("mv-count");
  if (countEl) countEl.textContent = `${filtered.length} records`;
  tbody.innerHTML = filtered.map((m) => `<tr>
    <td style="font-weight:600">${m.product || "—"}</td>
    <td style="color:var(--muted2);font-size:12px">${m.warehouse || "—"}</td>
    <td>${pill(m.type)}</td>
    <td class="mono" style="font-weight:700;color:${m.type === "IN" ? "var(--green)" : "var(--red)"}">${m.type === "IN" ? "+" : "−"}${m.qty}</td>
    <td class="mono" style="font-size:11px;color:var(--muted2)">${m.reference || "—"}</td>
    <td style="font-size:11px;color:var(--muted2)">${m.moved_at ? new Date(m.moved_at).toLocaleString() : "—"}</td>
  </tr>`).join("") || `<tr><td colspan="6">${emp()}</td></tr>`;
}

export async function renderMovements() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const data = await api("/reports/movements/");
    const rows = [...data];

    c.innerHTML = `
<div class="tb">
  <input class="si" id="mvsrch" placeholder="Filter by product…" oninput="window._filterMv()"/>
  <select class="fc" id="mvtype" style="width:130px" onchange="window._filterMv()">
    <option value="">All Types</option>
    <option value="IN">IN only</option>
    <option value="OUT">OUT only</option>
  </select>
  <span id="mv-count" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted2);margin-left:auto"></span>
</div>
<div class="tw"><table>
  <thead><tr><th>PRODUCT</th><th>WAREHOUSE</th><th>TYPE</th><th>QUANTITY</th><th>REFERENCE</th><th>DATE</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    refreshTable(rows);
    window._filterMv = () => refreshTable(rows);
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}
