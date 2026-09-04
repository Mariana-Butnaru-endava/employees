import { APIResponse } from '@playwright/test';

/**
 * Parses a JSON response body and asserts that the response status is 200.
 *
 * @param response - The Playwright API response to parse.
 * @returns The parsed JSON body.
 */
export async function expectOkJson(response: APIResponse): Promise<unknown> {
  if (response.status() !== 200) {
    const body = await response.text();
    console.log('Response: ', body);
    throw new Error(`Expected status 200 but got ${response.status()}: ${body}`);
  }
  return response.json();
}

/**
 * Asserts that a response is a 400 Bad Request with the expected error message.
 *
 * @param response - The Playwright API response to assert on.
 * @param expectedMessage - The exact error message expected in the JSON body.
 */
export async function expectBadRequest(response: APIResponse, expectedMessage: string): Promise<void> {
  await expectStatus(response, 400);
  const body = await response.json();
  console.log('Response: ', body);
  if (!body || typeof body !== 'object' || (body as { error?: string }).error !== expectedMessage) {
    throw new Error(`Expected error "${expectedMessage}" but got ${JSON.stringify(body)}`);
  }
}

/**
 * Asserts that a response has the expected HTTP status code.
 *
 * @param response - The Playwright API response to assert on.
 * @param status - The expected status code.
 */
export async function expectStatus(response: APIResponse, status: number): Promise<void> {
  if (response.status() !== status) {
    const body = await response.text();
    throw new Error(`Expected status ${status} but got ${response.status()}: ${body}`);
  }
}
