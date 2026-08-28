import { test, expect } from '@playwright/test';
import { fixture } from './fixtures.ts';

test.describe('CSV upload and chart rendering', () => {
  test('the chart area is disabled until a file is uploaded', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('No file selected')).toBeVisible();
    await expect(page.locator('#employees-chart')).toBeHidden();
    await expect(page.getByText('Upload a CSV file to see the chart.')).toBeVisible();
    // Fieldset itself has no native "disabled" a11y state; its controls do.
    await expect(page.locator('.range-btn').first()).toBeDisabled();
    await expect(page.locator('#from-date')).toBeDisabled();
  });

  test('uploading a valid CSV renders a line for every series', async ({ page }) => {
    const fileName = 'list2.csv';
    await page.goto('/');

    await page.setInputFiles('#file-input', fixture(fileName));

    await expect(page.locator('#upload-status')).toContainText(`Uploaded: ${fileName} `);
    await expect(page.locator('#upload-error')).toBeHidden();
    await expect(page.locator('#employees-chart')).toBeVisible();
    await expect(page.locator('.range-btn').first()).toBeEnabled();
    await expect(page.locator('#from-date')).toBeEnabled();

    await page.waitForFunction(() => window.__employeesChart);

    const { datasetCount, labels, pointCounts } = await page.evaluate(() => {
      const chart = window.__employeesChart;
      return {
        datasetCount: chart.data.datasets.length,
        labels: chart.data.datasets.map((d: { label: any; }) => d.label),
        pointCounts: chart.data.datasets.map((d: { data: string | any[]; }) => d.data.length),
      };
    });

    expect(datasetCount).toBe(4);
    expect(labels).toEqual([
      'Endava Bucuresti',
      'Endava Romania',
      'Endava CE Region',
      'All Company',
    ]);
    expect(pointCounts).toEqual([18, 18, 18, 18]);

    // Each series must use a distinct color.
    const colors = await page.evaluate(() =>
      window.__employeesChart.data.datasets.map((d: { borderColor: any; }) => d.borderColor)
    );
    expect(new Set(colors).size).toBe(colors.length);
  });

  test('drag-and-drop uploads a CSV file', async ({ page }) => {
    await page.goto('/');

    // Native OS drag-and-drop can't be simulated directly by Playwright, so
    // we dispatch a synthetic 'drop' DragEvent carrying a real in-page File.
    const csv = `observation_date,Endava Bucuresti\n2025-04-08,878\n2025-05-08,866\n`;

    await page.evaluate((csvContent) => {
      const file = new File([csvContent], 'dropped.csv', { type: 'text/csv' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const dropzone = document.getElementById('dropzone');
      const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
      if (!dropzone) {
        throw new Error('Dropzone not found');
      }
      dropzone.dispatchEvent(dropEvent);
    }, csv);

    await expect(page.locator('#upload-status')).toHaveText('Uploaded: dropped.csv (2 rows)');
    await expect(page.locator('#employees-chart')).toBeVisible();
  });
});
