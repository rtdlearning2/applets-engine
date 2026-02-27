import { computeExpectedPoints } from "./transformEngine.js";

export function createAppState({ config, src }) {
  const originalPoints =
    config?.original?.points ?? [];

  const expectedPoints = computeExpectedPoints(
    originalPoints,
    config?.transform
  );

  return {
    config,
    src,
    expectedPoints,
    studentPoints: [],
    showSolution: false,
    feedback: ""
  };
}