export function render(state) {
  const el = document.getElementById("app");
  if (!el) throw new Error("Missing #app container in index.html");

  const title = state.config?.title ?? "Untitled Activity";

  const expectedCount = state.expectedPoints?.length ?? 0;
  const studentCount = state.studentPoints?.length ?? 0;

  el.innerHTML = `
    <div style="padding:16px;font-family:Arial, sans-serif;">
      <h2>${title}</h2>
      <p><strong>Config loaded successfully.</strong></p>
      <p>Expected points: ${expectedCount}</p>
      <p>Student points: ${studentCount}</p>
    </div>
  `;
}