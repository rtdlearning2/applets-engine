import { computeExpectedPoints } from "./transformEngine.js";

export function createAppState({ config, src }) {
  const originalPoints = config?.original?.points ?? [];

  const state = {
    config,
    src,
    expectedPoints: computeExpectedPoints(
      originalPoints,
      config?.transform
    ),
    studentPoints: [],
    orderedStudentPoints: [],
    showSolution: false,
    lastSubmitCorrect: null,
    feedback: ""
  };

  state.undo = function () {
    state.studentPoints.pop();
  };

  state.enableSolution = function () {
    state.showSolution = true;
  };

  state.clearSolution = function () {
    state.showSolution = false;
  };

  state.reset = function () {
    state.studentPoints = [];
    state.orderedStudentPoints = [];
    state.feedback = "";
    state.showSolution = false;
    state.lastSubmitCorrect = null;
  };

  return state;
}