import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { UploadPage } from './UploadPage.js';
import { RangeSelectorPage } from './RangeSelectorPage.js';
import { ChartPage } from './ChartPage.js';

/**
 * Page object for the home page of the application.
 *
 * This class composes the section-specific page objects (upload, range selector, chart)
 * and exposes a single entry point for navigation.
 */
export class HomePage extends BasePage {
  /** Page object for the upload controls. */
  readonly upload: UploadPage;
  /** Page object for the range selector controls. */
  readonly rangeSelector: RangeSelectorPage;
  /** Page object for the chart area. */
  readonly chart: ChartPage;

  /**
   * Creates a new HomePage instance.
   *
   * @param page - The Playwright page instance.
   */
  constructor(page: Page) {
    super(page);
    this.upload = new UploadPage(page);
    this.rangeSelector = new RangeSelectorPage(page);
    this.chart = new ChartPage(page);
  }

  /**
   * Navigates to the home page (`/`).
   */
  async goto(): Promise<void> {
    await this.navigateTo('/');
  }

  /**
   * Uploads a CSV file and waits for the chart to be rendered.
   *
   * @param filePath - The absolute path to the CSV file.
   */
  async uploadAndWaitForChart(filePath: string): Promise<void> {
    await this.goto();
    await this.upload.uploadFile(filePath);
    await this.chart.waitForChart();
  }
}
