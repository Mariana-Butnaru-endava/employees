import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Point/pixel coordinate on the chart canvas.
 */
export interface Point {
  /** Horizontal coordinate in pixels. */
  x: number;
  /** Vertical coordinate in pixels. */
  y: number;
}

/**
 * Tooltip information read from the Chart.js instance.
 */
export interface TooltipInfo {
  /** Number of data points shown in the tooltip. */
  dataPointCount: number;
  /** Tooltip title strings. */
  title: string[];
  /** Formatted label lines. */
  labels: string[];
}

/**
 * Page object for the chart area on the home page.
 */
export class ChartPage extends BasePage {
  /** Chart canvas element. */
  readonly chartCanvas: Locator;
  /** Message element shown in place of the chart. */
  readonly chartMessage: Locator;

  /**
   * Creates a new ChartPage instance.
   *
   * @param page - The Playwright page instance.
   */
  constructor(page: Page) {
    super(page);
    this.chartCanvas = page.locator('#employees-chart');
    this.chartMessage = page.locator('#chart-message');
  }

  /**
   * Waits until the Chart.js instance is exposed on the window.
   */
  async waitForChart(): Promise<void> {
    await this.waitForFunction(() => Boolean(window.__employeesChart));
  }

  /**
   * Returns the number of data points in the first dataset.
   *
   * @returns The data point count.
   */
  async getPointCount(): Promise<number> {
    return this.evaluate(() => window.__employeesChart.data.datasets[0].data.length);
  }

  /**
   * Returns summary information about all rendered datasets.
   *
   * @returns Dataset count, labels, and point counts per dataset.
   */
  async getDatasetSummary(): Promise<{ datasetCount: number; labels: string[]; pointCounts: number[] }> {
    return this.evaluate(() => {
      const chart = window.__employeesChart;
      return {
        datasetCount: chart.data.datasets.length,
        labels: chart.data.datasets.map((d: { label: string }) => d.label),
        pointCounts: chart.data.datasets.map((d: { data: unknown[] }) => d.data.length),
      };
    });
  }

  /**
   * Returns the distinct border colors used by all datasets.
   *
   * @returns An array of border color values.
   */
  async getBorderColors(): Promise<unknown[]> {
    return this.evaluate(() => window.__employeesChart.data.datasets.map((d: { borderColor: unknown }) => d.borderColor));
  }

  /**
   * Returns the legend item labels.
   *
   * @returns An array of legend label strings.
   */
  async getLegendLabels(): Promise<string[]> {
    return this.evaluate(() =>
      window.__employeesChart.legend.legendItems.map((item: { text: string }) => item.text)
    );
  }

  /**
   * Returns the configured legend position.
   *
   * @returns The legend position string.
   */
  async getLegendPosition(): Promise<string> {
    return this.evaluate(() => window.__employeesChart.options.plugins.legend.position);
  }

  /**
   * Returns the chart title and axis titles.
   *
   * @returns The title and axis title strings.
   */
  async getTitles(): Promise<{ title: string; xTitle: string; yTitle: string }> {
    return this.evaluate(() => {
      const chart = window.__employeesChart;
      return {
        title: chart.options.plugins.title.text,
        xTitle: chart.options.scales.x.title.text,
        yTitle: chart.options.scales.y.title.text,
      };
    });
  }

  /**
   * Checks whether the dataset at the given index is visible.
   *
   * @param index - The dataset index.
   * @returns True if visible, false otherwise.
   */
  async isDatasetVisible(index: number): Promise<boolean> {
    return this.evaluate((i) => window.__employeesChart.isDatasetVisible(i), index);
  }

  /**
   * Clicks the legend item at the given index.
   *
   * @param index - The legend item index.
   */
  async clickLegendItem(index: number): Promise<void> {
    const canvasBox = await this.chartCanvas.boundingBox();
    if (!canvasBox) {
      throw new Error('Chart canvas bounding box is not available');
    }

    const hitbox = await this.evaluate((i) => {
      const box = window.__employeesChart.legend.legendHitBoxes[i];
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }, index);

    await this.page.mouse.click(canvasBox.x + hitbox.x, canvasBox.y + hitbox.y);
  }

  /**
   * Scrolls the chart canvas into view if needed.
   */
  async scrollChartIntoView(): Promise<void> {
    await this.chartCanvas.scrollIntoViewIfNeeded();
  }

  /**
   * Returns the bounding box of the chart canvas.
   *
   * @returns The canvas bounding box, or null if not available.
   */
  async getCanvasBoundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return this.chartCanvas.boundingBox();
  }

  /**
   * Returns the rendered pixel coordinates of a data point.
   *
   * @param datasetIndex - The dataset index.
   * @param dataIndex - The data point index within the dataset.
   * @returns The pixel coordinates of the point.
   */
  async getDataPointCoordinates(datasetIndex: number, dataIndex: number): Promise<Point> {
    return this.evaluate(
      ({ datasetIndex: ds, dataIndex: dp }) => {
        const meta = window.__employeesChart.getDatasetMeta(ds);
        const el = meta.data[dp];
        return { x: el.x, y: el.y };
      },
      { datasetIndex, dataIndex }
    );
  }

  /**
   * Hovers the mouse over a specific data point on the chart.
   *
   * @param datasetIndex - The dataset index.
   * @param dataIndex - The data point index within the dataset.
   */
  async hoverDataPoint(datasetIndex: number, dataIndex: number): Promise<void> {
    const box = await this.getCanvasBoundingBox();
    if (!box) {
      throw new Error('Chart canvas bounding box is not available');
    }
    const point = await this.getDataPointCoordinates(datasetIndex, dataIndex);
    await this.page.mouse.move(box.x + point.x, box.y + point.y, { steps: 5 });
  }

  /**
   * Moves the mouse to the given pixel coordinates relative to the canvas.
   *
   * @param point - The relative pixel coordinates.
   */
  async moveMouseRelativeToCanvas(point: Point): Promise<void> {
    const box = await this.getCanvasBoundingBox();
    if (!box) {
      throw new Error('Chart canvas bounding box is not available');
    }
    await this.page.mouse.move(box.x + point.x, box.y + point.y, { steps: 5 });
  }

  /**
   * Returns whether the crosshair is currently enabled.
   *
   * @returns True if enabled, false otherwise.
   */
  async isCrosshairEnabled(): Promise<boolean> {
    return this.evaluate(() => Boolean(window.__employeesChart.crosshair?.enabled));
  }

  /**
   * Returns the current tooltip opacity.
   *
   * @returns The tooltip opacity number.
   */
  async getTooltipOpacity(): Promise<number> {
    return this.evaluate(() => window.__employeesChart.tooltip.opacity);
  }

  /**
   * Returns information about the currently displayed tooltip.
   *
   * @returns The tooltip info object.
   */
  async getTooltipInfo(): Promise<TooltipInfo> {
    return this.evaluate(() => {
      const tooltip = window.__employeesChart.tooltip;
      return {
        dataPointCount: tooltip.dataPoints.length,
        title: tooltip.title,
        labels: tooltip.body.map((line: { lines: string[] }) => line.lines[0]),
      };
    });
  }
}
