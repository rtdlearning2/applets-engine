// engine/renderer.js

export function applyTransform(points, transform) {
  if (!transform || !transform.type) return points;

  if (transform.type === "reflect_x") {
    return points.map(function (p) { return [p[0], -p[1]]; });
  }

  if (transform.type === "reflect_y") {
    return points.map(function (p) { return [-p[0], p[1]]; });
  }

  return points;
}

export function buildPathData(points, toSvgX, toSvgY) {
  let pathData = "";
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    pathData += (i === 0 ? "M " : "L ") + toSvgX(p[0]) + " " + toSvgY(p[1]) + " ";
  }
  return pathData.trim();
}

/**
 * Returns an SVG string for the graph area.
 *
 * options:
 * - showSolution: boolean (whether to show dashed expected overlay)
 */
export function renderGraphSvg(config, options) {
  const showSolution = !!(options && options.showSolution);

  const xmin = config.grid.xmin;
  const xmax = config.grid.xmax;
  const ymin = config.grid.ymin;
  const ymax = config.grid.ymax;

  const width = 640;
  const height = 640;

  const xScale = width / (xmax - xmin);
  const yScale = height / (ymax - ymin);

  function toSvgX(x) { return (x - xmin) * xScale; }
  function toSvgY(y) { return height - (y - ymin) * yScale; }

  let svg =
    '<svg id="graphSvg" viewBox="0 0 ' + width + " " + height + '" width="' + width + '" height="' + height + '" style="border:1px solid #ccc; background:white;">';

  // Grid lines
  for (let x = xmin; x <= xmax; x++) {
    const sx = toSvgX(x);
    const stroke = (x === 0) ? "#000" : "#eee";
    const strokeWidth = (x === 0) ? 1.5 : 1;
    svg += '<line x1="' + sx + '" y1="0" x2="' + sx + '" y2="' + height + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>';
  }

  for (let y = ymin; y <= ymax; y++) {
    const sy = toSvgY(y);
    const stroke = (y === 0) ? "#000" : "#eee";
    const strokeWidth = (y === 0) ? 1.5 : 1;
    svg += '<line x1="0" y1="' + sy + '" x2="' + width + '" y2="' + sy + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>';
  }

  // Axis numbers (tick labels) — skip 0 by default
  const axisLabelStyle = "font-family: Arial, sans-serif; font-size: 12px; fill: #666; user-select: none; pointer-events: none;";
  for (let x = xmin; x <= xmax; x++) {
    if (x === 0) continue;
    const sx = toSvgX(x);
    const sy0 = toSvgY(0);
    svg += '<text x="' + sx + '" y="' + (sy0 + 18) + '" text-anchor="middle" style="' + axisLabelStyle + '">' + x + "</text>";
  }

  for (let y = ymin; y <= ymax; y++) {
    if (y === 0) continue;
    const sx0 = toSvgX(0);
    const sy = toSvgY(y);
    svg += '<text x="' + (sx0 - 10) + '" y="' + (sy + 4) + '" text-anchor="end" style="' + axisLabelStyle + '">' + y + "</text>";
  }

  const originalPoints = config.original.points;

  // Optional expected/solution overlay (dashed green)
  if (showSolution && config.transform && config.transform.type) {
    const expectedPoints = applyTransform(originalPoints, config.transform);
    const expectedPath = buildPathData(expectedPoints, toSvgX, toSvgY);

    if (config.original.connectLines !== false) {
      svg += '<path d="' + expectedPath + '" fill="none" stroke="#166534" stroke-width="3" stroke-dasharray="7 5" opacity="0.9" />';
    }

    for (let i = 0; i < expectedPoints.length; i++) {
      const p = expectedPoints[i];
      svg += '<circle cx="' + toSvgX(p[0]) + '" cy="' + toSvgY(p[1]) + '" r="5" fill="#166534" opacity="0.9" />';
    }
  }

  // Original polyline (blue)
  const originalPath = buildPathData(originalPoints, toSvgX, toSvgY);

  if (config.original.connectLines !== false) {
    svg += '<path d="' + originalPath + '" fill="none" stroke="#2563eb" stroke-width="2.5" />';
  }

  // Original points (blue)
  for (let i = 0; i < originalPoints.length; i++) {
    const p = originalPoints[i];
    svg += '<circle cx="' + toSvgX(p[0]) + '" cy="' + toSvgY(p[1]) + '" r="5" fill="#2563eb" />';
  }

  // Function label (blue) — pixel-positioned so it ALWAYS shows
  svg += '<text x="' + (width - 110) + '" y="28" ' +
         'style="font-family: Arial, sans-serif; font-size: 16px; fill: #2563eb; font-weight: 600; pointer-events: none;">' +
         'y = f(x)</text>';

  svg += "</svg>";
  return svg;
}