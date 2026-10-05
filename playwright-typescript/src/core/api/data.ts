import { env } from '../../../../config/env.ts';
import { ApiClient } from './apiClient.ts';

/**
 * Service wrapper for the backend dataset endpoints.
 */
export class DataService {
  /**
   * Creates a DataService instance.
   *
   * @param client - The ApiClient used to make requests.
   */
  constructor(private readonly client: ApiClient) {}

  /**
   * Fetches the most recently uploaded dataset.
   *
   * @returns The API response from the data endpoint.
   */
  async getDataset() {
    return this.client.get(env.dataEndpoint);
  }

  /**
   * Clears the in-memory uploaded dataset.
   *
   * @returns The API response from the delete operation.
   */
  async clearDataset() {
    return this.client.delete(env.dataEndpoint);
  }
}
