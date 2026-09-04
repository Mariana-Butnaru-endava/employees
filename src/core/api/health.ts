import { env } from '../../config/env.ts';
import { ApiClient } from './apiClient.ts';

/**
 * Service wrapper for the backend health endpoint.
 */
export class HealthService {
  /**
   * Creates a HealthService instance.
   *
   * @param client - The ApiClient used to make requests.
   */
  constructor(private readonly client: ApiClient) {}

  /**
   * Calls GET /health and returns the service status response.
   *
   * @returns The API response from the health endpoint.
   */
  async getStatus() {
    return this.client.get(env.healthEndpoint);
  }
}
