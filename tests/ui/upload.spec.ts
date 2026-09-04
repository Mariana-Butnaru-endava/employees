import { expect } from '@playwright/test';
import { test } from '../helpers/ui-fixtures.ts';
import { fixture } from '../helpers/fixtures.ts';

test.describe('CSV upload and chart rendering', () => {
  test('the chart area is disabled until a file is uploaded', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.upload.uploadStatus).toHaveText('No file selected');
    await expect(homePage.chart.chartCanvas).toBeHidden();
    await expect(homePage.chart.chartMessage).toHaveText('Upload a CSV file to see the chart.');
    // Fieldset itself has no native "disabled" a11y state; its controls do.
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeDisabled();
    await expect(homePage.rangeSelector.fromDateInput).toBeDisabled();
  });

  test('uploading a valid CSV renders a line for every series', async ({ homePage }) => {
    const fileName = 'list2.csv';
    await homePage.goto();

    // Start the upload from the visible Upload CSV control (a label styled as a
    // button) and pick list2.csv through the browser file chooser.
    await homePage.upload.uploadFileViaButton(fixture(fileName));

    await expect(homePage.upload.uploadStatus).toContainText(`Uploaded: ${fileName} `);
    await expect(homePage.upload.uploadError).toBeHidden();
    await expect(homePage.chart.chartCanvas).toBeVisible();
    await expect(homePage.rangeSelector.rangeButtons.first()).toBeEnabled();
    await expect(homePage.rangeSelector.fromDateInput).toBeEnabled();

    await homePage.chart.waitForChart();

    const { datasetCount, labels, pointCounts } = await homePage.chart.getDatasetSummary();

    expect(datasetCount).toBe(4);
    expect(labels).toEqual([
      'Endava Bucuresti',
      'Endava Romania',
      'Endava CE Region',
      'All Company',
    ]);
    expect(pointCounts).toEqual([18, 18, 18, 18]);

    // Each series must use a distinct color.
    const colors = await homePage.chart.getBorderColors();
    expect(new Set(colors).size).toBe(colors.length);
  });

  test('drag-and-drop uploads a CSV file', async ({ homePage }) => {
    await homePage.goto();

    // Native OS drag-and-drop can't be simulated directly by Playwright, so
    // we dispatch a synthetic 'drop' DragEvent carrying a real in-page File.
    const csv = `observation_date,Endava Bucuresti\n2025-04-08,878\n2025-05-08,866\n`;

    await homePage.upload.dragAndDropCsv(csv, 'dropped.csv');

    await expect(homePage.upload.uploadStatus).toHaveText('Uploaded: dropped.csv (2 rows)');
    await expect(homePage.chart.chartCanvas).toBeVisible();
  });
});
