// ── purchase.js ───────────────────────────────────────────────────────────────
import { api, load, bust, toast, openMod, closeMod, sp, emp, money, pill } from "./core.js";

const SECTION = "po-table";

async function refreshTable(rows, sMap, whs) {
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = rows.map((o) => `<tr>
    <td class="mono" style="font-weight:700">${o.po_number}</td>
    <td>${sMap[o.supplier] || "—"}</td>
    <td>${pill(o.status)}</td>
    <td class="mono" style="font-size:12px">${o.order_date || "—"}</td>
    <td class="mono" style="font-size:12px">${o.expected_date || "—"}</td>
    <td class="mono">${money(o.total_amount)}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick="window._viewPO(${o.id})">View</button>
      ${o.status !== "RECEIVED" ? `<button class="btn bsm bsu" onclick="window._receivePO(${o.id})">Receive</button>` : ""}
    </div></td>
  </tr>`).join("") || `<tr><td colspan="7">${emp()}</td></tr>`;
}

export async function renderPurchase() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const [pos, supps, whs] = await Promise.all([
      api("/purchase-orders/"),
      load("/suppliers/"),
      load("/warehouses/"),
    ]);
    const sMap = {};
    supps.forEach((s) => (sMap[s.id] = s.name));
    let rows = [...pos];

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newPO()">+ New Purchase Order</button>
</div>
<div class="tw"><table>
  <thead><tr><th>PO NUMBER</th><th>SUPPLIER</th><th>STATUS</th><th>ORDER DATE</th><th>EXPECTED</th><th>TOTAL</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows, sMap, whs);

    window._newPO = () => poForm(supps, async () => {
      bust(); rows = await api("/purchase-orders/"); refreshTable(rows, sMap, whs);
    });

    window._viewPO = (id) => {
      const o = rows.find((x) => x.id === id);
      openMod(`
<div class="mt">Purchase Order — ${o.po_number}</div>
<div class="drow"><span class="dk">Supplier</span><span class="dv">${sMap[o.supplier] || "—"}</span></div>
<div class="drow"><span class="dk">Status</span><span class="dv">${pill(o.status)}</span></div>
<div class="drow"><span class="dk">Order Date</span><span class="dv mono">${o.order_date}</span></div>
<div class="drow"><span class="dk">Expected Date</span><span class="dv mono">${o.expected_date || "—"}</span></div>
<div class="drow"><span class="dk">Total Amount</span><span class="dv mono" style="color:var(--accent)">${money(o.total_amount)}</span></div>
<div class="ma"><button class="btn bg" onclick="window._closeMod()">Close</button></div>`);
      window._closeMod = closeMod;
    };

    window._receivePO = (id) => {
      const wOpts = whs.map((w) => `<option value="${w.id}">${w.name}</option>`).join("");
      openMod(`
<div class="mt">Receive Stock — PO #${id}</div>
<p style="color:var(--muted2);font-size:13px;margin-bottom:16px">Stock from all items will be added to the selected warehouse.</p>
<div class="fgrp">
  <label class="fl">Destination Warehouse</label>
  <select class="fc" id="wh_sel"><option value="">— Select —</option>${wOpts}</select>
</div>
<div class="ma">
  <button class="btn bp" id="confirmReceiveBtn">✓ Confirm Receive</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
      window._closeMod = closeMod;
      document.getElementById("confirmReceiveBtn").onclick = async () => {
        const wh = document.getElementById("wh_sel").value;
        if (!wh) { toast("Select a warehouse", "err"); return; }
        try {
          const r = await api("/purchase-orders/" + id + "/receive/", {
            method: "POST",
            body: JSON.stringify({ warehouse: parseInt(wh) }),
          });
          toast(r.message || "Stock received");
          bust(); closeMod();
          rows = await api("/purchase-orders/");
          refreshTable(rows, sMap, whs);
        } catch (e) { toast(e.message, "err"); }
      };
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function poForm(supps, onSaved) {
  const sOpts = supps.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  const today = new Date().toISOString().split("T")[0];
  let poItems = [];

  async function drawItems() {
    const prods = await load("/products/");
    const pOpts = prods.map((p) => `<option value="${p.id}" data-cost="${p.cost_price}">${p.name} (${p.sku})</option>`).join("");
    const itemRows = poItems.map((it, i) => `
<tr>
  <td>${prods.find((p) => p.id == it.product)?.name || "?"}</td>
  <td class="mono">${it.quantity_ordered}</td>
  <td class="mono">${money(it.unit_cost)}</td>
  <td class="mono" style="color:var(--accent)">${money(it.quantity_ordered * it.unit_cost)}</td>
  <td><button class="btn bsm bd" onclick="window._rmPOItem(${i})">✕</button></td>
</tr>`).join("");

    document.getElementById("items_area").innerHTML = `
<table class="items-tbl">
  <thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT COST</th><th>SUBTOTAL</th><th></th></tr></thead>
  <tbody>${itemRows || `<tr><td colspan="5" style="text-align:center;padding:12px;color:var(--muted2);font-size:12px">No items added</td></tr>`}</tbody>
</table>
<div class="add-item-row" style="margin-top:10px">
  <div class="fgrp"><label class="fl">Product</label><select class="fc" id="ni_prod"><option value="">— select —</option>${pOpts}</select></div>
  <div class="fgrp"><label class="fl">Qty</label><input class="fc" type="number" id="ni_qty" min="1" value="1"/></div>
  <div class="fgrp"><label class="fl">Unit Cost</label><input class="fc" type="number" id="ni_cost" step="0.01" placeholder="0.00"/></div>
  <button class="btn bsu" style="margin-top:auto" onclick="window._addPOItem()">+ Add</button>
</div>
<div style="text-align:right;margin-top:10px;font-family:'Space Mono',monospace;font-size:13px;color:var(--accent)">
  Total: ${money(poItems.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0))}
</div>`;

    document.getElementById("ni_prod").onchange = function () {
      const cost = this.options[this.selectedIndex].getAttribute("data-cost");
      if (cost) document.getElementById("ni_cost").value = cost;
    };
    window._rmPOItem = (i) => { poItems.splice(i, 1); drawItems(); };
    window._addPOItem = () => {
      const pid = document.getElementById("ni_prod").value;
      const qty = parseInt(document.getElementById("ni_qty").value) || 0;
      const cost = parseFloat(document.getElementById("ni_cost").value) || 0;
      if (!pid || qty <= 0) { toast("Select product and valid quantity", "err"); return; }
      poItems.push({ product: parseInt(pid), quantity_ordered: qty, unit_cost: cost });
      drawItems();
    };
  }

  openMod(`
<div class="mt">New Purchase Order</div>
<div class="fg">
  <div class="fgrp"><label class="fl">PO Number</label><input class="fc" id="f_pon" placeholder="PO-2025-001"/></div>
  <div class="fgrp"><label class="fl">Supplier</label><select class="fc" id="f_sup"><option value="">— select —</option>${sOpts}</select></div>
  <div class="fgrp"><label class="fl">Order Date</label><input class="fc" type="date" id="f_od" value="${today}"/></div>
  <div class="fgrp"><label class="fl">Expected Date</label><input class="fc" type="date" id="f_ed"/></div>
</div>
<div style="margin-top:18px;margin-bottom:6px;font-family:'Space Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase">ORDER ITEMS</div>
<div id="items_area"></div>
<div class="ma" style="margin-top:18px">
  <button class="btn bp" id="savePOBtn">Create Purchase Order</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  drawItems();

  document.getElementById("savePOBtn").onclick = async () => {
    const pon = document.getElementById("f_pon").value.trim();
    const sup = document.getElementById("f_sup").value;
    const od = document.getElementById("f_od").value;
    const ed = document.getElementById("f_ed").value;
    if (!pon || !sup || !od) { toast("Fill PO number, supplier and order date", "err"); return; }
    if (poItems.length === 0) { toast("Add at least one item", "err"); return; }
    const total = poItems.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0);
    const body = {
      po_number: pon, supplier: parseInt(sup), status: "DRAFT",
      order_date: od, expected_date: ed || null,
      total_amount: total.toFixed(2), user: 1, items: poItems,
    };
    try {
      await api("/purchase-orders/", { method: "POST", body: JSON.stringify(body) });
      toast("Purchase order created");
      bust(); closeMod(); await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
