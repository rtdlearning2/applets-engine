// engine/interaction.js

import { orderStudentPoints } from "./validator.js";

export function attachGraphInteraction(state, onStateChange) {

  document.addEventListener("click", function (e) {

    const svg = document.getElementById("graphSvg");
    if (!svg) return;

    if (!svg.contains(e.target)) return;

    if (state.studentPoints.length >= 5) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert back to graph coords
    const config = state.config;
    const xmin = config.grid.xmin;
    const xmax = config.grid.xmax;
    const ymin = config.grid.ymin;
    const ymax = config.grid.ymax;

    const width = svg.viewBox.baseVal.width;
    const height = svg.viewBox.baseVal.height;

    const graphX = xmin + (x / width) * (xmax - xmin);
    const graphY = ymax - (y / height) * (ymax - ymin);

    // Snap to nearest integer
    const snapped = [
      Math.round(graphX),
      Math.round(graphY)
    ];

    // Prevent duplicate clicks on the same vertex
    const alreadyClicked = state.studentPoints.some(
      p => p[0] === snapped[0] && p[1] === snapped[1]
    );
    if (alreadyClicked) return;

    // Keep raw clicks in studentPoints
    state.studentPoints.push(snapped);

    // Compute ordered view separately
    state.orderedStudentPoints = orderStudentPoints(
      state.expectedPoints,
      state.studentPoints
    );

    onStateChange();
  });

  console.log("Interaction attached");
}