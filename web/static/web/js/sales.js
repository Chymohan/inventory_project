// ── sales.js ──────────────────────────────────────────────────────────────────
import { api, load, bust, toast, openMod, closeMod, sp, emp, money, pill } from "./core.js";

const SECTION = "so-table";

async function refreshTable(rows, whs) {
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = rows.map((o) => `<tr>
    <td class="mono" style="font-weight:700">${o.order_number}</td>
    <td>${o.customer_name || "—"}</td>
    <td>${pill(o.status)}</td>
    <td class="mono" style="font-size:12px">${o.order_date || "—"}</td>
    <td class="mono">${money(o.total_amount)}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick="window._viewSO(${o.id})">View</button>
      ${o.status !== "DELIVERED" ? `<button class="btn bsm bsu" onclick="window._fulfillSO(${o.id})">Fulfill</button>` : ""}
    </div></td>
  </tr>`).join("") || `<tr><td colspan="6">${emp()}</td></tr>`;
}

export async function renderSales() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const [sos, whs] = await Promise.all([
      api("/sale-orders/"),
      load("/warehouses/"),
    ]);
    let rows = [...sos];

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newSO()">+ New Sale Order</button>
</div>
<div class="tw"><table>
  <thead><tr><th>ORDER #</th><th>CUSTOMER</th><th>STATUS</th><th>DATE</th><th>TOTAL</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows, whs);

    window._newSO = () => soForm(async () => {
      bust(); rows = await api("/sale-orders/"); refreshTable(rows, whs);
    });

    window._viewSO = (id) => {
      const o = rows.find((x) => x.id === id);
      openMod(`
<div class="mt">Sale Order — ${o.order_number}</div>
<div class="drow"><span class="dk">Customer</span><span class="dv">${o.customer_name}</span></div>
<div class="drow"><span class="dk">Status</span><span class="dv">${pill(o.status)}</span></div>
<div class="drow"><span class="dk">Order Date</span><span class="dv mono">${o.order_date}</span></div>
<div class="drow"><span class="dk">Total Amount</span><span class="dv mono" style="color:var(--accent)">${money(o.total_amount)}</span></div>
<div class="ma"><button class="btn bg" onclick="window._closeMod()">Close</button></div>`);
      window._closeMod = closeMod;
    };

    window._fulfillSO = (id) => {
      const wOpts = whs.map((w) => `<option value="${w.id}">${w.name}</option>`).join("");
      openMod(`
<div class="mt">Fulfill Sale Order #${id}</div>
<p style="color:var(--muted2);font-size:13px;margin-bottom:16px">Stock will be deducted from the selected warehouse.</p>
<div class="fgrp">
  <label class="fl">Source Warehouse</label>
  <select class="fc" id="wh_so"><option value="">— Select —</option>${wOpts}</select>
</div>
<div class="ma">
  <button class="btn bp" id="confirmFulfillBtn">✓ Confirm Fulfill</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
      window._closeMod = closeMod;
      document.getElementById("confirmFulfillBtn").onclick = async () => {
        const wh = document.getElementById("wh_so").value;
        if (!wh) { toast("Select a warehouse", "err"); return; }
        try {
          const r = await api("/sale-orders/" + id + "/fulfill/", {
            method: "POST",
            body: JSON.stringify({ warehouse: parseInt(wh) }),
          });
          toast(r.message || "Order fulfilled");
          bust(); closeMod();
          rows = await api("/sale-orders/");
          refreshTable(rows, whs);
        } catch (e) { toast(e.message, "err"); }
      };
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

async function soForm(onSaved) {
  const today = new Date().toISOString().split("T")[0];
  let soItems = [];

  async function drawSOItems() {
    const prods = await load("/products/");
    const pOpts = prods.map((p) => `<option value="${p.id}" data-price="${p.unit_price}">${p.name} (${p.sku})</option>`).join("");
    const rows = soItems.map((it, i) => {
      const prod = prods.find((p) => p.id == it.product);
      return `<tr>
        <td>${prod?.name || "?"}</td>
        <td class="mono">${it.quantity}</td>
        <td class="mono">${money(it.unit_price)}</td>
        <td class="mono" style="color:var(--accent)">${money(it.quantity * it.unit_price)}</td>
        <td><button class="btn bsm bd" onclick="window._rmSOItem(${i})">✕</button></td>
      </tr>`;
    }).join("");

    document.getElementById("so_items_area").innerHTML = `
<table class="items-tbl">
  <thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT PRICE</th><th>SUBTOTAL</th><th></th></tr></thead>
  <tbody>${rows || `<tr><td colspan="5" style="text-align:center;padding:12px;color:var(--muted2);font-size:12px">No items</td></tr>`}</tbody>
</table>
<div class="add-item-row" style="margin-top:10px">
  <div class="fgrp"><label class="fl">Product</label><select class="fc" id="sni_p"><option value="">— select —</option>${pOpts}</select></div>
  <div class="fgrp"><label class="fl">Qty</label><input class="fc" type="number" id="sni_q" min="1" value="1"/></div>
  <div class="fgrp"><label class="fl">Unit Price</label><input class="fc" type="number" id="sni_up" step="0.01" placeholder="0.00"/></div>
  <button class="btn bsu" style="margin-top:auto" onclick="window._addSOItem()">+ Add</button>
</div>
<div style="text-align:right;margin-top:10px;font-family:'Space Mono',monospace;font-size:13px;color:var(--accent)">
  Total: ${money(soItems.reduce((s, i) => s + i.quantity * i.unit_price, 0))}
</div>`;

    document.getElementById("sni_p").onchange = function () {
      const price = this.options[this.selectedIndex].getAttribute("data-price");
      if (price) document.getElementById("sni_up").value = price;
    };
    window._rmSOItem = (i) => { soItems.splice(i, 1); drawSOItems(); };
    window._addSOItem = () => {
      const pid = document.getElementById("sni_p").value;
      const qty = parseInt(document.getElementById("sni_q").value) || 0;
      const up = parseFloat(document.getElementById("sni_up").value) || 0;
      if (!pid || qty <= 0) { toast("Select product and valid quantity", "err"); return; }
      soItems.push({ product: parseInt(pid), quantity: qty, unit_price: up });
      drawSOItems();
    };
  }

  openMod(`
<div class="mt">New Sale Order</div>
<div class="fg">
  <div class="fgrp"><label class="fl">Order Number</label><input class="fc" id="f_son" placeholder="SO-2025-001"/></div>
  <div class="fgrp"><label class="fl">Customer Name</label><input class="fc" id="f_cust" placeholder="Customer name"/></div>
  <div class="fgrp"><label class="fl">Order Date</label><input class="fc" type="date" id="f_sod" value="${today}"/></div>
  <div class="fgrp"><label class="fl">Status</label>
    <select class="fc" id="f_sst">
      <option value="PENDING">Pending</option>
      <option value="SHIPPED">Shipped</option>
      <option value="DELIVERED">Delivered</option>
    </select>
  </div>
</div>
<div style="margin-top:18px;margin-bottom:6px;font-family:'Space Mono',monospace;font-size:10px;color:var(--muted2);letter-spacing:.1em;text-transform:uppercase">ORDER ITEMS</div>
<div id="so_items_area"></div>
<div class="ma" style="margin-top:18px">
  <button class="btn bp" id="saveSOBtn">Create Sale Order</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  drawSOItems();

  document.getElementById("saveSOBtn").onclick = async () => {
    const son = document.getElementById("f_son").value.trim();
    const cust = document.getElementById("f_cust").value.trim();
    const od = document.getElementById("f_sod").value;
    const st = document.getElementById("f_sst").value;
    if (!son || !cust || !od) { toast("Fill all required fields", "err"); return; }
    if (soItems.length === 0) { toast("Add at least one item", "err"); return; }
    const total = soItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const body = {
      order_number: son, customer_name: cust, status: st,
      order_date: od, total_amount: total.toFixed(2), user: 1, items: soItems,
    };
    try {
      await api("/sale-orders/", { method: "POST", body: JSON.stringify(body) });
      toast("Sale order created");
      bust(); closeMod(); await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
