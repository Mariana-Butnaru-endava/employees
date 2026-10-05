import { expect } from '@playwright/test';
import { env } from '../../../config/env.ts';
import { test, API_BASE_URL } from '../../src/fixtures/api-fixtures.ts';
import { expectOkJson, expectStatus } from '../../src/core/utils/assertions.ts';
import { getFixturePath } from '../helpers/path-helper.ts';

/**
 * Shape of a successful upload response. Kept here so assertions stay typed.
 */
type UploadResponse = {
  dateColumn: string;
  series: string[];
  data: Record<string, number | string>[];
};

test.describe('DELETE /api/data', () => {
  test('returns 204 after a successful upload', async ({ uploadService, dataService }) => {
    const uploadResponse = await uploadService.uploadCsvFile(getFixturePath('list2.csv'));
    await expectOkJson(uploadResponse);

    const response = await dataService.clearDataset();
    await expectStatus(response, 204);
    expect((await response.body()).length).toBe(0);
  });

  test('removes the in-memory dataset so a subsequent GET returns 404', async ({
    uploadService,
    dataService,
  }) => {
    const uploadResponse = await uploadService.uploadCsvFile(getFixturePath('list2.csv'));
    const body = (await expectOkJson(uploadResponse)) as UploadResponse;
    console.log('columns from response: ', body.dateColumn, ' series:', body.series);

    await dataService.clearDataset();

    const getResponse = await dataService.getDataset();
    await expectStatus(getResponse, 404);
    const getBody = await getResponse.json();
    expect(getBody).toEqual({ error: 'No uploaded dataset available.' });
  });

  test('is idempotent and returns 204 when no dataset exists', async ({ dataService }) => {
    const firstResponse = await dataService.clearDataset();
    await expectStatus(firstResponse, 204);

    const secondResponse = await dataService.clearDataset();
    await expectStatus(secondResponse, 204);
  });

  test('GET /api/data returns 404 when no dataset has been uploaded', async ({ dataService }) => {
    const response = await dataService.getDataset();
    await expectStatus(response, 404);
    const body = await response.json();
    expect(body).toEqual({ error: 'No uploaded dataset available.' });
  });

  test('POST /api/data is not allowed and returns 404', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}${env.dataEndpoint}`);
    await expectStatus(response, 404);
  });

  test('PUT /api/data is not allowed and returns 404', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}${env.dataEndpoint}`);
    await expectStatus(response, 404);
  });
});
