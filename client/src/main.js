import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { CrosshairPlugin } from 'chartjs-plugin-crosshair';
import { format } from 'date-fns';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Title,
  CrosshairPlugin
);

const COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4b5563',
];

const DAY_MS = 24 * 60 * 60 * 1000;

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const uploadStatus = document.getElementById('upload-status');
const uploadError = document.getElementById('upload-error');
const chartMessage = document.getElementById('chart-message');
const chartCanvas = document.getElementById('employees-chart');
const rangeFieldset = document.getElementById('range-fieldset');
const rangeButtons = Array.from(document.querySelectorAll('.range-btn'));
const fromInput = document.getElementById('from-date');
const toInput = document.getElementById('to-date');

let chart = null;
let currentDataset = null; // { dateColumn, series, data }
let uploadSequence = 0;
let activeUploadController = null;

function showError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
}

function clearError() {
  uploadError.hidden = true;
  uploadError.textContent = '';
}

function toDateInputValue(date) {
  return format(date, 'yyyy-MM-dd');
}

function setActiveRangeButton(range) {
  rangeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
}

async function uploadFile(file) {
  const sequence = ++uploadSequence;
  activeUploadController?.abort();
  activeUploadController = null;
  clearError();

  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.csv')) {
    showError('Please upload a .csv file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  const controller = new AbortController();
  activeUploadController = controller;

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    const body = await response.json();

    if (sequence !== uploadSequence) return;

    if (!response.ok) {
      showError(body.error || 'Upload failed.');
      uploadStatus.textContent = 'No file selected';
      resetChartArea();
      return;
    }

    currentDataset = body;
    uploadStatus.textContent = `Uploaded: ${file.name} (${body.data.length} rows)`;
    enableControls();
    setActiveRangeButton('all');
    applyRange(fullDateBounds());
  } catch (err) {
    if (sequence !== uploadSequence || err.name === 'AbortError') return;
    showError('Could not reach the server. Please try again.');
    resetChartArea();
  } finally {
    if (sequence === uploadSequence) {
      activeUploadController = null;
    }
  }
}

function enableControls() {
  rangeFieldset.disabled = false;
}

function resetChartArea() {
  currentDataset = null;
  rangeFieldset.disabled = true;
  fromInput.value = '';
  toInput.value = '';
  setActiveRangeButton(null);
  if (chart) {
    chart.destroy();
    chart = null;
    window.__employeesChart = null;
  }
  chartCanvas.hidden = true;
  chartMessage.hidden = false;
  chartMessage.textContent = 'Upload a CSV file to see the chart.';
}

function fullDateBounds() {
  const dates = currentDataset.data.map((row) => new Date(row[currentDataset.dateColumn]).getTime());
  return { from: new Date(Math.min(...dates)), to: new Date(Math.max(...dates)) };
}

function applyRange({ from, to }) {
  fromInput.value = toDateInputValue(from);
  toInput.value = toDateInputValue(to);
  renderChart(from, to);
}

function renderChart(fromDate, toDate) {
  const { dateColumn, series, data } = currentDataset;

  const fromTime = fromDate.getTime();
  const toTime = toDate.getTime() + DAY_MS - 1; // include the whole "to" day

  const filteredRows = data.filter((row) => {
    const t = new Date(row[dateColumn]).getTime();
    return t >= fromTime && t <= toTime;
  });

  if (filteredRows.length === 0) {
    if (chart) {
      chart.destroy();
      chart = null;
      window.__employeesChart = null;
    }
    chartCanvas.hidden = true;
    chartMessage.hidden = false;
    chartMessage.textContent = 'No data in this range.';
    return;
  }

  chartCanvas.hidden = false;
  chartMessage.hidden = true;

  const datasets = series.map((name, i) => ({
    label: name,
    data: filteredRows.map((row) => ({ x: row[dateColumn], y: row[name] })),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length],
    borderWidth: 2,
    tension: 0,
    pointRadius: 0,
    pointHoverRadius: 4,
  }));

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          type: 'time',
          title: { display: true, text: 'Date' },
        },
        y: {
          title: { display: true, text: 'Number of Employees' },
        },
      },
      plugins: {
        title: { display: true, text: 'Employee Count Over Time' },
        legend: { position: 'top' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title(items) {
              if (!items.length) return '';
              return format(new Date(items[0].parsed.x), 'PPP');
            },
            label(item) {
              return `${item.dataset.label}: ${Math.round(item.parsed.y).toLocaleString()}`;
            },
          },
        },
        crosshair: {
          line: { color: '#9ca3af', width: 1 },
          sync: { enabled: false },
          zoom: { enabled: false },
        },
      },
    },
  });

  // Exposed for ui test introspection only (Chart.js renders to canvas, so
  // tests need a handle to read datasets/tooltip/crosshair state).
  window.__employeesChart = chart;
}

fileInput.addEventListener('change', (e) => {
  uploadFile(e.target.files[0]);
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  uploadFile(file);
});

rangeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!currentDataset) return;

    const { to: latest } = fullDateBounds();
    const range = btn.dataset.range;
    let from;
    let to = latest;

    if (range === '1m') {
      from = new Date(latest.getTime() - 30 * DAY_MS);
    } else if (range === '1y') {
      from = new Date(latest.getTime() - 365 * DAY_MS);
    } else {
      ({ from, to } = fullDateBounds());
    }

    setActiveRangeButton(range);
    applyRange({ from, to });
  });
});

function onCustomDateChange() {
  if (!currentDataset) return;
  if (!fromInput.value || !toInput.value) return;

  const from = new Date(fromInput.value);
  const to = new Date(toInput.value);

  if (from > to) return;

  setActiveRangeButton('custom');
  renderChart(from, to);
}

fromInput.addEventListener('change', onCustomDateChange);
toInput.addEventListener('change', onCustomDateChange);
