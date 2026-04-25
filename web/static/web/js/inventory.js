// ── inventory.js ──────────────────────────────────────────────────────────────
import { api, load, bust, toast, openMod, closeMod, sp, emp } from "./core.js";

const SECTION = "inv-table";

async function refreshTable(rows, pMap, wMap) {
  const q = (document.getElementById("isrch") || {}).value || "";
  const filtered = rows.filter((r) =>
    (pMap[r.product] || "").toLowerCase().includes(q.toLowerCase()) ||
    (wMap[r.warehouse] || "").toLowerCase().includes(q.toLowerCase())
  );
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((r) => {
    const av = (r.quantity_on_hand || 0) - (r.quantity_reserved || 0);
    return `<tr>
      <td style="font-weight:600">${pMap[r.product] || r.product}</td>
      <td>${wMap[r.warehouse] || r.warehouse}</td>
      <td><span class="mono" style="font-weight:700;color:var(--accent-l)">${r.quantity_on_hand}</span></td>
      <td class="mono">${r.quantity_reserved || 0}</td>
      <td class="mono" style="font-weight:700;color:${av > 0 ? "var(--green)" : "var(--red)"}">${av}</td>
      <td style="font-size:11px;color:var(--muted2)">${r.last_updated ? new Date(r.last_updated).toLocaleString() : "—"}</td>
      <td><div class="tda">
        <button class="btn bsm bg" onclick='window._editInv(${JSON.stringify(r)})'>Edit</button>
        <button class="btn bsm bd" onclick="window._delInv(${r.id})">Del</button>
      </div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="7">${emp()}</td></tr>`;
}

export async function renderInventory() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const [inv, prods, whs] = await Promise.all([
      api("/inventory/"),
      load("/products/"),
      load("/warehouses/"),
    ]);
    const pMap = {}, wMap = {};
    prods.forEach((p) => (pMap[p.id] = p.name));
    whs.forEach((w) => (wMap[w.id] = w.name));
    let rows = [...inv];

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newInv()">+ New Inventory Record</button>
  <input class="si" id="isrch" placeholder="Filter by product or warehouse…" oninput="window._filterInv()"/>
</div>
<div class="tw"><table>
  <thead><tr><th>PRODUCT</th><th>WAREHOUSE</th><th>ON HAND</th><th>RESERVED</th><th>AVAILABLE</th><th>LAST UPDATED</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows, pMap, wMap);

    window._filterInv = () => refreshTable(rows, pMap, wMap);
    window._newInv = () => invForm(null, prods, whs, async () => {
      bust(); rows = [...(await api("/inventory/"))]; refreshTable(rows, pMap, wMap);
    });
    window._editInv = (r) => invForm(r, prods, whs, async () => {
      bust(); rows = [...(await api("/inventory/"))]; refreshTable(rows, pMap, wMap);
    });
    window._delInv = async (id) => {
      if (!confirm("Delete this inventory record?")) return;
      try {
        await api("/inventory/" + id + "/", { method: "DELETE" });
        bust(); toast("Deleted");
        rows = rows.filter((r) => r.id !== id);
        refreshTable(rows, pMap, wMap);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function invForm(r, prods, whs, onSaved) {
  const prodOpts = prods.map((p) => `<option value="${p.id}"${r && r.product == p.id ? " selected" : ""}>${p.name}</option>`).join("");
  const whOpts = whs.map((w) => `<option value="${w.id}"${r && r.warehouse == w.id ? " selected" : ""}>${w.name}</option>`).join("");
  openMod(`
<div class="mt">${r ? "Edit Inventory Record" : "New Inventory Record"}</div>
<div class="fg one">
  <div class="fgrp"><label class="fl">Product</label><select class="fc" id="f_iprod"${r ? " disabled" : ""}><option value="">— select —</option>${prodOpts}</select></div>
  <div class="fgrp"><label class="fl">Warehouse</label><select class="fc" id="f_iwh"${r ? " disabled" : ""}><option value="">— select —</option>${whOpts}</select></div>
  <div class="fgrp"><label class="fl">Qty On Hand</label><input class="fc" id="f_iqoh" type="number" min="0" value="${r ? r.quantity_on_hand : 0}"/></div>
  <div class="fgrp"><label class="fl">Qty Reserved</label><input class="fc" id="f_iqres" type="number" min="0" value="${r ? r.quantity_reserved || 0 : 0}"/></div>
  <div class="fgrp"><label class="fl">Qty Available</label><input class="fc" id="f_iqav" type="number" min="0" value="${r ? r.quantity_available || 0 : 0}"/></div>
</div>
<div class="ma">
  <button class="btn bp" id="saveInvBtn">${r ? "Save Changes" : "Create"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("saveInvBtn").onclick = async () => {
    const prodVal = r ? r.product : parseInt(document.getElementById("f_iprod").value);
    const whVal = r ? r.warehouse : parseInt(document.getElementById("f_iwh").value);
    const qoh = parseInt(document.getElementById("f_iqoh").value) || 0;
    const qres = parseInt(document.getElementById("f_iqres").value) || 0;
    const qav = parseInt(document.getElementById("f_iqav").value);
    if (!prodVal || !whVal) { toast("Product and Warehouse are required", "err"); return; }
    const body = {
      product: prodVal, warehouse: whVal,
      quantity_on_hand: qoh, quantity_reserved: qres,
      quantity_available: isNaN(qav) || qav === 0 ? Math.max(0, qoh - qres) : qav,
    };
    try {
      if (r) await api("/inventory/" + r.id + "/", { method: "PATCH", body: JSON.stringify(body) });
      else await api("/inventory/", { method: "POST", body: JSON.stringify(body) });
      toast(r ? "Inventory updated" : "Inventory record created");
      closeMod();
      await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
