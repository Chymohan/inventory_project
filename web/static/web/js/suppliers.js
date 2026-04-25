// ── suppliers.js ──────────────────────────────────────────────────────────────
import { api, bust, toast, openMod, closeMod, sp, emp } from "./core.js";

const SECTION = "supp-table";

async function refreshTable(rows) {
  const q = (document.getElementById("ssrch") || {}).value || "";
  const filtered = rows.filter((r) =>
    [r.name, r.email, r.contact_name].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((s) => `<tr>
    <td style="font-weight:600">${s.name}</td>
    <td>${s.contact_name || "—"}</td>
    <td style="font-size:12px">${s.email || "—"}</td>
    <td class="mono" style="font-size:12px">${s.phone || "—"}</td>
    <td>${s.is_active ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✗</span>'}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick='window._editSupp(${JSON.stringify(s)})'>Edit</button>
      <button class="btn bsm bd" onclick="window._delSupp(${s.id})">Del</button>
    </div></td>
  </tr>`).join("") || `<tr><td colspan="6">${emp()}</td></tr>`;
}

export async function renderSuppliers() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    let rows = await api("/suppliers/");

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newSupp()">+ New Supplier</button>
  <input class="si" id="ssrch" placeholder="Search suppliers…" oninput="window._filterSupp()"/>
</div>
<div class="tw"><table>
  <thead><tr><th>NAME</th><th>CONTACT</th><th>EMAIL</th><th>PHONE</th><th>ACTIVE</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows);

    window._filterSupp = () => refreshTable(rows);
    window._newSupp = () => suppForm(null, async () => {
      bust(); rows = await api("/suppliers/"); refreshTable(rows);
    });
    window._editSupp = (s) => suppForm(s, async () => {
      bust(); rows = await api("/suppliers/"); refreshTable(rows);
    });
    window._delSupp = async (id) => {
      if (!confirm("Delete supplier?")) return;
      try {
        await api("/suppliers/" + id + "/", { method: "DELETE" });
        bust(); toast("Deleted");
        rows = rows.filter((r) => r.id !== id); refreshTable(rows);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function suppForm(s, onSaved) {
  openMod(`
<div class="mt">${s ? "Edit Supplier" : "New Supplier"}</div>
<div class="fg">
  <div class="fgrp"><label class="fl">Company Name</label><input class="fc" id="f_sn" value="${s ? s.name : ""}" placeholder="Company name"/></div>
  <div class="fgrp"><label class="fl">Contact Name</label><input class="fc" id="f_scn" value="${s ? s.contact_name || "" : ""}" placeholder="Contact person"/></div>
  <div class="fgrp"><label class="fl">Email</label><input class="fc" type="email" id="f_sem" value="${s ? s.email || "" : ""}" placeholder="email@company.com"/></div>
  <div class="fgrp"><label class="fl">Phone</label><input class="fc" id="f_sph" value="${s ? s.phone || "" : ""}" placeholder="+977 ..."/></div>
  <div class="fgrp"><label class="fl">Active</label><select class="fc" id="f_sact"><option value="true"${!s || s.is_active ? " selected" : ""}>Yes</option><option value="false"${s && !s.is_active ? " selected" : ""}>No</option></select></div>
  <div class="fgrp full"><label class="fl">Address</label><textarea class="fc" id="f_sad">${s ? s.address || "" : ""}</textarea></div>
</div>
<div class="ma">
  <button class="btn bp" id="saveSuppBtn">${s ? "Save Changes" : "Create"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("saveSuppBtn").onclick = async () => {
    const body = {
      name: document.getElementById("f_sn").value,
      contact_name: document.getElementById("f_scn").value,
      email: document.getElementById("f_sem").value,
      phone: document.getElementById("f_sph").value,
      address: document.getElementById("f_sad").value,
      is_active: document.getElementById("f_sact").value === "true",
    };
    if (!body.name) { toast("Name is required", "err"); return; }
    try {
      if (s) await api("/suppliers/" + s.id + "/", { method: "PUT", body: JSON.stringify(body) });
      else await api("/suppliers/", { method: "POST", body: JSON.stringify(body) });
      toast(s ? "Supplier updated" : "Supplier created");
      closeMod(); await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
