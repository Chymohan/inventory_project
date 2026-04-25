// ── products.js ───────────────────────────────────────────────────────────────
import { api, load, bust, toast, openMod, closeMod, sp, emp, money } from "./core.js";

const SECTION = "prod-table";

// Refresh only the table body without re-fetching everything
async function refreshTable(rows, catMap, suppMap) {
  const q = (document.getElementById("psrch") || {}).value || "";
  const filtered = rows.filter((r) =>
    [r.sku, r.name].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
  );
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((p) => `<tr>
    <td class="mono" style="font-size:12px">${p.sku}</td>
    <td style="font-weight:600">${p.name}</td>
    <td>${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px"/>` : `<span style="color:var(--muted2);font-size:11px">No image</span>`}</td>
    <td>${catMap[p.category] || "—"}</td>
    <td>${suppMap[p.supplier] || "—"}</td>
    <td class="mono">${money(p.unit_price)}</td>
    <td class="mono">${money(p.cost_price)}</td>
    <td class="mono">${p.reorder_level}</td>
    <td style="font-size:12px;color:var(--muted2)">${p.unit_of_measure || "—"}</td>
    <td>${p.is_active ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✗</span>'}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick='window._editProduct(${JSON.stringify(p)})'>Edit</button>
      <button class="btn bsm bd" onclick="window._delProduct(${p.id})">Del</button>
    </div></td>
  </tr>`).join("") || `<tr><td colspan="11">${emp()}</td></tr>`;
}

export async function renderProducts() {
  const c = document.getElementById("content");
  c.innerHTML = sp();
  try {
    const [prods, cats, supps] = await Promise.all([
      api("/products/"),
      load("/categories/"),
      load("/suppliers/"),
    ]);
    const catMap = {}, suppMap = {};
    cats.forEach((x) => (catMap[x.id] = x.name));
    supps.forEach((x) => (suppMap[x.id] = x.name));
    let rows = [...prods];

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newProduct()">+ New Product</button>
  <input class="si" id="psrch" placeholder="Search by name or SKU…" oninput="window._filterProducts()"/>
</div>
<div class="tw"><table>
  <thead><tr><th>SKU</th><th>NAME</th><th>IMAGE</th><th>CATEGORY</th><th>SUPPLIER</th><th>UNIT PRICE</th><th>COST PRICE</th><th>REORDER LVL</th><th>UOM</th><th>ACTIVE</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows, catMap, suppMap);

    window._filterProducts = () => refreshTable(rows, catMap, suppMap);
    window._newProduct = () => productForm(null, cats, supps, async () => {
      bust();
      const fresh = await api("/products/");
      rows = [...fresh];
      refreshTable(rows, catMap, suppMap);
    });
    window._editProduct = (p) => productForm(p, cats, supps, async () => {
      bust();
      const fresh = await api("/products/");
      rows = [...fresh];
      refreshTable(rows, catMap, suppMap);
    });
    window._delProduct = async (id) => {
      if (!confirm("Delete product?")) return;
      try {
        await api("/products/" + id + "/", { method: "DELETE" });
        bust();
        toast("Deleted");
        rows = rows.filter((r) => r.id !== id);
        refreshTable(rows, catMap, suppMap);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function productForm(p, cats, supps, onSaved) {
  const catOpts = cats.map((c) => `<option value="${c.id}"${p && p.category == c.id ? " selected" : ""}>${c.name}</option>`).join("");
  const suppOpts = supps.map((s) => `<option value="${s.id}"${p && p.supplier == s.id ? " selected" : ""}>${s.name}</option>`).join("");
  openMod(`
<div class="mt">${p ? "Edit Product" : "New Product"}</div>
<div class="fg">
  <div class="fgrp"><label class="fl">SKU</label><input class="fc" id="f_sku" value="${p ? p.sku : ""}" placeholder="P001"/></div>
  <div class="fgrp"><label class="fl">Name</label><input class="fc" id="f_name" value="${p ? p.name : ""}" placeholder="Product name"/></div>
  <div class="fgrp"><label class="fl">Unit Price</label><input class="fc" id="f_up" type="number" step="0.01" value="${p ? p.unit_price : ""}"/></div>
  <div class="fgrp"><label class="fl">Cost Price</label><input class="fc" id="f_cp" type="number" step="0.01" value="${p ? p.cost_price : ""}"/></div>
  <div class="fgrp"><label class="fl">Reorder Level</label><input class="fc" id="f_rl" type="number" value="${p ? p.reorder_level : 0}"/></div>
  <div class="fgrp"><label class="fl">Reorder Qty</label><input class="fc" id="f_rq" type="number" value="${p ? p.reorder_qty : 0}"/></div>
  <div class="fgrp"><label class="fl">Unit of Measure</label><input class="fc" id="f_uom" value="${p ? p.unit_of_measure : ""}" placeholder="pcs, kg, ltr…"/></div>
  <div class="fgrp"><label class="fl">Active</label><select class="fc" id="f_act"><option value="true"${!p || p.is_active ? " selected" : ""}>Yes</option><option value="false"${p && !p.is_active ? " selected" : ""}>No</option></select></div>
  <div class="fgrp"><label class="fl">Category</label><select class="fc" id="f_cat"><option value="">— none —</option>${catOpts}</select></div>
  <div class="fgrp"><label class="fl">Supplier</label><select class="fc" id="f_sup"><option value="">— none —</option>${suppOpts}</select></div>
  <div class="fgrp">
    <label class="fl">Image</label>
    ${p && p.image_url ? `<img src="${p.image_url}" style="width:50px;height:50px;object-fit:cover;margin-bottom:6px;border-radius:4px"/>` : ""}
    <input class="fc" id="f_img" type="file">
  </div>
  <div class="fgrp full"><label class="fl">Description</label><textarea class="fc" id="f_desc">${p ? p.description || "" : ""}</textarea></div>
</div>
<div class="ma">
  <button class="btn bp" id="saveProdBtn">${p ? "Save Changes" : "Create Product"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);

  window._closeMod = closeMod;
  document.getElementById("saveProdBtn").onclick = async () => {
    const imgInput = document.getElementById("f_img");
    const hasFile = imgInput.files && imgInput.files.length > 0;
    let body, options = {};
    if (hasFile) {
      body = new FormData();
      body.append("sku", document.getElementById("f_sku").value);
      body.append("name", document.getElementById("f_name").value);
      body.append("image", imgInput.files[0]);
      body.append("unit_price", document.getElementById("f_up").value);
      body.append("cost_price", document.getElementById("f_cp").value);
      body.append("reorder_level", parseInt(document.getElementById("f_rl").value) || 0);
      body.append("reorder_qty", parseInt(document.getElementById("f_rq").value) || 0);
      body.append("unit_of_measure", document.getElementById("f_uom").value);
      body.append("is_active", document.getElementById("f_act").value === "true");
      body.append("description", document.getElementById("f_desc").value);
      const cv = document.getElementById("f_cat").value;
      if (cv) body.append("category", parseInt(cv));
      const sv = document.getElementById("f_sup").value;
      if (sv) body.append("supplier", parseInt(sv));
      options = { method: p ? "PATCH" : "POST", body };
    } else {
      const jsonBody = {
        sku: document.getElementById("f_sku").value,
        name: document.getElementById("f_name").value,
        unit_price: document.getElementById("f_up").value,
        cost_price: document.getElementById("f_cp").value,
        reorder_level: parseInt(document.getElementById("f_rl").value) || 0,
        reorder_qty: parseInt(document.getElementById("f_rq").value) || 0,
        unit_of_measure: document.getElementById("f_uom").value,
        is_active: document.getElementById("f_act").value === "true",
        description: document.getElementById("f_desc").value,
      };
      const cv = document.getElementById("f_cat").value;
      if (cv) jsonBody.category = parseInt(cv);
      const sv = document.getElementById("f_sup").value;
      if (sv) jsonBody.supplier = parseInt(sv);
      options = { method: p ? "PATCH" : "POST", body: JSON.stringify(jsonBody) };
    }
    try {
      await api(p ? `/products/${p.id}/` : "/products/", options);
      toast(p ? "Product updated" : "Product created");
      closeMod();
      await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}
