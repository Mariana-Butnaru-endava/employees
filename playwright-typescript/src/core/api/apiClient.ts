import { APIRequestContext } from '@playwright/test';

/**
 * Low-level HTTP client that wraps a Playwright APIRequestContext.
 *
 * All request paths are resolved against the configured base URL.
 */
export class ApiClient {
  /**
   * Creates an ApiClient instance.
   *
   * @param context - The Playwright API request context used to perform HTTP calls.
   * @param baseURL - The base URL prepended to every request path.
   */
  constructor(
    public context: APIRequestContext,
    private readonly baseURL: string,
  ) {}

  /**
   * Sends a GET request to the given path.
   *
   * @param path - The API path relative to the base URL.
   * @returns The API response.
   */
  async get(path: string) {
    return this.context.get(`${this.baseURL}${path}`);
  }

  /**
   * Sends a POST request to the given path.
   *
   * @param path - The API path relative to the base URL.
   * @param options - Optional Playwright request options.
   * @returns The API response.
   */
  async post(path: string, options?: Parameters<APIRequestContext['post']>[1]) {
    return this.context.post(`${this.baseURL}${path}`, options);
  }
}
