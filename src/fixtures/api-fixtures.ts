import { test as base } from '@playwright/test';
import { env } from '../config/env.ts';
import { ApiClient } from '../core/api/apiClient.ts';
import { HealthService } from '../core/api/health.ts';
import { UploadService } from '../core/api/upload.ts';

/**
 * Base URL of the backend Express server started by the Playwright webServer.
 */
export const API_BASE_URL = env.baseURL;

/**
 * Fixture types exposed by the extended Playwright test object.
 */
export type ApiServices = {
  /** Service for the backend health endpoint. */
  healthService: HealthService;
  /** Service for the backend CSV upload endpoint. */
  uploadService: UploadService;
  /** Internal fixture that clears persisted server-side state after each API test. */
  _apiStateCleanup: void;
};

/**
 * Playwright test fixtures that provide ready-to-use API service instances.
 *
 * Import this `test` object in API specs instead of `@playwright/test`
 * to access `healthService` and `uploadService`.
 */
export const test = base.extend<ApiServices>({
  healthService: async ({ request }, use) => {
    const client = new ApiClient(request, API_BASE_URL);
    await use(new HealthService(client));
  },
  uploadService: async ({ request }, use) => {
    const client = new ApiClient(request, API_BASE_URL);
    await use(new UploadService(client));
  },
  _apiStateCleanup: [async ({ request }, use) => {
    await use();
    await request.delete(`${API_BASE_URL}/api/data`);
  }, { auto: true }],
});
