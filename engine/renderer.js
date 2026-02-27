// engine/renderer.js

import { validate } from "./validators/index.js";
import { renderGrid } from "./gridRenderer.js";
import { renderSeries } from "./seriesRenderer.js";

export function render(state) {
  const container = document.getElementById("app");
  if (!container) return;

  const config = state.config;
  const originalPoints = config.original.points;
  const expectedPoints = state.expectedPoints;

  // Raw clicks (for counters / attempts)
  const rawStudentPoints = state.studentPoints ?? [];

  // Safeguard: orderedStudentPoints may not exist yet
  const orderedStudentPoints = state.orderedStudentPoints ?? [];

  const width = 600;
  const height = 600;

  // Helper to convert [x,y] to {x,y}
  const toObj = p => ({ x: p[0], y: p[1] });

  let svg = `
    <svg id="graphSvg"
         viewBox="0 0 ${width} ${height}"
         width="${width}"
         height="${height}"
         style="border:1px solid #ccc; background:white;">
  `;

  // Grid
  svg = renderGrid(svg, state.view, { width, height }, {});

  // Build Series
  const seriesList = [];

  // Original graph (blue)
  if (originalPoints.length > 0) {
    const pts = originalPoints.map(toObj);
    seriesList.push({
      type: "polyline",
      points: pts,
      style: { stroke: "#2563eb", strokeWidth: 2 }
    });
    seriesList.push({
      type: "points",
      points: pts,
      style: { fill: "#2563eb", r: 5 }
    });
  }

  // Student Attempt (faint line)
  if (rawStudentPoints.length > 1) {
    seriesList.push({
      type: "polyline",
      points: rawStudentPoints.map(toObj),
      style: { stroke: "#dc2626", strokeWidth: 3, opacity: 0.25 }
    });
  }

  // Student Clean (solid line)
  if (orderedStudentPoints.length > 1) {
    const matchedLookup = new Set(
      orderedStudentPoints.map(p => `${p[0]},${p[1]}`)
    );
    const cleanLinePoints = state.expectedPoints.map(toObj);
    const cleanLineMask = state.expectedPoints.map(p =>
      matchedLookup.has(`${p[0]},${p[1]}`)
    );

    seriesList.push({
      type: "polyline",
      points: cleanLinePoints,
      segmentMask: cleanLineMask,
      style: { stroke: "#dc2626", strokeWidth: 3, opacity: 1 }
    });
  }

  // Student Points (raw)
  if (rawStudentPoints.length > 0) {
    seriesList.push({
      type: "points",
      points: rawStudentPoints.map(toObj),
      style: { fill: "#dc2626", r: 5 }
    });
  }

  // Solution overlay (never before submit)
  if (state.submitted) {
    if (state.showSolution && expectedPoints.length > 0) {
      const pts = expectedPoints.map(toObj);
      seriesList.push({
        type: "polyline",
        points: pts,
        style: { stroke: "#16a34a", strokeWidth: 5 }
      });
      seriesList.push({
        type: "points",
        points: pts,
        style: { fill: "#16a34a", r: 5 }
      });
    }
  }

  svg = renderSeries(svg, seriesList, state.view, { width, height });

  svg += `</svg>`;

  container.innerHTML = `
    <div style="padding:16px;">
      <h2>${config.title}</h2>

      <div style="margin-bottom:10px;">
        <button id="zoomInBtn">Zoom In</button>
        <button id="zoomOutBtn">Zoom Out</button>
        <button id="undoBtn">Undo</button>
        <button id="resetBtn">Reset</button>
        <button id="submitBtn">Submit</button>
        ${
          !state.showSolution && state.lastSubmitCorrect === false && config.feedback.showSolutionOnFail
            ? `<button id="solutionBtn">See Solution</button>`
            : ""
        }
      </div>

      <div id="feedback" style="margin:10px 0; font-weight:600;">
        ${state.feedback ?? ""}
      </div>

      <p>Expected points: ${expectedPoints.length}</p>
      <p>Student points: ${rawStudentPoints.length}</p>

      ${svg}
    </div>
  `;

  // Zoom
  document.getElementById("zoomInBtn")?.addEventListener("click", () => {
    state.zoomIn();
    render(state);
  });
  document.getElementById("zoomOutBtn")?.addEventListener("click", () => {
    state.zoomOut();
    render(state);
  });

  // Undo
  document.getElementById("undoBtn")?.addEventListener("click", () => {
    state.undo();
    render(state);
  });

  // Reset
  document.getElementById("resetBtn")?.addEventListener("click", () => {
    state.reset();
    render(state);
  });

  // Submit (semantic correctness)
  document.getElementById("submitBtn")?.addEventListener("click", () => {
    const activityType = state.config?.activityType ?? "transformations";
    const result = validate(activityType, state, state.config);

    state.submitted = true;
    state.feedback = result?.details?.message ?? "";
    state.lastSubmitCorrect = Boolean(result?.isCorrect);

    if (!state.lastSubmitCorrect) {
      state.showSolution = config.feedback.showExpectedPointsOnFail;
    }

    render(state);
  });

  // Solution button
  document.getElementById("solutionBtn")?.addEventListener("click", () => {
    state.enableSolution();
    render(state);
  });
}
