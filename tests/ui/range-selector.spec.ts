import { test, expect, Page } from '@playwright/test';
import { fixture } from '../helpers/fixtures.ts';

async function uploadAndWaitForChart(page: Page) {
  await page.goto('/');
  await page.setInputFiles('#file-input', fixture('list2.csv'));
  await page.waitForFunction(() => window.__employeesChart);
}

async function pointCount(page: Page) {
  return page.evaluate(() => window.__employeesChart.data.datasets[0].data.length);
}

test.describe('Time range selector', () => {
  test('"All Time" is selected by default and shows every row', async ({ page }) => {
    await uploadAndWaitForChart(page);

    await expect(page.locator('.range-btn[data-range="all"]')).toHaveClass(/active/);
    expect(await pointCount(page)).toBe(18);
    await expect(page.locator('#from-date')).toHaveValue('2025-04-08');
    await expect(page.locator('#to-date')).toHaveValue('2026-09-10');
  });

  test('"1 Month" filters to the last 30 days from the latest date', async ({ page }) => {
    await uploadAndWaitForChart(page);

    await page.click('.range-btn[data-range="1m"]');

    await expect(page.locator('.range-btn[data-range="1m"]')).toHaveClass(/active/);
    await expect(page.locator('.range-btn[data-range="all"]')).not.toHaveClass(/active/);
    await expect(page.locator('#to-date')).toHaveValue('2026-09-10');
    await expect(page.locator('#from-date')).toHaveValue('2026-08-11');
    // Only the 2026-09-10 row falls within 30 days of itself in this dataset.
    expect(await pointCount(page)).toBe(1);
  });

  test('"1 Year" filters to the last 365 days from the latest date', async ({ page }) => {
    await uploadAndWaitForChart(page);

    await page.click('.range-btn[data-range="1y"]');

    await expect(page.locator('.range-btn[data-range="1y"]')).toHaveClass(/active/);
    await expect(page.locator('#to-date')).toHaveValue('2026-09-10');
    await expect(page.locator('#from-date')).toHaveValue('2025-09-10');
    expect(await pointCount(page)).toBe(13);
  });

  test('changing the custom date inputs filters the chart and clears the active preset', async ({
    page,
  }) => {
    await uploadAndWaitForChart(page);

    await page.fill('#from-date', '2025-10-08');
    await page.fill('#to-date', '2026-01-08');
    // Trigger the 'change' event (fill() alone may not fire it for date inputs).
    await page.locator('#to-date').dispatchEvent('change');

    await expect(page.locator('.range-btn.active')).toHaveCount(0);
    // Rows within [2025-10-08, 2026-01-08]: 2025-10-08, 2025-11-11, 2025-12-08, 2026-01-08.
    expect(await pointCount(page)).toBe(4);
  });

  test('a custom range with no data shows a "No data in this range" message', async ({
    page,
  }) => {
    await uploadAndWaitForChart(page);

    await page.fill('#from-date', '2030-01-01');
    await page.fill('#to-date', '2030-02-01');
    await page.locator('#to-date').dispatchEvent('change');

    await expect(page.locator('#employees-chart')).toBeHidden();
    await expect(page.getByText('No data in this range.')).toBeVisible();
  });

  test('the range selector and chart are disabled again after resetting via a failed upload', async ({
    page,
  }) => {
    await uploadAndWaitForChart(page);
    await expect(page.locator('.range-btn').first()).toBeEnabled();

    await page.setInputFiles('#file-input', fixture('empty.csv'));

    await expect(page.locator('#upload-error')).toHaveText('The uploaded file is empty.');
    await expect(page.locator('.range-btn').first()).toBeDisabled();
    await expect(page.locator('#from-date')).toBeDisabled();
    await expect(page.locator('#employees-chart')).toBeHidden();
  });
});
