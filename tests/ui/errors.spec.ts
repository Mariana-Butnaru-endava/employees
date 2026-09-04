import { expect } from '@playwright/test';
import { test } from '../helpers/ui-fixtures.ts';
import { fixture } from '../helpers/fixtures.ts';

test.describe('Upload error handling', () => {
  test('uploading a non-CSV file shows the .csv error', async ({ homePage }) => {
    await homePage.goto();

    await homePage.upload.uploadFile(fixture('not-a-csv.txt'));

    await expect(homePage.upload.uploadError).toHaveText('Please upload a .csv file.');
    await expect(homePage.chart.chartCanvas).toBeHidden();
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeDisabled();
  });

  test('uploading an empty CSV shows the empty-file error', async ({ homePage }) => {
    await homePage.goto();

    await homePage.upload.uploadFile(fixture('empty.csv'));

    await expect(homePage.upload.uploadError).toHaveText('The uploaded file is empty.');
  });

  test('uploading a CSV with no numeric columns shows the no-columns error', async ({ homePage }) => {
    await homePage.goto();

    await homePage.upload.uploadFile(fixture('no-numeric.csv'));

    await expect(homePage.upload.uploadError).toHaveText('No employee count columns found.');
  });

  test('uploading a CSV where every row is dropped shows the no-valid-rows error', async ({
    homePage,
  }) => {
    await homePage.goto();

    await homePage.upload.uploadFile(fixture('all-dropped.csv'));

    await expect(homePage.upload.uploadError).toHaveText('No valid data rows to display.');
  });

  test('a subsequent valid upload clears a previous error', async ({ homePage }) => {
    const validFile = 'list2.csv';
    await homePage.goto();

    await homePage.upload.uploadFile(fixture('not-a-csv.txt'));
    await expect(homePage.upload.uploadError).toBeVisible();

    await homePage.upload.uploadFile(fixture(validFile));

    await expect(homePage.upload.uploadStatus).toBeVisible();
    await expect(homePage.upload.uploadStatus).toContainText(`Uploaded: ${validFile}`);
    await expect(homePage.chart.chartCanvas).toBeVisible();
    await expect(homePage.rangeSelector.rangeFieldset).toBeEnabled();
    await expect(homePage.rangeSelector.rangeButton('1m')).toBeEnabled();
    await expect(homePage.upload.uploadError).toBeHidden();
  });
});
