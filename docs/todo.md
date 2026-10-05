# EmployeesNumber — Implementation Todo

This list is ordered from the easiest/least dependent tasks to the more complex ones. Each task includes concrete acceptance criteria you can check off when it is done.

---

## 1. Bootstrap the project (Easy)

Set up the repository, package management, and the two runtimes (Vite frontend + Node/Express backend).

- ✅ A `package.json` exists with scripts for:
  - `npm run dev` — starts the Vite dev server.
  - `npm run server` — starts the Express backend.
  - `npm run build` — creates a production bundle with Vite.
- ✅ Required dependencies are installed: `express`, `multer`, `csv-parser`, `vite`.
- ✅ Required frontend dependencies are installed: `chart.js`, `chartjs-adapter-date-fns`, `chartjs-plugin-crosshair`.
- ✅ Project folder structure is in place: `client/`, `server/`, `uploads/` (temporary).
- ✅ A `.gitignore` excludes `node_modules/`, `dist/`, and `uploads/`.

---

## 2. Build the static UI shell (Easy)

Create the visible page layout before any data or chart logic is wired in.

- ✅ The page title is "EmployeesNumber".
- ✅ A file upload area is visible with a label or drag-and-drop zone.
- ✅ Placeholder text shows the upload status (e.g., "No file selected").
- ✅ Range selector controls are visible: buttons for "1 Month", "1 Year", "All Time" and two date inputs labeled "From" and "To".
- ✅ A `<canvas>` container is present for the chart.
- ✅ The layout roughly matches the UI sketch in `EmployeesNumber_spec.md` section 7.

---

## 3. Create the Express API skeleton (Easy)

Get a minimal backend running so the frontend has an endpoint to call.

- ✅ `GET /health` responds with `{"status":"ok"}`.
- ✅ `POST /api/upload` exists and accepts a multipart form with a field named `file`.
- ✅ For now the endpoint can return a static `200 OK` response with dummy JSON. *(superseded by full implementation in task 4)*
- ✅ The server runs on `http://localhost:3000` (or an environment-configured port).

---

## 4. Implement CSV parsing and validation (Medium)

This is the core data transformation on the backend. It should produce the exact JSON shape defined in the spec.

- ✅ `POST /api/upload` reads the uploaded `.csv` file.
- ✅ Non-CSV files (or missing files) return `400 Bad Request` with a clear error message.
- ✅ Empty files return `400 Bad Request` with the message "The uploaded file is empty."
- ✅ The first column is treated as the date column.
- ✅ Every other column is parsed as a number; non-numeric values cause the row to be dropped.
- ✅ Rows with any missing/empty value are dropped.
- ✅ Remaining rows are sorted ascending by date.
- ✅ The response JSON has this shape:
  ```json
  {
    "dateColumn": "observation_date",
    "series": ["Endava Bucuresti", "Endava Romania", "Endava CE Region", "All Company"],
    "data": [ { ... } ]
  }
  ```
- ✅ Test with `list2.csv`: all 18 rows are returned and the four series names match the header.

---

## 5. Wire the frontend upload to the API (Easy)

Connect the UI from task 2 to the endpoint from tasks 3–4.

- ✅ Clicking "Upload" opens the file picker and restricts files to `.csv`.
- ✅ Dragging and dropping a CSV file onto the zone triggers the upload.
- ✅ The selected file is sent to `POST /api/upload` using `FormData`.
- ✅ On success the frontend stores the returned `series` and `data` in memory.
- ✅ On success the UI displays the file name and the number of valid rows received.
- ✅ On error the UI shows the backend error message in a visible alert area.

---

## 6. Render a basic multi-line chart (Medium)

Get Chart.js drawing the employee counts before adding polish.

- ✅ Chart.js is initialized on the `<canvas>` element.
- ✅ The chart renders one line for every series returned by the backend.
- ✅ The x-axis uses a time scale fed by the `observation_date` values.
- ✅ The y-axis shows numeric employee counts.
- ✅ With `list2.csv`, exactly four lines are visible.
- ✅ Each line uses a distinct color.

---

## 7. Add chart legend and axis labels (Easy)

Make the chart self-explanatory.

- ✅ The chart has a top legend with all series names.
- ✅ Clicking a legend item toggles the visibility of the corresponding line.
- ✅ The x-axis scale title is "Date".
- ✅ The y-axis scale title is "Number of Employees".
- ✅ The chart title is "Employee Count Over Time".

---

## 8. Add interactive tooltip with vertical crosshair (Medium)

Implement the hover behavior requested in the spec.

- ✅ Hovering over the chart draws a vertical crosshair at the nearest date.
- ✅ A tooltip appears near the crosshair.
- ✅ The tooltip shows the full date.
- ✅ The tooltip lists each visible series and its employee count at that date.
- ✅ When two data points have the same date, the tooltip uses the nearest index.

---

## 9. Implement the time range selector (Medium)

Add filtering so users can focus on a subset of the data.

- ✅ The "1 Month" button filters data to the last 30 days from the latest date.
- ✅ The "1 Year" button filters data to the last 365 days from the latest date.
- ✅ The "All Time" button resets the filter and shows the full dataset.
- ✅ The "From" and "To" date inputs set a custom range.
- ✅ Selecting a preset updates the "From" and "To" inputs to reflect the range.
- ✅ Changing the "From" or "To" input clears any active preset button (or selects a "Custom" state).
- ✅ The chart re-renders immediately after any range change.
- ✅ If the selected range contains no data, the chart is empty or shows a "No data in this range" message.

---

## 10. Handle edge cases and errors gracefully (Medium)

Improve the user experience for invalid or unusual inputs.

- ✅ Uploading a file that is not `.csv` shows: "Please upload a .csv file."
- ✅ Uploading a CSV with no numeric columns shows: "No employee count columns found."
- ✅ Uploading a CSV where every row is dropped shows: "No valid data rows to display."
- ✅ A CSV with extra non-numeric columns ignores them or treats only numeric columns as series.
- ✅ The UI disables the range selector and chart area until a valid file is loaded.

---

## 11. Make the layout responsive and accessible (Medium)

Polish the interface for different screen sizes and keyboard/screen-reader users.

- ✅ The layout is usable on a 360 px wide viewport without horizontal overflow.
- ✅ Range buttons stack or wrap on small screens.
- ✅ The chart resizes when the browser window is resized.
- ✅ All inputs have associated `<label>` elements.
- ✅ The upload button has an `aria-label` or accessible name.
- ✅ Focus states are clearly visible for keyboard navigation.

---

## 12. Production build and integration (Hard)

Prepare the app for deployment.

- ✅ `npm run build` runs Vite and produces a `dist/` folder.
- ✅ `npm start` (or equivalent) starts the Express server in production mode and serves the `dist/` folder.
- ✅ The upload and chart flow works end-to-end in the production build using `list2.csv`.
- ✅ A quick smoke test passes: upload → chart renders → change range → tooltip shows values.

---

## Optional / Future Tasks

These are not required for the first working version, but are listed for reference.

- [ ] **Client-side CSV parsing**: remove the backend by parsing the CSV directly in the browser with PapaParse.
- [ ] **Export chart**: add a button to download the chart as PNG or SVG.
- [ ] **Series management**: let users rename or hide series before rendering.
- [ ] **Zoom/pan**: add Chart.js zoom plugin for the time axis.
- [ ] **Local persistence**: remember the last uploaded file in `localStorage`.
