# EmployeesNumber — Software Specification

> Assumptions used for this draft (based on the follow-up answers A/B/B/B):
> - **Architecture:** Node.js/Express backend + Vite frontend
> - **Time range selector:** predefined buttons **plus** a custom date-range picker
> - **Charting library:** Chart.js
> - **CSV columns:** first column is the date; every other numeric column becomes a chart series (dynamic, not hard-coded to the sample)
>
> If any of these assumptions are wrong, let me know and I will update the spec.

---

## 1. Overview

**EmployeesNumber** is a web application that lets users upload a CSV file containing employee counts over time and renders an interactive multi-line chart. The x-axis shows the observation date; the y-axis shows the number of employees. Each numeric column in the CSV is rendered as its own line series.

## 2. Goals

- Provide a fast, zero-config way to visualize employee count trends.
- Support the sample file `list2.csv` and any similarly shaped CSV file.
- Allow the user to focus on specific time periods via preset and custom range controls.
- Surface data quality issues (missing values, bad dates, non-numeric counts) clearly.

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js (>=18) | Server runtime |
| Backend framework | Express | REST API for file upload and data parsing |
| Frontend build tool | Vite | Fast dev server and production build |
| Frontend language | Vanilla JavaScript (or optionally React) | UI logic and chart orchestration |
| Charting library | Chart.js + `chartjs-adapter-date-fns` | Line chart, time axis, legend, tooltips |
| Crosshair plugin | `chartjs-plugin-crosshair` (or a small custom plugin) | Vertical crosshair and synced tooltips |
| CSV parsing (server) | `csv-parser` + `multer` | Accept and parse uploaded files |
| CSV parsing (client fallback) | `papaparse` | Optional client-side preview before upload |

### 3.1 Charting Library Suggestions

- **Chart.js** (recommended): Mature, well documented, supports time axes out of the box, and has a large plugin ecosystem for crosshairs and zooming.
- **Recharts**: Excellent if you prefer a React-only component model; less ideal for non-React projects.
- **ApexCharts**: Modern, highly interactive by default, and provides built-in crosshair tooltips and zooming.
- **D3.js**: Maximum flexibility, but requires significantly more custom code for tooltips, legends, and responsive layout.

**Selected for this project:** Chart.js with `chartjs-adapter-date-fns` and `chartjs-plugin-crosshair`.

## 4. Architecture

```
┌─────────────────────────────────┐      HTTP REST API       ┌─────────────────────────────┐
│         Vite SPA (client)         │  <-------------------->  │   Node.js/Express (server)  │
│    Vanilla JS + Chart.js canvas   │   POST /api/upload       │   CSV parsing & validation    │
│    Upload, range picker, chart    │   GET    /api/data       │   In-memory last dataset      │
│                                   │   DELETE /api/data       │                             │
└─────────────────────────────────┘   GET    /health           └─────────────────────────────┘
```

The application follows a thin-backend / rich-frontend split. The server owns **parsing, validation, and short-lived state**, while the client owns **interaction, filtering, and visualization**.

### 4.1 Server-side responsibilities

The backend is an Express application (`server/index.js`) that:

- **Exposes a health check** at `GET /health` for monitoring and CI readiness.
- **Accepts file uploads** at `POST /api/upload` via `multer`, validates the file type and content, and delegates parsing to `server/csv.js`.
- **Parses and cleans CSV data** in `server/csv.js`:
  - Treats the first column as the date column.
  - Treats every fully-numeric column as an employee-count series.
  - Drops rows with missing dates, unparseable dates, or missing numeric values.
  - Ignores non-numeric columns entirely rather than dropping rows.
  - Sorts the remaining rows ascending by date.
  - Returns a `{ dateColumn, series, data }` payload to the client.
- **Holds the latest dataset in memory** so the frontend can reload it on refresh or via `GET /api/data`. This in-memory store is sufficient for a single-user demo and can be cleared with `DELETE /api/data`.
- **Serves the production frontend** when a `dist/` build exists, including the SPA fallback for any non-API route.

### 4.2 Client-side responsibilities

The frontend is a Vite-built single-page application (`client/src/main.js`) that:

- **Provides the upload UI**: a file picker and a drag-and-drop zone.
- **Performs lightweight client-side validation**: rejects files that do not end with `.csv` before sending them to the server.
- **Communicates with the backend** over HTTP:
  - `POST /api/upload` to upload the selected CSV file.
  - `GET /api/data` to load the most recently uploaded dataset, which supports end-to-end flows that seed data via the API before opening the browser.
- **Manages the date-range selector**:
  - Preset buttons for **1 Month**, **1 Year**, and **All Time**.
  - Custom `From` / `To` date inputs that switch the selector to a custom state.
  - Computes the filtered date window and re-renders the chart immediately.
- **Renders the chart** with Chart.js:
  - One line series per numeric column from the CSV.
  - Time-based x-axis and employee-count y-axis.
  - Legend, title, axis labels, hover tooltips, and a vertical crosshair.
- **Exposes the Chart.js instance** on `window.__employeesChart` for test introspection, since Chart.js draws to a canvas that is otherwise hard to query.

### 4.3 Data flow

1. The user selects or drops a `.csv` file in the browser.
2. The client checks the extension and sends the file to `POST /api/upload` as `multipart/form-data`.
3. The server validates the file type, reads it, parses it with `csv-parser`, and cleans it according to the rules in `server/csv.js`.
4. The server returns a JSON payload shaped like `{ dateColumn, series, data }`.
5. The client stores the dataset, enables the range selector, and calls `renderChart()`.
6. `renderChart()` filters the dataset by the selected date range and draws the Chart.js canvas, legend, tooltips, and crosshair.

### 4.4 Development vs production modes

- **Development**: Vite dev server runs on port `5173` and proxies `/api` and `/health` requests to the Express server on port `3000`. This gives fast builds and hot reload.
- **Production**: `npm run build` generates a static `dist/` folder. `npm start` runs Express, which serves the static files and falls back to `index.html` for any non-API route so the SPA handles client-side navigation.

## 5. Data Format & Parsing

### 5.1 Expected CSV Shape

The first column is the date. Every other column must be numeric and is treated as a separate employee-count series.

Example (`list2.csv`):

```csv
observation_date,Endava Bucuresti,Endava Romania,Endava CE Region,All Company
2025-04-08,878,3249,4463,24074
2025-05-08,866,3185,4367,24311
...
```

### 5.2 Parsing Rules

1. The first row is the header and is used for series names and the x-axis label.
2. `observation_date` is parsed as a date (accept `YYYY-MM-DD` first; fall back to ISO and common regional formats).
3. Every other column is parsed as a number.
4. **Drop missing values:** any row containing an empty cell or a non-numeric value in a numeric column is discarded.
5. Rows are sorted ascending by date before returning to the client.
6. Duplicate dates are allowed; they are kept as-is.

### 5.3 Returned JSON Shape

```json
{
  "dateColumn": "observation_date",
  "series": [
    "Endava Bucuresti",
    "Endava Romania",
    "Endava CE Region",
    "All Company"
  ],
  "data": [
    {
      "observation_date": "2025-04-08",
      "Endava Bucuresti": 878,
      "Endava Romania": 3249,
      "Endava CE Region": 4463,
      "All Company": 24074
    }
  ]
}
```

## 6. Features

### 6.1 File Upload

- Button-based file picker.
- Drag-and-drop zone over the chart area.
- Accepted file type: `.csv` (MIME `text/csv`).
- Show file name and row count after a successful upload.
- Display clear errors for:
  - Non-CSV files
  - Empty files
  - No numeric columns found
  - All rows dropped due to missing values

### 6.2 Time Range Selector

Provide preset buttons plus a custom date range picker.

**Preset buttons:**

- **1 Month** — last 30 days from the latest date in the dataset.
- **1 Year** — last 365 days from the latest date in the dataset.
- **More than 1 Year / All Time** — show the full dataset.

**Custom picker:**

- Two `<input type="date">` controls: **Start date** and **End date**.
- Selecting a preset updates the inputs; changing the inputs manually selects the **Custom** state.
- The chart re-renders immediately when the range changes.

### 6.3 Line Chart

- **X-axis:** date (time scale, linear).
- **Y-axis:** number of employees.
- **Lines:** one line for every numeric column; the sample produces 4 lines.
- **Colors:** distinct, accessible palette (default 8+ colors; cycle if more series).
- **Line styling:** 2 px stroke, slight tension disabled (straight segments), points shown on hover.

### 6.4 Interactive Tooltip with Vertical Crosshair

On hover:

- A vertical crosshair line is drawn at the nearest date.
- A tooltip appears near the crosshair containing:
  - The full date.
  - Each series name and its employee count at that date.
- If two data points fall on the same date, the nearest one is used.

### 6.5 Legend and Axis Labels

- **Legend:** clickable to toggle individual series on/off; positioned top by default.
- **X-axis label:** "Date".
- **Y-axis label:** "Number of Employees".
- **Chart title:** "Employee Count Over Time".

## 7. UI Layout

```
+--------------------------------------------------+
|  EmployeesNumber                                 |
+--------------------------------------------------+
|  [Upload CSV]  Uploaded: list2.csv (18 rows)     |
+--------------------------------------------------+
|  Range: [1 Month] [1 Year] [All Time]            |
|  From: [_______] To: [_______]                   |
+--------------------------------------------------+
|                                                  |
|         Line Chart                               |
|         (with crosshair + tooltip)               |
|                                                  |
+--------------------------------------------------+
|  [Legend: Endava Bucuresti, Romania, ... ]       |
+--------------------------------------------------+
```

## 8. API Specification

### `POST /api/upload`

**Request:**

- `Content-Type: multipart/form-data`
- Field: `file` (the CSV file)

**Response — 200 OK:**

```json
{
  "dateColumn": "observation_date",
  "series": ["Endava Bucuresti", "Endava Romania", "Endava CE Region", "All Company"],
  "data": [ ... ]
}
```

**Response — 400 Bad Request:**

```json
{
  "error": "No numeric columns found after the date column."
}
```

## 9. Error Handling & Validation

| Scenario | Behavior |
|----------|----------|
| File is not CSV | Reject with message: "Please upload a .csv file." |
| Empty CSV | Reject with message: "The uploaded file is empty." |
| No numeric columns | Reject with message: "No employee count columns found." |
| Rows with missing values | Drop those rows; report count dropped vs. total rows. |
| Date parsing fails for a row | Drop that row and report the line number in a log. |
| No rows remain after cleaning | Reject with message: "No valid data rows to display." |

## 10. Non-Functional Requirements

- **Responsive:** chart and controls adapt to screen width down to 360 px.
- **Browser support:** latest Chrome, Edge, Firefox, Safari.
- **Performance:** handle CSV files up to ~10,000 rows smoothly.
- **Accessibility:** visible focus states, labels on all inputs, aria-label on upload button.

## 11. Future Considerations

- Client-side CSV parsing to remove the backend entirely.
- Export the chart as PNG/SVG.
- Allow users to rename or hide series before rendering.
- Add zoom/pan on the time axis.
- Persist last uploaded file locally (e.g., `localStorage`) between sessions.
