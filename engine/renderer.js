export function render(state) {
  const el = document.getElementById("app");
  if (!el) throw new Error("Missing #app container in index.html");

  const title = state.config?.title ?? "Untitled Activity";

  el.innerHTML = `
    <div style="padding:16px;font-family:Arial, sans-serif;">
      <h2>${title}</h2>
      <p><strong>Config loaded successfully.</strong></p>
      <p>Expected points: ${state.expectedPoints.length}</p>
      <p>Student points: ${state.studentPoints.length}</p>
    </div>
  `;
}