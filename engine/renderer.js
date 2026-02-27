// engine/renderer.js

import { validateSubmission } from "./validator.js";

export function render(state) {
  const container = document.getElementById("app");
  if (!container) return;

  const config = state.config;
  const originalPoints = config.original.points;
  const expectedPoints = state.expectedPoints;

  // Raw clicks (for counters / attempts)
  const rawStudentPoints = state.studentPoints;

  // Ordered view (for drawing)
  const studentPoints = state.orderedStudentPoints?.length
    ? state.orderedStudentPoints
    : rawStudentPoints;

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
                    r="5"
                    fill="#2563eb"/>`;
  });

  // Student graph (red) — draw from ordered points when available
  if (studentPoints.length > 0) {
    svg += `<path d="${buildPath(studentPoints)}"
                 fill="none"
                 stroke="#dc2626"
                 stroke-width="2"/>`;

    studentPoints.forEach(p => {
      svg += `<circle cx="${toSvgX(p[0])}"
                      cy="${toSvgY(p[1])}"
                      r="5"
                      fill="#dc2626"/>`;
    });
  }

  // ✅ Solution overlay — thicker and green
  if (state.showSolution && state.expectedPoints.length > 0) {
    svg += `<path d="${buildPath(state.expectedPoints)}"
                 fill="none"
                 stroke="#16a34a"
                 stroke-width="5"/>`;

    state.expectedPoints.forEach(p => {
      svg += `<circle cx="${toSvgX(p[0])}"
                      cy="${toSvgY(p[1])}"
                      r="6"
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
      <!-- Optional UI fix: show raw click count -->
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