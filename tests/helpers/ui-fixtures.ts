import { test as base } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage.js';
import { UploadPage } from '../../src/pages/UploadPage.js';
import { RangeSelectorPage } from '../../src/pages/RangeSelectorPage.js';
import { ChartPage } from '../../src/pages/ChartPage.js';

/**
 * Page fixtures exposed to UI specs.
 */
export type UiPages = {
  /** Page object for the home page and its composed sections. */
  homePage: HomePage;
  /** Page object for the upload controls. */
  uploadPage: UploadPage;
  /** Page object for the range selector controls. */
  rangeSelectorPage: RangeSelectorPage;
  /** Page object for the chart area. */
  chartPage: ChartPage;
};

/**
 * Playwright test fixtures that provide ready-to-use page objects for UI tests.
 *
 * Import this `test` object in UI specs instead of `@playwright/test`
 * to access `homePage`, `uploadPage`, `rangeSelectorPage`, and `chartPage`.
 */
export const test = base.extend<UiPages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  uploadPage: async ({ page }, use) => {
    await use(new UploadPage(page));
  },
  rangeSelectorPage: async ({ page }, use) => {
    await use(new RangeSelectorPage(page));
  },
  chartPage: async ({ page }, use) => {
    await use(new ChartPage(page));
  },
});
