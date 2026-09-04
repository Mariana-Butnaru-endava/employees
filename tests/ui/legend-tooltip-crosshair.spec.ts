import { expect } from '@playwright/test';
import { test } from '../helpers/ui-fixtures.ts';
import { fixture } from '../helpers/fixtures.ts';

declare global {
  interface Window {
    __employeesChart: any;
  }
}

// Chart.js renders the legend, tooltip and crosshair onto a <canvas>, so
// there are no DOM nodes to click/assert on directly. These tests read the
// live Chart.js instance (exposed as window.__employeesChart for ui test use)
// to compute real pixel coordinates for mouse interactions, and to assert
// on the resulting chart/tooltip/legend state.

test.beforeEach(async ({ homePage }) => {
  await homePage.goto();
  await homePage.upload.uploadFile(fixture('list2.csv'));
  await homePage.chart.waitForChart();
});

test('the chart shows a top legend with all series names', async ({ homePage }) => {
  const legendLabels = await homePage.chart.getLegendLabels();
  console.log('Chart labels: ', legendLabels);

  expect(legendLabels).toEqual([
    'Endava Bucuresti',
    'Endava Romania',
    'Endava CE Region',
    'All Company',
  ]);
  const position = await homePage.chart.getLegendPosition();
  console.log('position of labels: ', position);
  expect(position).toBe('top');
});

test('clicking a legend item toggles the visibility of that line', async ({ homePage }) => {
  const allCompanyIndex = 3;

  expect(await homePage.chart.isDatasetVisible(allCompanyIndex)).toBe(true);

  await homePage.chart.clickLegendItem(allCompanyIndex);

  await expect
    .poll(() => homePage.chart.isDatasetVisible(allCompanyIndex))
    .toBe(false);

  // Clicking again re-shows the line.
  await homePage.chart.clickLegendItem(allCompanyIndex);

  await expect
    .poll(() => homePage.chart.isDatasetVisible(allCompanyIndex))
    .toBe(true);
});

test('the chart title and axis titles match the spec', async ({ homePage }) => {
  const { title, xTitle, yTitle } = await homePage.chart.getTitles();

  expect(title).toBe('Employee Count Over Time');
  expect(xTitle).toBe('Date');
  expect(yTitle).toBe('Number of Employees');
});

test('hovering over the chart draws a crosshair and shows a tooltip for every series', async ({
  homePage,
}) => {
  await homePage.chart.scrollChartIntoView();

  // Hover over the pixel position of the 6th data point (an arbitrary,
  // non-edge point) using the real rendered point coordinates.
  await homePage.chart.hoverDataPoint(0, 5);

  await expect.poll(() => homePage.chart.isCrosshairEnabled()).toBe(true);

  await expect.poll(() => homePage.chart.getTooltipOpacity()).toBeGreaterThan(0);

  const { dataPointCount, title, labels } = await homePage.chart.getTooltipInfo();

  // All 4 series should be represented in the tooltip for the hovered date.
  expect(dataPointCount).toBe(4);
  expect(title.join(' ')).toMatch(/\d{4}/); // contains the full year, i.e. a full date
  expect(labels.some((line: string) => line.startsWith('Endava Bucuresti:'))).toBe(true);
  expect(labels.some((line: string) => line.startsWith('All Company:'))).toBe(true);
});

test('moving the mouse away from the chart hides the crosshair', async ({ homePage }) => {
  await homePage.chart.scrollChartIntoView();

  await homePage.chart.hoverDataPoint(0, 5);
  await expect.poll(() => homePage.chart.isCrosshairEnabled()).toBe(true);
  await expect.poll(() => homePage.chart.getTooltipOpacity()).toBeGreaterThan(0);

  await homePage.chart.moveMouseRelativeToCanvas({ x: -50, y: -50 });

  await expect.poll(() => homePage.chart.isCrosshairEnabled()).toBe(false);
  await expect.poll(() => homePage.chart.getTooltipOpacity()).toBe(0);
});
