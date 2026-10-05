import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { log } from '../../tests/helpers/logger.js';

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
    log('info', 'Waiting for the Chart.js instance to be exposed on the window');
    try {
      await this.waitForFunction(() => Boolean(window.__employeesChart));
      log('info', 'Successfully waited for the Chart.js instance to be exposed on the window');
    } catch (error) {
      log('error', `Failed to wait for the Chart.js instance: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the number of data points in the first dataset.
   *
   * @returns The data point count.
   */
  async getPointCount(): Promise<number> {
    log('info', 'Getting the number of data points in the first dataset');
    try {
      const count = await this.evaluate(() => window.__employeesChart.data.datasets[0].data.length);
      log('info', `Successfully got the number of data points in the first dataset: ${count}`);
      return count;
    } catch (error) {
      log('error', `Failed to get the number of data points: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns summary information about all rendered datasets.
   *
   * @returns Dataset count, labels, and point counts per dataset.
   */
  async getDatasetSummary(): Promise<{ datasetCount: number; labels: string[]; pointCounts: number[] }> {
    log('info', 'Getting summary information about all rendered datasets');
    try {
      const summary = await this.evaluate(() => {
        const chart = window.__employeesChart;
        return {
          datasetCount: chart.data.datasets.length,
          labels: chart.data.datasets.map((d: { label: string }) => d.label),
          pointCounts: chart.data.datasets.map((d: { data: unknown[] }) => d.data.length),
        };
      });
      log('info', `Successfully got dataset summary: ${summary.datasetCount} datasets`);
      return summary;
    } catch (error) {
      log('error', `Failed to get dataset summary: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the distinct border colors used by all datasets.
   *
   * @returns An array of border color values.
   */
  async getBorderColors(): Promise<unknown[]> {
    log('info', 'Getting the distinct border colors used by all datasets');
    try {
      const colors = await this.evaluate(() => window.__employeesChart.data.datasets.map((d: { borderColor: unknown }) => d.borderColor));
      log('info', `Successfully got border colors: ${colors.length} colors`);
      return colors;
    } catch (error) {
      log('error', `Failed to get border colors: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the legend item labels.
   *
   * @returns An array of legend label strings.
   */
  async getLegendLabels(): Promise<string[]> {
    log('info', 'Getting the legend item labels');
    try {
      const labels = await this.evaluate(() =>
        window.__employeesChart.legend.legendItems.map((item: { text: string }) => item.text)
      );
      log('info', `Successfully got legend labels: ${labels.join(', ')}`);
      return labels;
    } catch (error) {
      log('error', `Failed to get legend labels: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the configured legend position.
   *
   * @returns The legend position string.
   */
  async getLegendPosition(): Promise<string> {
    log('info', 'Getting the configured legend position');
    try {
      const position = await this.evaluate(() => window.__employeesChart.options.plugins.legend.position);
      log('info', `Successfully got legend position: ${position}`);
      return position;
    } catch (error) {
      log('error', `Failed to get legend position: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the chart title and axis titles.
   *
   * @returns The title and axis title strings.
   */
  async getTitles(): Promise<{ title: string; xTitle: string; yTitle: string }> {
    log('info', 'Getting the chart title and axis titles');
    try {
      const titles = await this.evaluate(() => {
        const chart = window.__employeesChart;
        return {
          title: chart.options.plugins.title.text,
          xTitle: chart.options.scales.x.title.text,
          yTitle: chart.options.scales.y.title.text,
        };
      });
      log('info', `Successfully got chart titles: "${titles.title}"`);
      return titles;
    } catch (error) {
      log('error', `Failed to get chart titles: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the dataset at the given index is visible.
   *
   * @param index - The dataset index.
   * @returns True if visible, false otherwise.
   */
  async isDatasetVisible(index: number): Promise<boolean> {
    log('info', `Checking whether dataset at index ${index} is visible`);
    try {
      const visible = await this.evaluate((i) => window.__employeesChart.isDatasetVisible(i), index);
      log('info', `Dataset visibility check completed for index ${index} (visible: ${visible})`);
      return visible;
    } catch (error) {
      log('error', `Failed to check dataset visibility at index ${index}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Clicks the legend item at the given index.
   *
   * @param index - The legend item index.
   */
  async clickLegendItem(index: number): Promise<void> {
    log('info', `Clicking legend item at index ${index}`);
    try {
      const canvasBox = await this.chartCanvas.boundingBox();
      if (!canvasBox) {
        throw new Error('Chart canvas bounding box is not available');
      }

      const hitbox = await this.evaluate((i) => {
        const box = window.__employeesChart.legend.legendHitBoxes[i];
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }, index);

      await this.page.mouse.click(canvasBox.x + hitbox.x, canvasBox.y + hitbox.y);
      log('info', `Successfully clicked legend item at index ${index}`);
    } catch (error) {
      log('error', `Failed to click legend item at index ${index}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Scrolls the chart canvas into view if needed.
   */
  async scrollChartIntoView(): Promise<void> {
    log('info', 'Scrolling the chart canvas into view');
    try {
      await this.chartCanvas.scrollIntoViewIfNeeded();
      log('info', 'Successfully scrolled the chart canvas into view');
    } catch (error) {
      log('error', `Failed to scroll chart canvas into view: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the bounding box of the chart canvas.
   *
   * @returns The canvas bounding box, or null if not available.
   */
  async getCanvasBoundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    log('info', 'Getting the bounding box of the chart canvas');
    try {
      const box = await this.chartCanvas.boundingBox();
      log('info', `Successfully got the bounding box of the chart canvas: ${JSON.stringify(box)}`);
      return box;
    } catch (error) {
      log('error', `Failed to get the bounding box of the chart canvas: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the rendered pixel coordinates of a data point.
   *
   * @param datasetIndex - The dataset index.
   * @param dataIndex - The data point index within the dataset.
   * @returns The pixel coordinates of the point.
   */
  async getDataPointCoordinates(datasetIndex: number, dataIndex: number): Promise<Point> {
    log('info', `Getting pixel coordinates of data point at dataset ${datasetIndex}, index ${dataIndex}`);
    try {
      const coordinates = await this.evaluate(
        ({ datasetIndex: ds, dataIndex: dp }) => {
          const meta = window.__employeesChart.getDatasetMeta(ds);
          const el = meta.data[dp];
          return { x: el.x, y: el.y };
        },
        { datasetIndex, dataIndex }
      );
      log('info', `Successfully got pixel coordinates of data point: ${JSON.stringify(coordinates)}`);
      return coordinates;
    } catch (error) {
      log('error', `Failed to get pixel coordinates of data point: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Hovers the mouse over a specific data point on the chart.
   *
   * @param datasetIndex - The dataset index.
   * @param dataIndex - The data point index within the dataset.
   */
  async hoverDataPoint(datasetIndex: number, dataIndex: number): Promise<void> {
    log('info', `Hovering over data point at dataset ${datasetIndex}, index ${dataIndex}`);
    try {
      const box = await this.getCanvasBoundingBox();
      if (!box) {
        throw new Error('Chart canvas bounding box is not available');
      }
      const point = await this.getDataPointCoordinates(datasetIndex, dataIndex);
      await this.page.mouse.move(box.x + point.x, box.y + point.y, { steps: 5 });
      log('info', `Successfully hovered over data point at dataset ${datasetIndex}, index ${dataIndex}`);
    } catch (error) {
      log('error', `Failed to hover over data point at dataset ${datasetIndex}, index ${dataIndex}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Moves the mouse to the given pixel coordinates relative to the canvas.
   *
   * @param point - The relative pixel coordinates.
   */
  async moveMouseRelativeToCanvas(point: Point): Promise<void> {
    log('info', `Moving mouse relative to canvas: ${JSON.stringify(point)}`);
    try {
      const box = await this.getCanvasBoundingBox();
      if (!box) {
        throw new Error('Chart canvas bounding box is not available');
      }
      await this.page.mouse.move(box.x + point.x, box.y + point.y, { steps: 5 });
      log('info', `Successfully moved mouse relative to canvas: ${JSON.stringify(point)}`);
    } catch (error) {
      log('error', `Failed to move mouse relative to canvas: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns whether the crosshair is currently enabled.
   *
   * @returns True if enabled, false otherwise.
   */
  async isCrosshairEnabled(): Promise<boolean> {
    log('info', 'Checking whether the crosshair is currently enabled');
    try {
      const enabled = await this.evaluate(() => Boolean(window.__employeesChart.crosshair?.enabled));
      log('info', `Crosshair enabled check completed (enabled: ${enabled})`);
      return enabled;
    } catch (error) {
      log('error', `Failed to check whether crosshair is enabled: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the current tooltip opacity.
   *
   * @returns The tooltip opacity number.
   */
  async getTooltipOpacity(): Promise<number> {
    log('info', 'Getting the current tooltip opacity');
    try {
      const opacity = await this.evaluate(() => window.__employeesChart.tooltip.opacity);
      log('info', `Successfully got tooltip opacity: ${opacity}`);
      return opacity;
    } catch (error) {
      log('error', `Failed to get tooltip opacity: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns information about the currently displayed tooltip.
   *
   * @returns The tooltip info object.
   */
  async getTooltipInfo(): Promise<TooltipInfo> {
    log('info', 'Getting information about the currently displayed tooltip');
    try {
      const info = await this.evaluate(() => {
        const tooltip = window.__employeesChart.tooltip;
        return {
          dataPointCount: tooltip.dataPoints.length,
          title: tooltip.title,
          labels: tooltip.body.map((line: { lines: string[] }) => line.lines[0]),
        };
      });
      log('info', `Successfully got tooltip info: ${info.dataPointCount} data point(s)`);
      return info;
    } catch (error) {
      log('error', `Failed to get tooltip info: ${this.formatError(error)}`);
      throw error;
    }
  }
}
