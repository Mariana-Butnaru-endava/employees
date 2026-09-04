import { expect } from '@playwright/test';
import { test } from '../helpers/ui-fixtures.ts';
import { fixture } from '../helpers/fixtures.ts';

test.describe('Time range selector', () => {
  test('"All Time" is selected by default and shows every row', async ({ homePage }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));

    await expect(homePage.rangeSelector.rangeButton('all')).toHaveClass(/active/);
    expect(await homePage.chart.getPointCount()).toBe(18);
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue('2025-04-08');
    await expect(homePage.rangeSelector.toDateInput).toHaveValue('2026-09-10');
  });

  test('"1 Month" filters to the last 30 days from the latest date', async ({ homePage }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));

    await homePage.rangeSelector.selectRange('1m');

    await expect(homePage.rangeSelector.rangeButton('1m')).toHaveClass(/active/);
    await expect(homePage.rangeSelector.rangeButton('all')).not.toHaveClass(/active/);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue('2026-09-10');
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue('2026-08-11');
    // Only the 2026-09-10 row falls within 30 days of itself in this dataset.
    expect(await homePage.chart.getPointCount()).toBe(1);
  });

  test('"1 Year" filters to the last 365 days from the latest date', async ({ homePage }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));

    await homePage.rangeSelector.selectRange('1y');

    await expect(homePage.rangeSelector.rangeButton('1y')).toHaveClass(/active/);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue('2026-09-10');
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue('2025-09-10');
    expect(await homePage.chart.getPointCount()).toBe(13);
  });

  test('changing the custom date inputs filters the chart and clears the active preset', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));

    await homePage.rangeSelector.setCustomDateRange('2025-10-08', '2026-01-08');

    await expect(homePage.rangeSelector.activeRangeButton()).toHaveCount(0);
    // Rows within [2025-10-08, 2026-01-08]: 2025-10-08, 2025-11-11, 2025-12-08, 2026-01-08.
    expect(await homePage.chart.getPointCount()).toBe(4);
  });

  test('a custom range with no data shows a "No data in this range" message', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));

    await homePage.rangeSelector.setCustomDateRange('2030-01-01', '2030-02-01');

    await expect(homePage.chart.chartCanvas).toBeHidden();
    await expect(homePage.chart.chartMessage).toHaveText('No data in this range.');
  });

  test('the range selector and chart are disabled again after resetting via a failed upload', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(fixture('list2.csv'));
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeEnabled();

    await homePage.upload.uploadFile(fixture('empty.csv'));

    await expect(homePage.upload.uploadError).toHaveText('The uploaded file is empty.');
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeDisabled();
    await expect(homePage.rangeSelector.fromDateInput).toBeDisabled();
    await expect(homePage.chart.chartCanvas).toBeHidden();
  });
});
