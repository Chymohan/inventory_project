// ── users.js ──────────────────────────────────────────────────────────────────
import { api, toast, openMod, closeMod, sp, emp, USER, ROLE } from "./core.js";

const SECTION = "user-table";

async function refreshTable(rows) {
  const q = (document.getElementById("usrch") || {}).value || "";
  const roleF = (document.getElementById("urole") || {}).value || "";
  const filtered = rows.filter((r) =>
    (!q || [r.username, r.email, r.first_name, r.last_name].some((v) =>
      (v || "").toLowerCase().includes(q.toLowerCase())
    )) && (!roleF || r.role === roleF)
  );
  const countEl = document.getElementById("user-count");
  if (countEl) countEl.textContent = `${filtered.length} users`;
  const tbody = document.getElementById(SECTION);
  if (!tbody) return;
  tbody.innerHTML = filtered.map((u) => `<tr>
    <td><span class="mono" style="font-weight:700;color:var(--accent-l)">${u.username}</span>${u.username === USER ? '<span style="font-size:10px;color:var(--muted2);margin-left:6px">(you)</span>' : ""}</td>
    <td>${[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</td>
    <td style="font-size:12px">${u.email || "—"}</td>
    <td>${roleTag(u.role)}</td>
    <td>${u.is_active ? '<span style="color:var(--green)">✓ Active</span>' : '<span style="color:var(--red)">✗ Inactive</span>'}</td>
    <td style="font-size:11px;color:var(--muted2)">${u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}</td>
    <td><div class="tda">
      <button class="btn bsm bg" onclick='window._editUser(${JSON.stringify(u)})'>Edit</button>
      <button class="btn bsm bsa" onclick="window._resetPwd(${u.id},'${u.username}')">Password</button>
      ${u.username !== USER ? `<button class="btn bsm bd" onclick="window._delUser(${u.id},'${u.username}')">Del</button>` : ""}
    </div></td>
  </tr>`).join("") || `<tr><td colspan="7">${emp()}</td></tr>`;
}

export async function renderUsers() {
  const c = document.getElementById("content");
  if (ROLE !== "admin") {
    c.innerHTML = `<div class="emp" style="padding:80px">
<div style="font-size:40px;margin-bottom:16px">⊘</div>
<div style="font-size:15px;margin-bottom:8px">Access Denied</div>
<div style="font-size:12px">Only admins can manage users.</div></div>`;
    return;
  }
  c.innerHTML = sp();
  try {
    let rows = await api("/users/");

    c.innerHTML = `
<div class="tb">
  <button class="btn bp" onclick="window._newUser()">+ New User</button>
  <input class="si" id="usrch" placeholder="Search by name or email…" oninput="window._filterUsers()"/>
  <select class="fc" id="urole" style="width:130px" onchange="window._filterUsers()">
    <option value="">All Roles</option>
    <option value="admin">Admin</option>
    <option value="manager">Manager</option>
    <option value="staff">Staff</option>
  </select>
  <span id="user-count" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted2);margin-left:auto"></span>
</div>
<div class="tw"><table>
  <thead><tr><th>USERNAME</th><th>FULL NAME</th><th>EMAIL</th><th>ROLE</th><th>ACTIVE</th><th>JOINED</th><th>ACTIONS</th></tr></thead>
  <tbody id="${SECTION}"></tbody>
</table></div>`;

    await refreshTable(rows);

    window._filterUsers = () => refreshTable(rows);
    window._newUser = () => userForm(null, async () => {
      rows = await api("/users/"); refreshTable(rows);
    });
    window._editUser = (u) => userForm(u, async () => {
      rows = await api("/users/"); refreshTable(rows);
    });
    window._resetPwd = (id, uname) => pwdForm(id, uname);
    window._delUser = async (id, uname) => {
      if (!confirm(`Delete user "${uname}"? This cannot be undone.`)) return;
      try {
        await api("/users/" + id + "/", { method: "DELETE" });
        toast("User deleted");
        rows = rows.filter((r) => r.id !== id); refreshTable(rows);
      } catch (e) { toast(e.message, "err"); }
    };
  } catch (e) {
    c.innerHTML = `<div class="emp">✗ ${e.message}</div>`;
  }
}

function roleTag(role) {
  const map = {
    admin: { c: "#ff4d6d", bg: "#ff4d6d15", b: "#ff4d6d30" },
    manager: { c: "#f5a623", bg: "#f5a62315", b: "#f5a62330" },
    staff: { c: "#4db8ff", bg: "#4db8ff15", b: "#4db8ff30" },
  };
  const m = map[role] || { c: "#5c5a88", bg: "#5c5a8815", b: "#5c5a8830" };
  return `<span style="font-family:'Space Mono',monospace;font-size:10px;padding:2px 9px;border-radius:20px;font-weight:700;letter-spacing:.06em;color:${m.c};background:${m.bg};border:1px solid ${m.b}">${(role || "—").toUpperCase()}</span>`;
}

function userForm(u, onSaved) {
  const isEdit = !!u;
  openMod(`
<div class="mt">${isEdit ? "Edit User" : "Create New User"}</div>
<div class="fg">
  <div class="fgrp"><label class="fl">Username</label><input class="fc" id="f_uname" value="${u ? u.username : ""}" placeholder="johndoe"${isEdit ? ' readonly style="opacity:.5"' : ""}/></div>
  <div class="fgrp"><label class="fl">Role</label>
    <select class="fc" id="f_urole">
      <option value="admin"${u && u.role === "admin" ? " selected" : ""}>Admin</option>
      <option value="manager"${u && u.role === "manager" ? " selected" : ""}>Manager</option>
      <option value="staff"${!u || u.role === "staff" ? " selected" : ""}>Staff</option>
    </select>
  </div>
  <div class="fgrp"><label class="fl">First Name</label><input class="fc" id="f_ufn" value="${u ? u.first_name || "" : ""}" placeholder="John"/></div>
  <div class="fgrp"><label class="fl">Last Name</label><input class="fc" id="f_uln" value="${u ? u.last_name || "" : ""}" placeholder="Doe"/></div>
  <div class="fgrp"><label class="fl">Email</label><input class="fc" type="email" id="f_uem" value="${u ? u.email || "" : ""}" placeholder="john@example.com"/></div>
  <div class="fgrp"><label class="fl">Active</label>
    <select class="fc" id="f_uact">
      <option value="true"${!u || u.is_active ? " selected" : ""}>Yes — Active</option>
      <option value="false"${u && !u.is_active ? " selected" : ""}>No — Disabled</option>
    </select>
  </div>
  ${!isEdit ? `
  <div class="fgrp full" style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px">
    <label class="fl" style="color:var(--amber)">Password (required for new users)</label>
    <input class="fc" type="password" id="f_upwd" placeholder="Set initial password"/>
  </div>
  <div class="fgrp full">
    <label class="fl">Confirm Password</label>
    <input class="fc" type="password" id="f_upwd2" placeholder="Repeat password"/>
  </div>` : ""}
</div>
<div class="ma">
  <button class="btn bp" id="saveUserBtn">${isEdit ? "Save Changes" : "Create User"}</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("saveUserBtn").onclick = async () => {
    const uname = document.getElementById("f_uname").value.trim();
    const role = document.getElementById("f_urole").value;
    if (!uname) { toast("Username is required", "err"); return; }
    const body = {
      username: uname, role,
      first_name: document.getElementById("f_ufn").value.trim(),
      last_name: document.getElementById("f_uln").value.trim(),
      email: document.getElementById("f_uem").value.trim(),
      is_active: document.getElementById("f_uact").value === "true",
    };
    if (!isEdit) {
      const pwd = document.getElementById("f_upwd").value;
      const pwd2 = document.getElementById("f_upwd2").value;
      if (!pwd) { toast("Password is required for new users", "err"); return; }
      if (pwd !== pwd2) { toast("Passwords do not match", "err"); return; }
      if (pwd.length < 6) { toast("Password must be at least 6 characters", "err"); return; }
      body.password = pwd;
    }
    try {
      if (u) await api("/users/" + u.id + "/", { method: "PUT", body: JSON.stringify(body) });
      else await api("/users/", { method: "POST", body: JSON.stringify(body) });
      toast(u ? `User "${uname}" updated` : `User "${uname}" created`);
      closeMod(); await onSaved();
    } catch (e) { toast(e.message, "err"); }
  };
}

function pwdForm(id, uname) {
  openMod(`
<div class="mt">Reset Password — <span style="color:var(--accent-l)">${uname}</span></div>
<p style="color:var(--muted2);font-size:13px;margin-bottom:20px">Set a new password for this user.</p>
<div class="fg one">
  <div class="fgrp"><label class="fl">New Password</label><input class="fc" type="password" id="f_np" placeholder="New password (min 6 chars)"/></div>
  <div class="fgrp"><label class="fl">Confirm New Password</label><input class="fc" type="password" id="f_np2" placeholder="Repeat password"/></div>
</div>
<div class="ma">
  <button class="btn bp" id="confirmPwdBtn">Set Password</button>
  <button class="btn bg" onclick="window._closeMod()">Cancel</button>
</div>`);
  window._closeMod = closeMod;
  document.getElementById("confirmPwdBtn").onclick = async () => {
    const pwd = document.getElementById("f_np").value;
    const pwd2 = document.getElementById("f_np2").value;
    if (!pwd) { toast("Enter a password", "err"); return; }
    if (pwd !== pwd2) { toast("Passwords do not match", "err"); return; }
    if (pwd.length < 6) { toast("Minimum 6 characters", "err"); return; }
    try {
      const r = await api("/users/" + id + "/set-password/", {
        method: "POST", body: JSON.stringify({ password: pwd }),
      });
      toast(r.message || "Password updated");
      closeMod();
    } catch (e) { toast(e.message, "err"); }
  };
}
