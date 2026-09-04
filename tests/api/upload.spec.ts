import { expect } from '@playwright/test';
import { env } from '../../src/config/env.ts';
import { test, API_BASE_URL } from '../../src/fixtures/testFixtures.ts';
import { fixture } from '../helpers/fixtures.ts';
import { expectBadRequest, expectOkJson } from '../helpers/api-fixtures.ts';

/**
 * Shape of a successful upload response. Kept here so assertions stay typed.
 */
type UploadResponse = {
  dateColumn: string;
  series: string[];
  data: Record<string, number | string>[];
};

test.describe('POST /api/upload', () => {
  test.describe('positive cases', () => {
    test('returns the expected schema for the sample CSV', async ({ uploadService }) => {
      const response = await uploadService.uploadCsvFile(fixture('list2.csv'));
      console.log('Upload response: ', await response.json());
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.dateColumn).toBe('observation_date');
      expect(body.series).toEqual([
        'Endava Bucuresti',
        'Endava Romania',
        'Endava CE Region',
        'All Company',
      ]);
      expect(body.data).toHaveLength(18);

      const firstRow = body.data[0];
      expect(firstRow.observation_date).toBe('2025-04-08');
      expect(firstRow['Endava Bucuresti']).toBe(878);
      expect(firstRow['Endava Romania']).toBe(3249);
      expect(firstRow['Endava CE Region']).toBe(4463);
      expect(firstRow['All Company']).toBe(24074);
    });

    test('sorts rows by date in ascending order', async ({ uploadService }) => {
      const csv = `observation_date,Team A
2025-05-01,10
2025-01-01,7
2025-03-01,5
`;
      const response = await uploadService.uploadCsvContent(csv, 'unsorted.csv');
      console.log('Upload response: ', await response.json());
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.data.map((row) => row.observation_date)).toEqual([
        '2025-01-01',
        '2025-03-01',
        '2025-05-01',
      ]);
    });

    test('accepts ISO date formats', async ({ uploadService }) => {
      const csv = `observation_date,Team A
2025-05-08T00:00:00.000Z,10
2025-04-08T00:00:00.000Z,20
`;
      const response = await uploadService.uploadCsvContent(csv, 'iso-dates.csv');
      console.log('Upload response: ', await response.json());
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.data).toHaveLength(2);
      expect(body.data[0].observation_date).toMatch(/^2025-04-08/);
    });

    test('works with a single numeric series', async ({ uploadService }) => {
      const csv = `observation_date,Headcount
2025-04-08,100
2025-05-08,105
`;
      const response = await uploadService.uploadCsvContent(csv, 'single-series.csv');
      console.log('Upload response: ', await response.json());
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.series).toEqual(['Headcount']);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].Headcount).toBe(100);
    });

    test('ignores non-numeric columns instead of dropping rows', async ({ uploadService }) => {
      const csv = `observation_date,Headcount,Notes
2025-04-08,100,holiday
2025-05-08,105,offsite
`;
      const response = await uploadService.uploadCsvContent(csv, 'with-notes.csv');
      //console.log('Upload response: ', await response.json());
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.series).toEqual(['Headcount']);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].Notes).toBeUndefined();
    });

    test.skip('handles a UTF-8 BOM at the start of the file', async ({ uploadService }) => {
      const csv = '\uFEFFobservation_date,Headcount\n2025-04-08,100\n';
      const response = await uploadService.uploadCsvContent(csv, 'bom.csv');
      const body = (await expectOkJson(response)) as UploadResponse;

      expect(body.dateColumn).toBe('observation_date');
      expect(body.series).toEqual(['Headcount']);
      expect(body.data).toHaveLength(1);
    });
  });

  test.describe('negative cases', () => {
    test('rejects a request with no file', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}${env.uploadEndpoint}`);
      await expectBadRequest(response, 'Please upload a .csv file.');
    });

    test('rejects a non-CSV file based on extension', async ({ uploadService }) => {
      const response = await uploadService.uploadCsvFile(
        fixture('not-a-csv.txt'),
        undefined,
        'text/plain',
      );
      await expectBadRequest(response, 'Please upload a .csv file.');
    });

    test('rejects an empty CSV file', async ({ uploadService }) => {
      const response = await uploadService.uploadCsvFile(fixture('empty.csv'));
      await expectBadRequest(response, 'The uploaded file is empty.');
    });

    test('rejects a CSV with no numeric columns', async ({ uploadService }) => {
      const response = await uploadService.uploadCsvFile(fixture('no-numeric.csv'));
      await expectBadRequest(response, 'No employee count columns found.');
    });

    test('rejects a CSV when every row is dropped', async ({ uploadService }) => {
      const response = await uploadService.uploadCsvFile(fixture('all-dropped.csv'));
      await expectBadRequest(response, 'No valid data rows to display.');
    });

    test('rejects a CSV with all numeric values missing', async ({ uploadService }) => {
      const csv = `observation_date,Headcount
2025-04-08,
2025-05-08,
`;
      const response = await uploadService.uploadCsvContent(csv, 'missing-values.csv');
      await expectBadRequest(response, 'No valid data rows to display.');
    });
  });
});
