# Copilot / AI contributor quick instructions

This project is a small, DOM-driven engine for interactive graph applets. Keep guidance focused and concrete so AI agents can be productive immediately.

1. Purpose & big picture
   - `activity/` contains the runnable app (HTML/CSS/JS). `activity/index.html` loads `activity/app.js` (module) which bootstraps the engine.
   - `engine/` contains the core: config loading/migrations (`configLoader.js`, `configMigrations.js`), state creation (`state.js`), rendering (`renderer.js`, `gridRenderer.js`, `seriesRenderer.js`), interaction (`interaction.js`), validation (`validator.js`), and transformation logic (`transformEngine.js`).
   - Config JSONs (e.g. `engine/config/golden.json`, `config/sample-transform.json`) are loaded via a `?src=` URL parameter and normalized by the migration layer.

2. Quick dev/run (what actually works locally)
   - Install and run the dev server with Vite: `npm install` then `npm run dev` (package.json -> `dev: vite`).
   - Open the activity page with a src param pointing at a local config. Example (vite default port 5173):

     http://localhost:5173/activity/index.html?src=/engine/config/golden.json

3. Key patterns and conventions (explicit, reproducible)
   - ES module style across `engine/*.js` (use import/export). Keep code modular and avoid global state other than the `state` object returned by `createAppState`.
   - State is a mutable POJO returned from `createAppState` (see `engine/state.js`). Methods like `undo`, `reset`, `zoomIn`, etc. are attached directly to the state object. When mutating state, call `render(state)` to refresh UI.
   - Rendering is fully DOM/SVG string-based (no framework). `renderer.render(state)` builds an SVG via `renderGrid` and `renderSeries`. Series objects follow two types: `points` and `polyline` (see `engine/seriesRenderer.js`). Use `{ type: "points"|"polyline", points: [{x,y}], style: {...} }`.
   - Interaction maps screen coordinates to graph coordinates in `interaction.js`. Click handling uses integer snapping (Math.round) and a pixel `hitRadius` from `config.interaction.hitRadiusPx`. Avoid changing snapping logic unless you update tests and examples.
   - Validation flow: Submit button calls `validate(activityType, state, config)` from `engine/validators/index.js`. For ordering checks the project uses `orderStudentPoints(expectedPoints, studentPoints)` in `engine/validator.js`.

4. Domain specifics worth preserving
   - `transformEngine.computeExpectedPoints` implements the canonical transformations: `reflect_x`, `reflect_y`, `translate`, `rotate` (restricted to 90° multiples), and `dilate` (with optional pivot). Tests or example configs rely on these exact behaviors.
   - Configs may include `schemaVersion`; older layouts are normalized by `configMigrations.js`. When adding fields, prefer migrating via `configMigrations.js` so older configs remain compatible.

5. Recommended edit/PR patterns for AI patches
   - Small, focused changes. If changing how points are snapped/rounded, update `interaction.js`, `state.js` normalization (snapStep), and any sample configs in `engine/config/` to keep examples working.
   - When adding features that change client-visible output (SVG shapes, labels), include a new example config under `engine/config/` and a brief note in `README.md`.
   - Avoid introducing new global DOM listeners; `attachGraphInteraction` centralizes pointer handling.

6. Helpful files to reference in patches
   - `engine/configLoader.js` — how configs are fetched and migrated
   - `engine/state.js` — shape of the `state` object and methods attached
   - `engine/renderer.js` — top-level rendering and UI buttons
   - `engine/gridRenderer.js`, `engine/seriesRenderer.js` — SVG coordinate mapping and series rendering
   - `engine/interaction.js` — click → graph coordinate mapping and snapping rules
   - `engine/transformEngine.js` — source of truth for expected-point computation
   - `engine/config/golden.json` — canonical example the app uses in docs

7. What not to change without review
   - The integer-only rotation assumptions (rotate only 0/90/180/270) in `transformEngine.js` — authors explicitly rely on that.
   - The `orderStudentPoints` matching algorithm (tolerance = 0) unless accompanied by tests and updated sample configs.

If anything here is unclear or you want the doc to include extra examples (URLs, typical PR templates, or testing instructions), tell me which parts to expand and I will iterate. 
