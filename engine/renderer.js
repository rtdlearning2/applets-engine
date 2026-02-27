// engine/renderer.js

import { validateSubmission } from "./validator.js";

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

  const xmin = config.grid.xmin;
  const xmax = config.grid.xmax;
  const ymin = config.grid.ymin;
  const ymax = config.grid.ymax;

  const width = 600;
  const height = 600;

  const xScale = width / (xmax - xmin);
  const yScale = height / (ymax - ymin);

  const toSvgX = x => (x - xmin) * xScale;
  const toSvgY = y => height - (y - ymin) * yScale;

  function buildPath(points) {
    return points
      .map((p, i) =>
        (i === 0 ? "M" : "L") + toSvgX(p[0]) + " " + toSvgY(p[1])
      )
      .join(" ");
  }

  // Step 5.1 — shared point radius (match blue + red)
  // Use whatever the original blue points used; in this file it was 5.
  const POINT_R = 5;

  let svg = `
    <svg id="graphSvg"
         viewBox="0 0 ${width} ${height}"
         width="${width}"
         height="${height}"
         style="border:1px solid #ccc; background:white;">
  `;

  // Grid
  for (let x = xmin; x <= xmax; x++) {
    const sx = toSvgX(x);
    svg += `<line x1="${sx}" y1="0" x2="${sx}" y2="${height}" stroke="${x === 0 ? "#000" : "#eee"}"/>`;
  }

  for (let y = ymin; y <= ymax; y++) {
    const sy = toSvgY(y);
    svg += `<line x1="0" y1="${sy}" x2="${width}" y2="${sy}" stroke="${y === 0 ? "#000" : "#eee"}"/>`;
  }

  // Original graph (blue)
  svg += `<path d="${buildPath(originalPoints)}"
               fill="none"
               stroke="#2563eb"
               stroke-width="2"/>`;

  originalPoints.forEach(p => {
    svg += `<circle cx="${toSvgX(p[0])}"
                    cy="${toSvgY(p[1])}"
                    r="${POINT_R}"
                    fill="#2563eb"/>`;
  });

  // ===============================
  // Student rendering (Step 5.x)
  // ===============================

  // Step 5.2 — Attempt line: connects raw clicks in the order clicked (faint)
  if (rawStudentPoints.length > 1) {
    svg += `<path d="${buildPath(rawStudentPoints)}"
                 fill="none"
                 stroke="#dc2626"
                 stroke-width="3"
                 opacity="0.25" />`;
  }

  // Step 5.3 — Clean line: connects matched vertices in expected order (solid)
  if (orderedStudentPoints.length > 1) {
    svg += `<path d="${buildPath(orderedStudentPoints)}"
                 fill="none"
                 stroke="#dc2626"
                 stroke-width="3"
                 opacity="1" />`;
  }

  // Step 5.4 — Draw points (raw only) so we don’t leak correctness
  rawStudentPoints.forEach(p => {
    svg += `<circle cx="${toSvgX(p[0])}"
                    cy="${toSvgY(p[1])}"
                    r="${POINT_R}"
                    fill="#dc2626" />`;
  });

  // ✅ Solution overlay — thicker and green
  if (state.showSolution && expectedPoints.length > 0) {
    svg += `<path d="${buildPath(expectedPoints)}"
                 fill="none"
                 stroke="#16a34a"
                 stroke-width="5"/>`;

    expectedPoints.forEach(p => {
      svg += `<circle cx="${toSvgX(p[0])}"
                      cy="${toSvgY(p[1])}"
                      r="${POINT_R}"
                      fill="#16a34a"/>`;
    });
  }

  svg += `</svg>`;

  container.innerHTML = `
    <div style="padding:16px;">
      <h2>${config.title}</h2>

      <div style="margin-bottom:10px;">
        <button id="undoBtn">Undo</button>
        <button id="resetBtn">Reset</button>
        <button id="submitBtn">Submit</button>
        ${
          !state.showSolution && state.lastSubmitCorrect === false
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
    const result = validateSubmission(state);

    state.feedback = result.message;
    state.lastSubmitCorrect = result.correct;

    if (!result.correct) {
      state.showSolution = false;
    }

    render(state);
  });

  // Solution button
  document.getElementById("solutionBtn")?.addEventListener("click", () => {
    state.enableSolution();
    render(state);
  });
}