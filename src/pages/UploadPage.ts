import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { log } from '../../tests/helpers/logger.js';

/**
 * Page object for the upload controls on the home page.
 */
export class UploadPage extends BasePage {
  /** File input element used for CSV uploads. */
  readonly fileInput: Locator;
  /** Visible "Upload CSV" label that opens the file picker. */
  readonly uploadButton: Locator;
  /** Drag-and-drop zone element. */
  readonly dropzone: Locator;
  /** Element that displays the current upload status. */
  readonly uploadStatus: Locator;
  /** Element that displays upload errors. */
  readonly uploadError: Locator;

  /**
   * Creates a new UploadPage instance.
   *
   * @param page - The Playwright page instance.
   */
  constructor(page: Page) {
    super(page);
    this.fileInput = page.locator('#file-input');
    this.uploadButton = page.locator('label.upload-button');
    this.dropzone = page.locator('#dropzone');
    this.uploadStatus = page.locator('#upload-status');
    this.uploadError = page.locator('#upload-error');
  }

  /**
   * Uploads a CSV file by setting files directly on the hidden file input.
   *
   * @param filePath - The absolute path to the CSV file.
   */
  async uploadFile(filePath: string): Promise<void> {
    log('info', `Uploading CSV file via file input: ${filePath}`);
    try {
      await this.fileInput.setInputFiles(filePath);
      log('info', `Successfully uploaded CSV file via file input: ${filePath}`);
    } catch (error) {
      log('error', `Failed to upload CSV file via file input ${filePath}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Uploads a CSV file by clicking the visible upload button and using the file chooser.
   *
   * @param filePath - The absolute path to the CSV file.
   */
  async uploadFileViaButton(filePath: string): Promise<void> {
    log('info', `Uploading CSV file via visible upload button: ${filePath}`);
    try {
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        this.uploadButton.click(),
      ]);
      await fileChooser.setFiles(filePath);
      log('info', `Successfully uploaded CSV file via visible upload button: ${filePath}`);
    } catch (error) {
      log('error', `Failed to upload CSV file via visible upload button ${filePath}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Simulates dropping a CSV file onto the dropzone.
   *
   * @param csvContent - The raw CSV content to drop.
   * @param fileName - The name to assign to the dropped file.
   */
  async dragAndDropCsv(csvContent: string, fileName: string): Promise<void> {
    log('info', `Dragging and dropping CSV file onto dropzone: ${fileName}`);
    try {
      await this.page.evaluate(
        ({ csv, name }) => {
          const file = new File([csv], name, { type: 'text/csv' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const dropzone = document.getElementById('dropzone');
          const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
          Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
          if (!dropzone) {
            throw new Error('Dropzone not found');
          }
          dropzone.dispatchEvent(dropEvent);
        },
        { csv: csvContent, name: fileName }
      );
      log('info', `Successfully dragged and dropped CSV file onto dropzone: ${fileName}`);
    } catch (error) {
      log('error', `Failed to drag and drop CSV file onto dropzone ${fileName}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the current upload status text.
   *
   * @returns The text content of the status element, or null if absent.
   */
  async getStatusText(): Promise<string | null> {
    log('info', 'Getting upload status text');
    try {
      const text = await this.uploadStatus.textContent();
      log('info', 'Successfully retrieved upload status text');
      return text;
    } catch (error) {
      log('error', `Failed to get upload status text: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the current upload error text.
   *
   * @returns The text content of the error element, or null if absent.
   */
  async getErrorText(): Promise<string | null> {
    log('info', 'Getting upload error text');
    try {
      const text = await this.uploadError.textContent();
      log('info', 'Successfully retrieved upload error text');
      return text;
    } catch (error) {
      log('error', `Failed to get upload error text: ${this.formatError(error)}`);
      throw error;
    }
  }
}
