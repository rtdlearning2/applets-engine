// app.js (no template strings)
import { fetchJson, getConfigUrl, setHeader, escapeHtml, showError } from "../engine/configLoader.js";
import { renderGraphSvg } from "../engine/renderer.js";

let APP_STATE = {
  config: null,
  src: null,
  showSolution: false
};

function applyTransform(points, transform) {
  if (!transform || !transform.type) return points;

  if (transform.type === "reflect_x") {
    return points.map(function (p) { return [p[0], -p[1]]; });
  }

  if (transform.type === "reflect_y") {
    return points.map(function (p) { return [-p[0], p[1]]; });
  }

  return points;
}

function buildPathData(points, toSvgX, toSvgY) {
  let pathData = "";
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    pathData += (i === 0 ? "M " : "L ") + toSvgX(p[0]) + " " + toSvgY(p[1]) + " ";
  }
  return pathData.trim();
}

/**
 * Inject the instructions + controls card into the DOM exactly as specified
 * (so you can add it in index.html later if you prefer).
 *
 * Placement:
 * - inside <main class="wrap"> if present
 * - immediately ABOVE <div id="app">
 */
function ensureInstructionsCard() {
  const appEl = document.getElementById("app");
  if (!appEl) return null;

  let card = document.getElementById("instructionsCard");
  if (card) return card;

  card = document.createElement("div");
  card.className = "card";
  card.id = "instructionsCard";
  card.setAttribute("style", "margin-bottom: 12px;");

  card.innerHTML =
    '<div id="prompt" style="font-size:16px; font-weight:600;"></div>' +
    '<div id="howto" class="muted" style="margin-top:6px;"></div>' +
    '<div class="muted" style="margin-top:6px;">' +
      "Plot <b>exactly 5 points</b>, from left to right. Points will snap when close." +
    "</div>" +
    '<div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">' +
      '<button id="btnUndo" type="button">Undo</button>' +
      '<button id="btnReset" type="button">Reset</button>' +
      '<button id="btnSubmit" type="button">Submit</button>' +
      '<button id="btnSeeSolution" type="button" style="display:none;">See solution</button>' +
    "</div>" +
    '<div id="feedback" style="margin-top:12px;"></div>';

  const wrapMain = appEl.closest("main.wrap");
  if (wrapMain) {
    wrapMain.insertBefore(card, appEl);
  } else {
    appEl.parentNode.insertBefore(card, appEl);
  }

  return card;
}

function setFeedback(html) {
  const feedbackEl = document.getElementById("feedback");
  if (!feedbackEl) return;
  feedbackEl.innerHTML = html || "";
}

function defaultHowtoForTransform(transform) {
  if (!transform || !transform.type) return "";

  if (transform.type === "reflect_x") {
    return "Reflect the graph across the <b>x-axis</b>: keep x-values the same and negate y-values.";
  }
  if (transform.type === "reflect_y") {
    return "Reflect the graph across the <b>y-axis</b>: keep y-values the same and negate x-values.";
  }
  return "";
}

function setupInstructionsUI(config) {
  ensureInstructionsCard();

  const promptEl = document.getElementById("prompt");
  const howtoEl = document.getElementById("howto");
  const btnUndo = document.getElementById("btnUndo");
  const btnReset = document.getElementById("btnReset");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnSeeSolution = document.getElementById("btnSeeSolution");

  const promptText = (config && config.prompt) ? String(config.prompt) :
    ((config && config.title) ? String(config.title) : "Complete the transformation");
  if (promptEl) promptEl.textContent = promptText;

  const howtoHtml = (config && config.howto) ? String(config.howto) : defaultHowtoForTransform(config && config.transform);
  if (howtoEl) howtoEl.innerHTML = howtoHtml;

  APP_STATE.showSolution = false;
  if (btnSeeSolution) btnSeeSolution.style.display = "none";
  setFeedback("");

  if (btnUndo) {
    btnUndo.onclick = function () {
      setFeedback('<div class="muted">Undo is ready to be wired to point-plotting (not yet implemented in this app.js).</div>');
    };
  }

  if (btnReset) {
    btnReset.onclick = function () {
      APP_STATE.showSolution = false;
      if (btnSeeSolution) btnSeeSolution.style.display = "none";
      setFeedback('<div class="muted">Reset complete (point-plotting reset will be added next).</div>');
      if (APP_STATE.config) renderConfig(APP_STATE.config, APP_STATE.src);
    };
  }

  if (btnSubmit) {
    btnSubmit.onclick = function () {
      setFeedback(
        '<div style="font-weight:600;">Submitted.</div>' +
        '<div class="muted" style="margin-top:6px;">You can now view the solution.</div>'
      );
      if (btnSeeSolution) btnSeeSolution.style.display = "inline-block";
    };
  }

  if (btnSeeSolution) {
    btnSeeSolution.onclick = function () {
      APP_STATE.showSolution = true;
      setFeedback('<div style="font-weight:600;">Solution shown.</div>');
      if (APP_STATE.config) renderConfig(APP_STATE.config, APP_STATE.src);
    };
  }
}

function renderConfig(config, src) {
  try {
    const title = (config && config.title) ? String(config.title) : "";
    const srcStr = src ? String(src) : "";
    const looksLikeReflectX =
      (srcStr.indexOf("reflect_x") !== -1) ||
      (title.toLowerCase().indexOf("reflect across the x-axis") !== -1) ||
      (title.toLowerCase().indexOf("reflect across the x axis") !== -1);

    if (looksLikeReflectX && (!config.transform || !config.transform.type)) {
      config.transform = { type: "reflect_x" };
    }
  } catch (e) {}

  setupInstructionsUI(config);

  setHeader((config && config.title) ? config.title : "Untitled activity", "Loaded from: " + src);

  const appEl = document.getElementById("app");
  if (!appEl) return;

  if (!config || !config.grid || !config.original || !config.original.points || !config.original.points.length) {
    appEl.innerHTML =
      '<div class="muted">Config is missing required fields.</div>' +
      "<pre>" + escapeHtml(JSON.stringify(config, null, 2)) + "</pre>";
    return;
  }

  // ✅ Step 7 change: delegate SVG building to the shared renderer
  const svg = renderGraphSvg(config, { showSolution: APP_STATE.showSolution });
  appEl.innerHTML = svg;
}

async function main() {
  const src = getConfigUrl();

  if (!src) {
    setHeader("No config specified", "Add ?src=... to the URL");
    ensureInstructionsCard();
    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.innerHTML =
        '<p class="muted">Example:</p>' +
        "<pre>https://rtdlearning2.github.io/rtd-applets-engine/activity/?src=https://raw.githubusercontent.com/rtdlearning2/rtd-applets-math30-1/main/configs/unit-1-transformations/reflections/reflect_x_001.json</pre>";
    }
    return;
  }

  const config = await fetchJson(src);
  APP_STATE.config = config;
  APP_STATE.src = src;

  renderConfig(config, src);
}

window.addEventListener("DOMContentLoaded", function () {
  main().catch(showError);
});