import { rm } from 'node:fs/promises';

/**
 * Removes results from previous Allure runs before Playwright starts its workers.
 */
export default async function globalSetup(): Promise<void> {
  await rm('allure-results', { recursive: true, force: true });
}
