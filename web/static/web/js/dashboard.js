// ── dashboard.js ──────────────────────────────────────────────────────────────
import { api, sp, emp, money, pill } from "./core.js";

export async function renderDash() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const [val, low, stock, moves, pos, sos] = await Promise.all([
      api("/reports/value/").catch(() => ({ total_value: 0 })),
      api("/reports/low-stock/").catch(() => []),
      api("/reports/stock/").catch(() => []),
      api("/reports/movements/").catch(() => []),
      api("/purchase-orders/").catch(() => []),
      api("/sale-orders/").catch(() => []),
    ]);
    const whMap = {};
    stock.forEach((s) => { whMap[s.warehouse] = (whMap[s.warehouse] || 0) + s.on_hand; });
    const maxWh = Math.max(...Object.values(whMap), 1);
    const pendPO = pos.filter((o) => o.status === "DRAFT" || o.status === "SENT").length;
    const pendSO = sos.filter((o) => o.status === "PENDING" || o.status === "SHIPPED").length;

    c.innerHTML = `
<div class="dg">
  <div class="sc" style="--c:#7c6af7"><div class="si2">◈</div><div class="slbl">Inventory Value</div><div class="sval">$${Number(val.total_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
  <div class="sc" style="--c:#f5a623"><div class="si2">⚠</div><div class="slbl">Low Stock Items</div><div class="sval">${low.length}</div></div>
  <div class="sc" style="--c:#1fd4a0"><div class="si2">↓</div><div class="slbl">Open Purchase Orders</div><div class="sval">${pendPO}</div></div>
  <div class="sc" style="--c:#4db8ff"><div class="si2">↑</div><div class="slbl">Open Sale Orders</div><div class="sval">${pendSO}</div></div>
</div>
<div class="dr">
  <div class="dc">
    <h3>⚠ Low Stock Alerts</h3>
    ${low.length === 0
      ? '<div class="emp" style="padding:16px;font-size:11px">✓ All products well-stocked</div>'
      : low.map((p) =>
          `<div class="ar"><span style="font-size:13px">${p.product}</span><span style="display:flex;align-items:center;gap:8px"><span class="mono" style="font-size:11px;color:var(--muted2)">reorder:${p.reorder_level}</span><span class="mono" style="color:var(--red);font-weight:700">${p.stock}</span></span></div>`
        ).join("")
    }
  </div>
  <div class="dc">
    <h3>⌂ Stock by Warehouse</h3>
    ${Object.entries(whMap).map(([wh, qty]) => `
      <div class="br">
        <span class="bl" title="${wh}">${wh}</span>
        <div class="bt"><div class="bf" style="width:${Math.round((qty / maxWh) * 100)}%"></div></div>
        <span class="bv">${qty}</span>
      </div>`).join("") || '<div class="emp" style="padding:12px">No data</div>'
    }
  </div>
</div>
<div class="dc">
  <h3>⇌ Recent Stock Movements</h3>
  ${moves.slice(0, 10).map((m) => `
    <div class="ar">
      <span style="font-size:13px">${m.product}</span>
      <span style="display:flex;align-items:center;gap:10px">
        <span style="font-size:11px;color:var(--muted2);font-family:'Space Mono',monospace">${m.warehouse || ""}</span>
        ${pill(m.type)}
        <span class="mono" style="font-size:12px;font-weight:700;color:${m.type === "IN" ? "var(--green)" : "var(--red)"}">${m.type === "IN" ? "+" : "−"}${m.qty}</span>
        <span style="font-size:11px;color:var(--muted2);font-family:'Space Mono',monospace">${m.reference || ""}</span>
      </span>
    </div>`).join("") || '<div class="emp" style="padding:12px">No movements yet</div>'
  }
</div>`;
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}
