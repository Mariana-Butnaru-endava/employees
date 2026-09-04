import { expect } from '@playwright/test';
import { env } from '../../src/config/env.ts';
import { test, API_BASE_URL } from '../../src/fixtures/testFixtures.ts';
import { expectOkJson, expectStatus } from '../helpers/api-fixtures.ts';

test.describe('GET /health', () => {
  test.only('returns a 200 OK status payload', async ({ healthService }) => {
    const response = await healthService.getStatus();

    const respBody = await expectOkJson(response);
    expect(respBody).toEqual({ status: 'ok' });
    console.log('Health check response:', respBody);
  });

  test('POST /health is not allowed and returns 404', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}${env.healthEndpoint}`);

    await expectStatus(response, 404);
  });
});
