import { computeExpectedPoints } from "./transformEngine.js";
import { orderStudentPoints } from "./validator.js";

const DEFAULT_SNAP_STEP = 1;

function normalizeSnapStep(step) {
  const value = Number(step);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SNAP_STEP;
}

export function createAppState({ config, src }) {
  const interaction = config?.interaction ?? {};
  const feedback = config?.feedback ?? {};

  const normalizedConfig = {
    ...config,
    interaction: {
      ...interaction,
      snapStep: normalizeSnapStep(interaction.snapStep),
      hitRadiusPx: interaction.hitRadiusPx ?? 12
    },
    feedback: {
      showExpectedPointsOnFail: feedback.showExpectedPointsOnFail ?? false,
      showSolutionOnFail: feedback.showSolutionOnFail ?? false,
      allowHints: feedback.allowHints ?? false
    }
  };

  const originalPoints = normalizedConfig?.original?.points ?? [];

  const state = {
    config: normalizedConfig,
    src,
    expectedPoints: computeExpectedPoints(
      originalPoints,
      normalizedConfig?.transform
    ),
    studentPoints: [],
    orderedStudentPoints: [],
    showSolution: false,
    lastSubmitCorrect: null,
    feedback: "",
    submitted: false,
    view: {
      xmin: normalizedConfig.grid.xmin,
      xmax: normalizedConfig.grid.xmax,
      ymin: normalizedConfig.grid.ymin,
      ymax: normalizedConfig.grid.ymax
    }
  };

state.undo = function () {
  state.studentPoints.pop();
  state.orderedStudentPoints = orderStudentPoints(
    state.expectedPoints,
    state.studentPoints
  );
  state.feedback = "";
};

  state.zoomIn = function () {
    const xRange = state.view.xmax - state.view.xmin;
    const yRange = state.view.ymax - state.view.ymin;
    const cx = (state.view.xmin + state.view.xmax) / 2;
    const cy = (state.view.ymin + state.view.ymax) / 2;

    state.view.xmin = cx - (xRange * 0.8) / 2;
    state.view.xmax = cx + (xRange * 0.8) / 2;
    state.view.ymin = cy - (yRange * 0.8) / 2;
    state.view.ymax = cy + (yRange * 0.8) / 2;
  };

  state.zoomOut = function () {
    const xRange = state.view.xmax - state.view.xmin;
    const yRange = state.view.ymax - state.view.ymin;
    const cx = (state.view.xmin + state.view.xmax) / 2;
    const cy = (state.view.ymin + state.view.ymax) / 2;

    state.view.xmin = cx - (xRange * 1.2) / 2;
    state.view.xmax = cx + (xRange * 1.2) / 2;
    state.view.ymin = cy - (yRange * 1.2) / 2;
    state.view.ymax = cy + (yRange * 1.2) / 2;
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
    state.submitted = false;
  };

  return state;
}
