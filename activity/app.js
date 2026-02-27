```js
// app.js (full replacement)

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load config (" + res.status + ") from " + url);
  return res.json();
}

function getConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("src"); // may be null
}

function setHeader(title, subtitle) {
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle || "";
}

function showError(err) {
  setHeader("Config load failed", err?.message || String(err));
  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = `
    <div class="muted">Fix the URL or config path and reload.</div>
    <pre>${escapeHtml(String(err?.stack || err?.message || err))}</pre>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function renderConfig(config, src) {
  setHeader(config?.title || "Untitled activity", `Loaded from: ${src}`);

  const appEl = document.getElementById("app");
  if (!appEl) return;

  // Basic validation with friendly message
  if (!config?.grid || !config?.original?.points?.length) {
    appEl.innerHTML = `
      <div class="muted">Config is missing required fields.</div>
      <pre>${escapeHtml(JSON.stringify(config, null, 2))}</pre>
    `;
    return;
  }

  const { xmin, xmax, ymin, ymax } = config.grid;

  const width = 640;
  const height = 640;

  const xScale = width / (xmax - xmin);
  const yScale = height / (ymax - ymin);

  const toSvgX = (x) => (x - xmin) * xScale;
  const toSvgY = (y) => height - (y - ymin) * yScale;

  // SVG builder
  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="border:1px solid #ccc; background:white;">`;

  // Grid lines
  for (let x = xmin; x <= xmax; x++) {
    const sx = toSvgX(x);
    const stroke = (x === 0) ? "#000" : "#eee";
    const strokeWidth = (x === 0) ? 1.5 : 1;
    svg += `<line x1="${sx}" y1="0" x2="${sx}" y2="${height}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  }

  for (let y = ymin; y <= ymax; y++) {
    const sy = toSvgY(y);
    const stroke = (y === 0) ? "#000" : "#eee";
    const strokeWidth = (y === 0) ? 1.5 : 1;
    svg += `<line x1="0" y1="${sy}" x2="${width}" y2="${sy}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  }

  // Axis numbers (tick labels)
  // - X labels placed along y=0 (slightly below the axis)
  // - Y labels placed along x=0 (slightly left of the axis)
  // Note: We skip 0 by default to keep the origin clean.
  const axisLabelStyle = `font-family: Arial, sans-serif; font-size: 12px; fill: #666; user-select: none;`;
  for (let x = xmin; x <= xmax; x++) {
    if (x === 0) continue;
    const sx = toSvgX(x);
    const sy0 = toSvgY(0);
    svg += `<text x="${sx}" y="${sy0 + 18}" text-anchor="middle" style="${axisLabelStyle}">${x}</text>`;
  }

  for (let y = ymin; y <= ymax; y++) {
    if (y === 0) continue;
    const sx0 = toSvgX(0);
    const sy = toSvgY(y);
    svg += `<text x="${sx0 - 10}" y="${sy + 4}" text-anchor="end" style="${axisLabelStyle}">${y}</text>`;
  }

  // Original polyline
  const points = config.original.points;

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toSvgX(p[0])} ${toSvgY(p[1])}`)
    .join(" ");

  if (config.original.connectLines !== false) {
    svg += `<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="2.5" />`;
  }

  // Points
  for (const p of points) {
    svg += `<circle cx="${toSvgX(p[0])}" cy="${toSvgY(p[1])}" r="5" fill="#2563eb" />`;
  }

  svg += `</svg>`;

  appEl.innerHTML = svg;
}

async function main() {
  const src = getConfigUrl();

  if (!src) {
    setHeader("No config specified", "Add ?src=... to the URL");
    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.innerHTML = `
        <p class="muted">Example:</p>
        <pre>https://rtdlearning2.github.io/rtd-applets-engine/activity/?src=https://raw.githubusercontent.com/rtdlearning2/rtd-applets-math30-1/main/configs/unit-1-transformations/reflections/reflect_x_001.json</pre>
      `;
    }
    return;
  }

  const config = await fetchJson(src);
  renderConfig(config, src);
}

window.addEventListener("DOMContentLoaded", () => {
  main().catch(showError);
});
```
