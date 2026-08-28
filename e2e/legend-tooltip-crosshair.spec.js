import { test, expect } from '@playwright/test';
import { fixture } from './fixtures.js';

// Chart.js renders the legend, tooltip and crosshair onto a <canvas>, so
// there are no DOM nodes to click/assert on directly. These tests read the
// live Chart.js instance (exposed as window.__employeesChart for e2e use)
// to compute real pixel coordinates for mouse interactions, and to assert
// on the resulting chart/tooltip/legend state.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#file-input', fixture('list2.csv'));
  await page.waitForFunction(() => window.__employeesChart);
});

test('the chart shows a top legend with all series names', async ({ page }) => {
  const legendLabels = await page.evaluate(() =>
    window.__employeesChart.legend.legendItems.map((item) => item.text)
  );
  console.log('Chart labels: ', legendLabels);

  expect(legendLabels).toEqual([
    'Endava Bucuresti',
    'Endava Romania',
    'Endava CE Region',
    'All Company',
  ]);
  const position = await page.evaluate(() => window.__employeesChart.options.plugins.legend.position);
  console.log('position of labels: ', position);
  expect(position).toBe('top');
});

test('clicking a legend item toggles the visibility of that line', async ({ page }) => {
  const allCompanyIndex = 3;
  const canvasBox = await page.locator('#employees-chart').boundingBox();

  const hitbox = await page.evaluate((index) => {
    const box = window.__employeesChart.legend.legendHitBoxes[index];
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }, allCompanyIndex);

  expect(await page.evaluate((i) => window.__employeesChart.isDatasetVisible(i), allCompanyIndex)).toBe(
    true
  );

  await page.mouse.click(canvasBox.x + hitbox.x, canvasBox.y + hitbox.y);

  await expect
    .poll(() => page.evaluate((i) => window.__employeesChart.isDatasetVisible(i), allCompanyIndex))
    .toBe(false);

  // Clicking again re-shows the line.
  await page.mouse.click(canvasBox.x + hitbox.x, canvasBox.y + hitbox.y);

  await expect
    .poll(() => page.evaluate((i) => window.__employeesChart.isDatasetVisible(i), allCompanyIndex))
    .toBe(true);
});

test('the chart title and axis titles match the spec', async ({ page }) => {
  const { title, xTitle, yTitle } = await page.evaluate(() => {
    const chart = window.__employeesChart;
    return {
      title: chart.options.plugins.title.text,
      xTitle: chart.options.scales.x.title.text,
      yTitle: chart.options.scales.y.title.text,
    };
  });

  expect(title).toBe('Employee Count Over Time');
  expect(xTitle).toBe('Date');
  expect(yTitle).toBe('Number of Employees');
});

test('hovering over the chart draws a crosshair and shows a tooltip for every series', async ({
  page,
}) => {
  await page.locator('#employees-chart').scrollIntoViewIfNeeded();
  const canvasBox = await page.locator('#employees-chart').boundingBox();

  // Hover over the pixel position of the 6th data point (an arbitrary,
  // non-edge point) using the real rendered point coordinates.
  const point = await page.evaluate(() => {
    const chart = window.__employeesChart;
    const meta = chart.getDatasetMeta(0);
    const el = meta.data[5];
    return { x: el.x, y: el.y };
  });

  await page.mouse.move(canvasBox.x + point.x, canvasBox.y + point.y, { steps: 5 });

  await expect.poll(() => page.evaluate(() => window.__employeesChart.crosshair?.enabled)).toBe(true);

  await expect.poll(() => page.evaluate(() => window.__employeesChart.tooltip.opacity)).toBeGreaterThan(0);

  const { dataPointCount, title, labels } = await page.evaluate(() => {
    const tooltip = window.__employeesChart.tooltip;
    return {
      dataPointCount: tooltip.dataPoints.length,
      title: tooltip.title,
      labels: tooltip.body.map((line) => line.lines[0]),
    };
  });

  // All 4 series should be represented in the tooltip for the hovered date.
  expect(dataPointCount).toBe(4);
  expect(title.join(' ')).toMatch(/\d{4}/); // contains the full year, i.e. a full date
  expect(labels.some((line) => line.startsWith('Endava Bucuresti:'))).toBe(true);
  expect(labels.some((line) => line.startsWith('All Company:'))).toBe(true);
});

test('moving the mouse away from the chart hides the crosshair', async ({ page }) => {
  await page.locator('#employees-chart').scrollIntoViewIfNeeded();
  const canvasBox = await page.locator('#employees-chart').boundingBox();

  const point = await page.evaluate(() => {
    const chart = window.__employeesChart;
    const el = chart.getDatasetMeta(0).data[5];
    return { x: el.x, y: el.y };
  });

  await page.mouse.move(canvasBox.x + point.x, canvasBox.y + point.y, { steps: 5 });
  await expect.poll(() => page.evaluate(() => window.__employeesChart.crosshair?.enabled)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__employeesChart.tooltip.opacity)).toBeGreaterThan(0);

  await page.mouse.move(canvasBox.x - 50, canvasBox.y - 50, { steps: 5 });

  await expect.poll(() => page.evaluate(() => window.__employeesChart.crosshair?.enabled)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__employeesChart.tooltip.opacity)).toBe(0);
});
