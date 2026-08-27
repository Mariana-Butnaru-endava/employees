import fs from 'node:fs';
import csvParser from 'csv-parser';

/**
 * Parses a CSV file at `filePath` according to the EmployeesNumber spec:
 * - First column is the date column.
 * - Every other column must be numeric; rows with a missing/non-numeric
 *   value in any numeric column are dropped.
 * - Rows are sorted ascending by date.
 *
 * Returns { dateColumn, series, data } or throws an Error with a
 * user-facing `.message` for validation failures.
 */
export function parseEmployeesCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = null;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (h) => {
        headers = h;
      })
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        try {
          resolve(buildResult(headers, rows));
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => reject(err));
  });
}

function buildResult(headers, rows) {
  if (!headers || headers.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const [dateColumn, ...seriesColumns] = headers;

  if (seriesColumns.length === 0) {
    throw new Error('No employee count columns found.');
  }

  if (rows.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const cleanRows = [];

  for (const row of rows) {
    const rawDate = (row[dateColumn] ?? '').trim();
    if (rawDate === '' || Number.isNaN(Date.parse(rawDate))) {
      continue;
    }

    const parsedRow = { [dateColumn]: rawDate };
    let rowIsValid = true;

    for (const col of seriesColumns) {
      const rawValue = row[col];
      if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
        rowIsValid = false;
        break;
      }
      const numValue = Number(rawValue);
      if (Number.isNaN(numValue)) {
        rowIsValid = false;
        break;
      }
      parsedRow[col] = numValue;
    }

    if (rowIsValid) {
      cleanRows.push(parsedRow);
    }
  }

  if (cleanRows.length === 0) {
    throw new Error('No valid data rows to display.');
  }

  cleanRows.sort((a, b) => new Date(a[dateColumn]) - new Date(b[dateColumn]));

  return {
    dateColumn,
    series: seriesColumns,
    data: cleanRows,
  };
}
