import { expect, mergeTests } from '@playwright/test';
import { test as apiTest } from '../../src/fixtures/api-fixtures.ts';
import { test as uiTest } from '../../src/fixtures/ui-fixtures.ts';
import { expectOkJson } from '../../src/core/utils/assertions.ts';
import { getFixturePath } from '../helpers/path-helper.ts';

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

/**
 * Number of data points expected for the selected date range.
 *
 * list2.csv contains 18 rows; rows before 2025-09-08 and after 2026-09-01
 * are excluded, leaving 12 rows in the range [2025-09-08, 2026-09-01].
 */
const EXPECTED_POINT_COUNT = 12;

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
    const uploadResponse = await uploadService.uploadCsvFile(getFixturePath('list2.csv'));
    const uploadBody = (await expectOkJson(uploadResponse)) as UploadResponse;

    expect(uploadBody.series).toEqual([
      'Endava Bucuresti',
      'Endava Romania',
      'Endava CE Region',
      'All Company',
    ]);
    expect(uploadBody.data).toHaveLength(18);

    // 2. Open the home page; the client loads the persisted dataset on page load.
    await homePage.goto();
    await homePage.chart.waitForChart();

    // 3. Select the custom date range from 8 Sep 2025 to 1 Sep 2026.
    await homePage.rangeSelector.setCustomDateRange('2025-09-08', '2026-09-01');

    // 4. Verify the chart is displayed and only shows the points within the selected range.
    await expect(homePage.chart.chartCanvas).toBeVisible();
    await expect(homePage.chart.chartMessage).toBeHidden();
    expect(await homePage.chart.getPointCount()).toBe(EXPECTED_POINT_COUNT);

    await expect(homePage.rangeSelector.fromDateInput).toHaveValue('2025-09-08');
    await expect(homePage.rangeSelector.toDateInput).toHaveValue('2026-09-01');

    // 5. Verify the backend health endpoint reports ok.
    const healthResponse = await healthService.getStatus();
    const healthBody = await expectOkJson(healthResponse);
    expect(healthBody).toEqual({ status: 'ok' });
  });
});
