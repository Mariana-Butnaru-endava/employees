import { spawn } from 'node:child_process';

/**
 * Starts a detached Allure report server after all local Playwright workers complete.
 */
export default function globalTeardown(): void {
  if (process.env.CI) {
    return;
  }

  const allure = spawn('allure', ['serve', 'allure-results'], {
    detached: true,
    shell: true,
    stdio: 'ignore',
  });
  allure.unref();
}
