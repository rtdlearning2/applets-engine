async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load config (${res.status}) from ${url}`);
  return res.json();
}

function getConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("src"); // may be null
}

function setHeader(title, subtitle) {
  document.getElementById("title").textContent = title;
  document.getElementById("subtitle").textContent = subtitle || "";
}

function showError(err) {
  setHeader("Config load failed", err.message);
  document.getElementById("app").innerHTML = `
    <div class="muted">Fix the URL or config path and reload.</div>
    <pre>${escapeHtml(String(err.stack || err.message || err))}</pre>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function renderConfig(config, src) {
  setHeader(config.title || "Untitled activity", `Loaded from: ${src}`);

  const { xmin, xmax, ymin, ymax } = config.grid;

  const width = 600;
  const height = 600;

  const xScale = width / (xmax - xmin);
  const yScale = height / (ymax - ymin);

  function toSvgX(x) {
    return (x - xmin) * xScale;
  }

  function toSvgY(y) {
    return height - (y - ymin) * yScale;
  }

  let svg = `
    <svg width="${width}" height="${height}" style="border:1px solid #ccc; background:white;">
  `;

  // Draw grid lines
  for (let x = xmin; x <= xmax; x++) {
    const sx = toSvgX(x);
    svg += `<line x1="${sx}" y1="0" x2="${sx}" y2="${height}" stroke="#eee"/>`;
  }

  for (let y = ymin; y <= ymax; y++) {
    const sy = toSvgY(y);
    svg += `<line x1="0" y1="${sy}" x2="${width}" y2="${sy}" stroke="#eee"/>`;
  }

  // Draw axes
  svg += `<line x1="0" y1="${toSvgY(0)}" x2="${width}" y2="${toSvgY(0)}" stroke="black"/>`;
  svg += `<line x1="${toSvgX(0)}" y1="0" x2="${toSvgX(0)}" y2="${height}" stroke="black"/>`;

  // Draw original polyline
  const points = config.original.points;

  let pathData = points.map((p, i) => {
    const x = toSvgX(p[0]);
    const y = toSvgY(p[1]);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  svg += `<path d="${pathData}" fill="none" stroke="blue" stroke-width="2"/>`;

  // Draw points
  points.forEach(p => {
    svg += `
      <circle 
        cx="${toSvgX(p[0])}" 
        cy="${toSvgY(p[1])}" 
        r="5" 
        fill="blue"
      />
    `;
  });

  svg += `</svg>`;

  document.getElementById("app").innerHTML = svg;
}

async function main() {
  const src = getConfigUrl();

  if (!src) {
    setHeader("No config specified", "Add ?src=... to the URL");
    document.getElementById("app").innerHTML = `
      <p class="muted">Example (local):</p>
      <pre>http://localhost:3000/activity/?src=../configs/reflections/reflect_x_001.json</pre>
    `;
    return;
  }

  const config = await fetchJson(src);
  renderConfig(config, src);
}

main().catch(showError);