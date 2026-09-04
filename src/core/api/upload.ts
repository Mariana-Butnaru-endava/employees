import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.ts';
import { ApiClient } from './apiClient.ts';

/**
 * Payload describing a file to upload as multipart/form-data.
 */
export type UploadFilePayload = {
  /** Raw file bytes. */
  buffer: Buffer;
  /** Name to associate with the uploaded file. */
  name: string;
  /** MIME type. Defaults to text/csv when omitted. */
  mimeType?: string;
};

/**
 * Service wrapper for the backend CSV upload endpoint.
 */
export class UploadService {
  /**
   * Creates an UploadService instance.
   *
   * @param client - The ApiClient used to make requests.
   */
  constructor(private readonly client: ApiClient) {}

  /**
   * Uploads a CSV file from disk to POST /api/upload.
   *
   * @param filePath - Absolute path to the file to upload.
   * @param fileName - Optional override for the file name.
   * @param mimeType - MIME type to attach. Defaults to text/csv.
   * @returns The API response from the upload endpoint.
   */
  async uploadCsvFile(filePath: string, fileName?: string, mimeType: string = 'text/csv') {
    const resolvedFileName = fileName ?? path.basename(filePath);
    const buffer = fs.readFileSync(filePath);
    return this.upload({ buffer, name: resolvedFileName, mimeType });
  }

  /**
   * Uploads raw CSV content from memory to POST /api/upload.
   *
   * @param content - Raw CSV content.
   * @param fileName - Name to associate with the uploaded file.
   * @returns The API response from the upload endpoint.
   */
  async uploadCsvContent(content: string, fileName: string) {
    return this.upload({ buffer: Buffer.from(content, 'utf8'), name: fileName });
  }

  /**
   * Uploads an arbitrary file payload to POST /api/upload.
   *
   * @param file - The file payload to upload.
   * @returns The API response from the upload endpoint.
   */
  async upload(file: UploadFilePayload) {
    return this.client.post(env.uploadEndpoint, {
      multipart: {
        file: {
          name: file.name,
          mimeType: file.mimeType ?? 'text/csv',
          buffer: file.buffer,
        },
      },
    });
  }
}
