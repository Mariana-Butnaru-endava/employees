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

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Title
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

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const uploadStatus = document.getElementById('upload-status');
const uploadError = document.getElementById('upload-error');
const chartMessage = document.getElementById('chart-message');
const chartCanvas = document.getElementById('employees-chart');

let chart = null;
let currentDataset = null; // { dateColumn, series, data }

function showError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
}

function clearError() {
  uploadError.hidden = true;
  uploadError.textContent = '';
}

async function uploadFile(file) {
  clearError();

  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.csv')) {
    showError('Please upload a .csv file.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const body = await response.json();

    if (!response.ok) {
      showError(body.error || 'Upload failed.');
      uploadStatus.textContent = 'No file selected';
      return;
    }

    currentDataset = body;
    uploadStatus.textContent = `Uploaded: ${file.name} (${body.data.length} rows)`;
    renderChart(currentDataset);
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  }
}

function renderChart({ dateColumn, series, data }) {
  chartMessage.hidden = true;

  const datasets = series.map((name, i) => ({
    label: name,
    data: data.map((row) => ({ x: row[dateColumn], y: row[name] })),
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
      },
    },
  });
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
