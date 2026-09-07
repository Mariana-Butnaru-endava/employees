import fs from 'node:fs';
import { expect } from '@playwright/test';
import csvParser from 'csv-parser';
import { format, subDays } from 'date-fns';
import { test } from '../../src/fixtures/ui-fixtures.ts';
import { getFixturePath } from '../helpers/path-helper.ts';

/**
 * Reads the first column of a CSV fixture as date strings and returns
 * the sorted list plus the first and last values.
 *
 * @param fileName - Name of the fixture file in the fixtures directory.
 * @returns Object containing all sorted dates, the earliest date, and the latest date.
 */
async function loadFixtureDateBounds(fileName: string): Promise<{
  dates: string[];
  firstDate: string;
  lastDate: string;
}> {
  const filePath = getFixturePath(fileName);
  const dates: string[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: Record<string, string>) => {
        const firstValue = Object.values(row)[0];
        if (firstValue) {
          dates.push(firstValue.trim());
        }
      })
      .on('end', () => {
        dates.sort();
        resolve({ dates, firstDate: dates[0], lastDate: dates[dates.length - 1] });
      })
      .on('error', reject);
  });
}

/**
 * Counts how many dates fall within the inclusive range [from, to].
 *
 * @param dates - Sorted date strings in yyyy-MM-dd format.
 * @param from - Range start in yyyy-MM-dd format.
 * @param to - Range end in yyyy-MM-dd format.
 * @returns The number of dates inside the range.
 */
function countDatesInRange(dates: string[], from: string, to: string): number {
  return dates.filter((date) => date >= from && date <= to).length;
}

test.describe('Time range selector', () => {
  test('"All Time" is selected by default and shows every row', async ({ homePage }) => {
    const { dates, firstDate, lastDate } = await loadFixtureDateBounds('list2.csv');

    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));

    await expect(homePage.rangeSelector.rangeButton('all')).toHaveClass(/active/);
    expect(await homePage.chart.getPointCount()).toBe(dates.length);
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue(firstDate);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue(lastDate);
  });

  test('"1 Month" filters to the last 30 days from the latest date', async ({ homePage }) => {
    const { dates, lastDate } = await loadFixtureDateBounds('list2.csv');
    const latestDate = new Date(lastDate);
    const expectedTo = format(latestDate, 'yyyy-MM-dd');
    const expectedFrom = format(subDays(latestDate, 30), 'yyyy-MM-dd');

    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));

    await homePage.rangeSelector.selectRange('1m');

    await expect(homePage.rangeSelector.rangeButton('1m')).toHaveClass(/active/);
    await expect(homePage.rangeSelector.rangeButton('all')).not.toHaveClass(/active/);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue(expectedTo);
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue(expectedFrom);
    expect(await homePage.chart.getPointCount()).toBe(
      countDatesInRange(dates, expectedFrom, expectedTo)
    );
  });

  test('"1 Year" filters to the last 365 days from the latest date', async ({ homePage }) => {
    const { dates, lastDate } = await loadFixtureDateBounds('list2.csv');
    const latestDate = new Date(lastDate);
    const expectedTo = format(latestDate, 'yyyy-MM-dd');
    const expectedFrom = format(subDays(latestDate, 365), 'yyyy-MM-dd');

    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));

    await homePage.rangeSelector.selectRange('1y');

    await expect(homePage.rangeSelector.rangeButton('1y')).toHaveClass(/active/);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue(expectedTo);
    await expect(homePage.rangeSelector.fromDateInput).toHaveValue(expectedFrom);
    expect(await homePage.chart.getPointCount()).toBe(
      countDatesInRange(dates, expectedFrom, expectedTo)
    );
  });

  test('changing the custom date inputs filters the chart and clears the active preset', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));

    await homePage.rangeSelector.setCustomDateRange('2025-10-08', '2026-01-08');

    await expect(homePage.rangeSelector.activeRangeButton()).toHaveCount(0);
    // Rows within [2025-10-08, 2026-01-08]: 2025-10-08, 2025-11-11, 2025-12-08, 2026-01-08.
    expect(await homePage.chart.getPointCount()).toBe(4);
  });

  test('a custom range with no data shows a "No data in this range" message', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));

    await homePage.rangeSelector.setCustomDateRange('2030-01-01', '2030-02-01');

    await expect(homePage.chart.chartCanvas).toBeHidden();
    await expect(homePage.chart.chartMessage).toHaveText('No data in this range.');
  });

  test('the range selector and chart are disabled again after resetting via a failed upload', async ({
    homePage,
  }) => {
    await homePage.uploadAndWaitForChart(getFixturePath('list2.csv'));
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeEnabled();

    await homePage.upload.uploadFile(getFixturePath('empty.csv'));

    await expect(homePage.upload.uploadError).toHaveText('The uploaded file is empty.');
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeDisabled();
    await expect(homePage.rangeSelector.fromDateInput).toBeDisabled();
    await expect(homePage.chart.chartCanvas).toBeHidden();
  });
});
