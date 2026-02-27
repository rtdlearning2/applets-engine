// engine/transformEngine.js

export function computeExpectedPoints(originalPoints, transform) {
  if (!transform || !transform.type) {
    return originalPoints;
  }

  if (transform.type === "reflect_x") {
    return originalPoints.map(p => [p[0], -p[1]]);
  }

  if (transform.type === "reflect_y") {
    return originalPoints.map(p => [-p[0], p[1]]);
  }

  // Default: no transform
  return originalPoints;
}