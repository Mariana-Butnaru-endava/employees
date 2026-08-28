import { test, expect } from '@playwright/test';
import { fixture } from './fixtures.js';

test.describe('Upload error handling', () => {
  test('uploading a non-CSV file shows the .csv error', async ({ page }) => {
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture('not-a-csv.txt'));

    await expect(page.locator('#upload-error')).toHaveText('Please upload a .csv file.');
    await expect(page.locator('#employees-chart')).toBeHidden();
    await expect(page.locator('.range-btn').first()).toBeDisabled();
  });

  test('uploading an empty CSV shows the empty-file error', async ({ page }) => {
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture('empty.csv'));

    await expect(page.locator('#upload-error')).toHaveText('The uploaded file is empty.');
  });

  test('uploading a CSV with no numeric columns shows the no-columns error', async ({ page }) => {
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture('no-numeric.csv'));

    await expect(page.locator('#upload-error')).toHaveText('No employee count columns found.');
  });

  test('uploading a CSV where every row is dropped shows the no-valid-rows error', async ({
    page,
  }) => {
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture('all-dropped.csv'));

    await expect(page.locator('#upload-error')).toHaveText('No valid data rows to display.');
  });

  test.only('a subsequent valid upload clears a previous error', async ({ page }) => {
    const validFile = 'list2.csv';
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture('not-a-csv.txt'));
    await expect(page.locator('#upload-error')).toBeVisible();

    await page.setInputFiles('#file-input', fixture(validFile));
    
    await expect(page.locator('#upload-status')).toBeVisible();
    await expect(page.locator('#upload-status')).toContainText(`Uploaded: ${validFile}`);
    await expect(page.locator('#employees-chart')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeEnabled();
    await expect(page.locator('#upload-error')).toBeHidden();
  });
});
