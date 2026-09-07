import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { parseEmployeesCsv } from './csv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const distDir = path.join(rootDir, 'dist');

fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

const app = express();
const PORT = process.env.PORT || 3000;

/** In-memory store for the most recently uploaded dataset. */
let lastUpload = null;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Returns the most recently uploaded dataset, or 404 if no upload exists.
 */
app.get('/api/data', (req, res) => {
  if (!lastUpload) {
    return res.status(404).json({ error: 'No uploaded dataset available.' });
  }
  res.json(lastUpload);
});

/**
 * Clears the in-memory uploaded dataset.
 */
app.delete('/api/data', (req, res) => {
  lastUpload = null;
  res.status(204).send();
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Please upload a .csv file.' });
  }

  const isCsv =
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    path.extname(file.originalname).toLowerCase() === '.csv';

  if (!isCsv) {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ error: 'Please upload a .csv file.' });
  }

  const rawContent = fs.readFileSync(file.path, 'utf8').replace(/^\uFEFF/, '').trim();
  if (rawContent === '') {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ error: 'The uploaded file is empty.' });
  }

  try {
    const result = await parseEmployeesCsv(file.path);
    lastUpload = result;
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// Serve the production build once it exists (task 12).
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`EmployeesNumber server listening on http://localhost:${PORT}`);
});
