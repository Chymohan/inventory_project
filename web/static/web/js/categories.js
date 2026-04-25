// ── categories.js ─────────────────────────────────────────────────────────────
import { api, bust, toast, openMod, closeMod, sp, emp } from "./core.js";

const SECTION = "cat-table";

async function refreshTable(cats, catMap) {
  const q = (document.getElementById("csrch") || {}).value || "";
  const filtered = cats.filter((r) => (r.name || "").toLowerCase().includes(q.toLowerCase()));
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((cat) => `<tr>
    <td style="font-weight:600">${cat.name}</td>
    <td style="color:var(--muted2)">${catMap[cat.parent] || "—"}</td>
    <td style="font-size:12px;color:var(--muted2)">${cat.description || "—"}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick='window._editCat(${JSON.stringify(cat)})'>Edit</button>
      <button class="btn bsm bd" onclick="window._delCat(${cat.id})">Del</button>
    </div></td>
  </tr>`).join("") || `<tr><td colspan="4">${emp()}</td></tr>`;
}

export async function renderCategories() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    let cats = await api("/categories/");
    const catMap = { null: "—", undefined: "—" };
    cats.forEach((c) => (catMap[c.id] = c.name));

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newCat()">+ New Category</button>
  <input class="si" id="csrch" placeholder="Search categories…" oninput="window._filterCat()"/>
</div>
<div class="tw"><table>
  <thead><tr><th>NAME</th><th>PARENT</th><th>DESCRIPTION</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(cats, catMap);

    window._filterCat = () => refreshTable(cats, catMap);
    window._newCat = () => catForm(null, cats, async () => {
      bust(); cats = await api("/categories/"); cats.forEach((c) => (catMap[c.id] = c.name)); refreshTable(cats, catMap);
    });
    window._editCat = (cat) => catForm(cat, cats, async () => {
      bust(); cats = await api("/categories/"); cats.forEach((c) => (catMap[c.id] = c.name)); refreshTable(cats, catMap);
    });
    window._delCat = async (id) => {
      if (!confirm("Delete category?")) return;
      try {
        await api("/categories/" + id + "/", { method: "DELETE" });
        bust(); toast("Deleted");
        cats = cats.filter((r) => r.id !== id);
        refreshTable(cats, catMap);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function catForm(cat, cats, onSaved) {
  const parentOpts = cats
    .filter((c) => !cat || c.id !== cat.id)
    .map((c) => `<option value="${c.id}"${cat && cat.parent == c.id ? " selected" : ""}>${c.name}</option>`)
    .join("");
  openMod(`
<div class="mt">${cat ? "Edit Category" : "New Category"}</div>
<div class="fg one">
  <div class="fgrp"><label class="fl">Name</label><input class="fc" id="f_cn" value="${cat ? cat.name : ""}" placeholder="Category name"/></div>
  <div class="fgrp"><label class="fl">Parent Category</label><select class="fc" id="f_cp"><option value="">— none —</option>${parentOpts}</select></div>
  <div class="fgrp"><label class="fl">Description</label><textarea class="fc" id="f_cd">${cat ? cat.description || "" : ""}</textarea></div>
</div>
<div class="ma">
  <button class="btn bp" id="saveCatBtn">${cat ? "Save Changes" : "Create"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("saveCatBtn").onclick = async () => {
    const body = {
      name: document.getElementById("f_cn").value,
      description: document.getElementById("f_cd").value,
    };
    const pv = document.getElementById("f_cp").value;
    if (pv) body.parent = parseInt(pv);
    if (!body.name) { toast("Name is required", "err"); return; }
    try {
      if (cat) await api("/categories/" + cat.id + "/", { method: "PUT", body: JSON.stringify(body) });
      else await api("/categories/", { method: "POST", body: JSON.stringify(body) });
      toast(cat ? "Category updated" : "Category created");
      closeMod(); await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
