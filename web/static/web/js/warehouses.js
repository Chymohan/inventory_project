// ── warehouses.js ─────────────────────────────────────────────────────────────
import { api, bust, toast, openMod, closeMod, sp, emp } from "./core.js";

const SECTION = "wh-table";

async function refreshTable(rows) {
  const q = (document.getElementById("wsrch") || {}).value || "";
  const filtered = rows.filter((w) =>
    [w.name, w.manager_name].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((w) => `<tr>
    <td style="font-weight:600">${w.name}</td>
    <td>${w.manager_name || "—"}</td>
    <td style="font-size:12px;color:var(--muted2)">${w.address || "—"}</td>
    <td>${w.is_active ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✗</span>'}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick='window._editWH(${JSON.stringify(w)})'>Edit</button>
      <button class="btn bsm bd" onclick="window._delWH(${w.id})">Del</button>
    </div></td>
  </tr>`).join("") || `<tr><td colspan="5">${emp()}</td></tr>`;
}

export async function renderWarehouses() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    let rows = await api("/warehouses/");

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newWH()">+ New Warehouse</button>
  <input class="si" id="wsrch" placeholder="Search warehouses…" oninput="window._filterWH()"/>
</div>
<div class="tw"><table>
  <thead><tr><th>NAME</th><th>MANAGER</th><th>ADDRESS</th><th>ACTIVE</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows);

    window._filterWH = () => refreshTable(rows);
    window._newWH = () => whForm(null, async () => {
      bust(); rows = await api("/warehouses/"); refreshTable(rows);
    });
    window._editWH = (w) => whForm(w, async () => {
      bust(); rows = await api("/warehouses/"); refreshTable(rows);
    });
    window._delWH = async (id) => {
      if (!confirm("Delete warehouse?")) return;
      try {
        await api("/warehouses/" + id + "/", { method: "DELETE" });
        bust(); toast("Deleted");
        rows = rows.filter((r) => r.id !== id);
        refreshTable(rows);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function whForm(w, onSaved) {
  openMod(`
<div class="mt">${w ? "Edit Warehouse" : "New Warehouse"}</div>
<div class="fg one">
  <div class="fgrp"><label class="fl">Name</label><input class="fc" id="f_wn" value="${w ? w.name : ""}" placeholder="Main Warehouse"/></div>
  <div class="fgrp"><label class="fl">Manager Name</label><input class="fc" id="f_wm" value="${w ? w.manager_name || "" : ""}" placeholder="Manager name"/></div>
  <div class="fgrp"><label class="fl">Address</label><textarea class="fc" id="f_wa">${w ? w.address || "" : ""}</textarea></div>
  <div class="fgrp"><label class="fl">Active</label><select class="fc" id="f_wact"><option value="true"${!w || w.is_active ? " selected" : ""}>Yes</option><option value="false"${w && !w.is_active ? " selected" : ""}>No</option></select></div>
</div>
<div class="ma">
  <button class="btn bp" id="saveWHBtn">${w ? "Save Changes" : "Create"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("saveWHBtn").onclick = async () => {
    const body = {
      name: document.getElementById("f_wn").value,
      manager_name: document.getElementById("f_wm").value,
      address: document.getElementById("f_wa").value,
      is_active: document.getElementById("f_wact").value === "true",
    };
    if (!body.name) { toast("Name is required", "err"); return; }
    try {
      if (w) await api("/warehouses/" + w.id + "/", { method: "PUT", body: JSON.stringify(body) });
      else await api("/warehouses/", { method: "POST", body: JSON.stringify(body) });
      toast(w ? "Updated" : "Created");
      closeMod();
      await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
