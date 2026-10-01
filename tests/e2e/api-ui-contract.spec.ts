import { expect, mergeTests } from '@playwright/test';
import { test as apiTest } from '../../src/fixtures/api-fixtures.ts';
import { test as uiTest } from '../../src/fixtures/ui-fixtures.ts';
import { expectOkJson } from '../../src/core/utils/assertions.ts';
import { getFixturePath, getFixtureRowDates } from '../helpers/path-helper.ts';

/**
 * Combined test object that provides both API services and UI page fixtures.
 */
const test = mergeTests(apiTest, uiTest);

/**
 * Shape of a successful upload response.
 */
type UploadResponse = {
  /** Name of the first (date) column in the uploaded CSV. */
  dateColumn: string;
  /** Names of the numeric series columns. */
  series: string[];
  /** Parsed data rows from the CSV. */
  data: Record<string, number | string>[];
};

/** Custom date range used to filter the chart in the test below. */
const RANGE_FROM = '2025-09-08';
const RANGE_TO = '2026-09-01';

test.describe('API-UI contract', () => {
  /**
   * Verifies that a file uploaded through the backend API is reflected in
   * the browser UI, that a custom date range filters the chart correctly,
   * and that the backend health endpoint still reports ok.
   */
  test('backend upload is reflected in the chart for a selected range', async ({
    homePage,
    uploadService,
    healthService,
  }) => {
    // 1. Upload list2.csv via the backend CSV upload endpoint.
    const rowDates = getFixtureRowDates('list2.csv');
    const uploadResponse = await uploadService.uploadCsvFile(getFixturePath('list2.csv'));
    const uploadBody = (await expectOkJson(uploadResponse)) as UploadResponse;

    expect(uploadBody.series).toEqual([
      'Endava Bucuresti',
      'Endava Romania',
      'Endava CE Region',
      'All Company',
    ]);
    expect(uploadBody.data).toHaveLength(rowDates.length);

    // 2. Open the home page; the client loads the persisted dataset on page load.
    await homePage.gotoWithExistingDataset();
    await homePage.chart.waitForChart();

    // 3. Select the custom date range from 8 Sep 2025 to 1 Sep 2026.
    await homePage.rangeSelector.setCustomDateRange(RANGE_FROM, RANGE_TO);

    // 4. Verify the chart is displayed and only shows the points within the selected range.
    const expectedPointCount = rowDates.filter(
      (date) => date >= RANGE_FROM && date <= RANGE_TO,
    ).length;
    await expect(homePage.chart.chartCanvas).toBeVisible();
    await expect(homePage.chart.chartMessage).toBeHidden();
    expect(await homePage.chart.getPointCount()).toBe(expectedPointCount);

    await expect(homePage.rangeSelector.fromDateInput).toHaveValue(RANGE_FROM);
    await expect(homePage.rangeSelector.toDateInput).toHaveValue(RANGE_TO);

    // 5. Verify the backend health endpoint reports ok.
    const healthResponse = await healthService.getStatus();
    const healthBody = await expectOkJson(healthResponse);
    expect(healthBody).toEqual({ status: 'ok' });
  });
});
