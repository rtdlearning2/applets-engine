// engine/configLoader.js

export async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load config (${res.status}) from ${url}`);
  return res.json();
}

export function getConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("src"); // may be null
}

export function setHeader(title, subtitle) {
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle || "";
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

export function showError(err) {
  setHeader("Config load failed", err?.message || String(err));
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <div class="muted">Fix the URL or config path and reload.</div>
    <pre>${escapeHtml(String(err?.stack || err?.message || err))}</pre>
  `;
}