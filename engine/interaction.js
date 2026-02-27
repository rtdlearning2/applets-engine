// engine/interaction.js

export function attachGraphInteraction(state, onStateChange) {
  const container = document.getElementById("app");
  if (!container) return;

  container.addEventListener("click", () => {
    // Enforce max 5 points
    if (state.studentPoints.length >= 5) return;

    // For now: push a dummy point
    const newPoint = [state.studentPoints.length, 0];

    state.studentPoints.push(newPoint);

    onStateChange();
  });

  console.log("Interaction attached", { title: state.config?.title });
}