# EmployeesNumber — Testing Strategy

Testing is organized in layers, from fast, cheap unit tests to slower, high-confidence end-to-end tests. This mirrors the architecture in `EmployeesNumber_spec.md` and lets the most valuable checks run on every edit while heavier checks run in CI or before release.

---

## 1. Backend unit tests — `parseEmployeesCsv`

The CSV parsing logic in `server/csv.js` is pure, dependency-light JavaScript (no HTTP, no DOM), so it is the cheapest place to get high coverage. Use **Vitest** (already fits the Vite stack) or **node:test`.

Recommended cases:

- **Happy path**: a `list2.csv`-shaped file returns `{ dateColumn, series, data }` with all valid rows in ascending date order.
- **Row dropping**: rows with an empty cell, non-numeric value, or unparseable date are dropped; valid rows survive.
- **Column-vs-row distinction** (`server/csv.js` lines 55–63): a column that is non-numeric in *every* row is ignored entirely, not treated as an error for individual rows. Regression test this specifically.
- **BOM handling** (`server/csv.js` line 20): a header prefixed with `\uFEFF` still yields the correct `dateColumn` name.
- **Error messages**:
  - empty headers/rows → `"The uploaded file is empty."`
  - no candidate columns → `"No employee count columns found."`
  - no numeric columns after filtering → `"No employee count columns found."`
  - every row dropped → `"No valid data rows to display."`
- **Duplicate dates**: the spec allows duplicates; test they are kept, not deduplicated.
- **Sorting stability**: out-of-order rows end up sorted ascending.

---

## 2. Backend integration tests — `POST /api/upload`, `GET /health`

Use **Supertest** against the Express `app` in `server/index.js` (export `app` separately from `listen()` to make it importable).

- `GET /health` → `200` with `{ "status": "ok" }`.
- `POST /api/upload` with no file → `400`.
- Non-CSV extension or mimetype → `400` with `"Please upload a .csv file."` (`server/index.js` lines 31–39).
- Empty file (including BOM-only) → `400` with `"The uploaded file is empty."` (`server/index.js` lines 41–45).
- Valid `list2.csv` fixture → `200` with the expected JSON body.
- Temp file cleanup: verify the file in `uploads/` is removed after the request, including on error (`server/index.js` lines 52–54).
- Static SPA fallback: when `dist/` exists, a non-API route returns `index.html` (`server/index.js` lines 58–63). Best verified after `npm run build`.

---

## 3. Frontend logic tests

`client/src/main.js` mixes pure logic with DOM/Chart.js side effects. Extract the date math into exported, testable functions first:

- `fullDateBounds` (`client/src/main.js` lines 148–151)
- The `1 Month` / `1 Year` range calculation in the `rangeButtons` click handler (`client/src/main.js` lines 269–289)
- The `"to"` day inclusivity fix in `renderChart` (`client/src/main.js` line 163: `toTime + DAY_MS - 1`)
- The `from > to` guard (`client/src/main.js` line 298)

Then test with Vitest: given a fixed latest date, does `1 Month` produce `latest - 30 days`? Does the `to` input include the full calendar day? Does `from > to` get rejected?

---

## 4. Frontend DOM/component tests

Using **Vitest + jsdom** (or `@testing-library/dom`), mock `fetch` and Chart.js:

- Upload flow: selecting a file triggers `uploadFile`; a successful response updates `uploadStatus` and enables `rangeFieldset`.
- Error flow: a non-CSV filename shows the client-side error without a network call (`client/src/main.js` lines 85–88); a `400` response shows the server message and calls `resetChartArea`.
- Initial state: `rangeFieldset.disabled` is `true` and the canvas is `hidden` before any upload.
- Drag-and-drop: a `drop` event with `dataTransfer.files[0]` triggers the same upload path (`client/src/main.js` lines 262–267).

---

## 5. End-to-end tests (Playwright)

Playwright covers the full browser stack, including Chart.js canvas rendering. An E2E suite already exists in `e2e/*.spec.ts` and is configured in `playwright.config.js`.

Playwright is the natural fit since you're already testing exactly this way manually:

Upload list2.csv → chart canvas becomes visible, legend shows all 4 series.
Click "1 Month"/"1 Year"/"All Time" → From/To inputs update and the visible line count changes.
Set custom From/To dates that exclude all data → "No data in this range." message appears.
Hover over the chart → a tooltip element appears (this is the one area unit tests can't really cover, since it's Canvas-rendered).
Upload an invalid file (non-CSV, empty, no numeric columns) → correct error text appears in #upload-error.
Full production flow: npm run build && npm start, then run the same Playwright suite against localhost:3000 instead of the Vite dev server — catches build/serving regressions like the static-fallback route.

Existing coverage:

- `e2e/upload.spec.ts`: chart area disabled before upload; `list2.csv` renders four series, with the expected point count derived from the CSV fixture rather than a hardcoded row count, and distinct colors; drag-and-drop upload works.
- `e2e/errors.spec.ts`: non-CSV, empty CSV, no numeric columns, all rows dropped, and a subsequent valid upload clears the previous error.
- `e2e/range-selector.spec.ts`: `All Time` default; `1 Month` and `1 Year` presets; expected date bounds and point counts are calculated from the current values in `list2.csv` instead of hardcoded dates or row counts; custom date inputs filter and clear presets; empty range shows `"No data in this range."`; failed upload resets the range selector.
- `e2e/legend-tooltip-crosshair.spec.ts`: legend labels and position; clicking legend toggles series; chart title and axis titles; hover draws crosshair and shows tooltip with all four series; mouse-out hides tooltip.

Additional cases to add:

- **Production build flow**: `npm run build && npm start`, then run the Playwright suite against `localhost:3000` to catch build/serving regressions.
- **Responsive layout**: verify usability at 360px width.
- **Accessibility**: verify all inputs have labels and focus states are visible.

---

## 6. Suggested priority

1. `csv.js` unit tests — cheapest, catches column-vs-row dropping and BOM issues.
2. Supertest API tests — validates the contract the frontend depends on.
3. Playwright E2E tests for the core `upload → chart → range → tooltip` flow — already in place; highest regression confidence for Canvas-rendered behavior.
4. Frontend logic/DOM tests — worth adding after extracting pure date functions; lower priority given the current file structure.

---

## 7. Running the tests

Run these commands from the `EmployeesNumber` directory.

```bash
# Run the complete Playwright test suite
npm test

# Run tests by layer
npm run test:api
npm run test:ui
npm run test:e2e

# Run UI tests in a visible browser
npm run test:ui:headed

# Run TypeScript validation
npm run typecheck

# Generate and open the Allure report
npm run allure:generate
npm run allure:open

# Production build smoke test
npm run build
npm start
# Open http://localhost:3000 and verify the production build