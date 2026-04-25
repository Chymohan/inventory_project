// ── core.js — shared utilities ───────────────────────────────────────────────

export const USER = localStorage.getItem("user") || "?";
export const ROLE = localStorage.getItem("role") || "";

// ── CSRF ──────────────────────────────────────────────────────────────────────
function gc(n) {
  const v = document.cookie.match("(^|;) ?" + n + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

// ── API ───────────────────────────────────────────────────────────────────────
export async function api(path, opts = {}) {
  const token = localStorage.getItem("access_token");
  const isFormData = opts.body instanceof FormData;
  const h = { "X-CSRFToken": gc("csrftoken") };
  if (!isFormData) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = "Bearer " + token;

  let r = await fetch("/api" + path, { ...opts, headers: h });

  if (r.status === 401) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        const rr = await fetch("/api/auth/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (rr.ok) {
          const rd = await rr.json();
          localStorage.setItem("access_token", rd.access);
          if (rd.refresh) localStorage.setItem("refresh_token", rd.refresh);
          h["Authorization"] = "Bearer " + rd.access;
          r = await fetch("/api" + path, { ...opts, headers: h });
        } else { logout(); return; }
      } catch (_) { logout(); return; }
    } else { logout(); return; }
  }

  if (r.status === 204) return {};
  const d = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(d.detail || Object.values(d).flat().join(" ") || "Error " + r.status);
  return d;
}

export function logout() {
  localStorage.clear();
  location.href = "/login/";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tt;
export function toast(msg, type = "ok") {
  const el = document.getElementById("toast");
  el.textContent = (type === "ok" ? "✓ " : "✗ ") + msg;
  el.className = type;
  el.style.display = "block";
  clearTimeout(_tt);
  _tt = setTimeout(() => (el.style.display = "none"), 3200);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function openMod(html) {
  document.getElementById("mc").innerHTML = html;
  document.getElementById("ov").classList.add("open");
}
export function closeMod() {
  document.getElementById("ov").classList.remove("open");
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let _cache = {};
export async function load(ep) {
  if (!_cache[ep]) _cache[ep] = await api(ep).catch(() => []);
  return _cache[ep];
}
export function bust() { _cache = {}; }

// ── Helpers ───────────────────────────────────────────────────────────────────
export const sp = () => `<div class="spw"><div class="sp"></div></div>`;
export const emp = (m = "No records found") => `<div class="emp">◌<br><br>${m}</div>`;
export const money = (v) =>
  v != null
    ? "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
export const pill = (s) => {
  const c = (s || "").toLowerCase();
  return `<span class="pill p${c}">${s || "—"}</span>`;
};
