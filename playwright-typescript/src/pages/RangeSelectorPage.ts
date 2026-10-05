import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { log } from '../../tests/helpers/logger.js';

/** Supported preset time ranges. */
export type RangePreset = '1m' | '1y' | 'all';

/**
 * Page object for the time range selector controls on the home page.
 */
export class RangeSelectorPage extends BasePage {
  /** Fieldset wrapping the range selector controls. */
  readonly rangeFieldset: Locator;
  /** All range preset buttons. */
  readonly rangeButtons: Locator;
  /** From date input. */
  readonly fromDateInput: Locator;
  /** To date input. */
  readonly toDateInput: Locator;

  /**
   * Creates a new RangeSelectorPage instance.
   *
   * @param page - The Playwright page instance.
   */
  constructor(page: Page) {
    super(page);
    this.rangeFieldset = page.locator('#range-fieldset');
    this.rangeButtons = page.locator('.range-btn');
    this.fromDateInput = page.locator('#from-date');
    this.toDateInput = page.locator('#to-date');
  }

  /**
   * Returns a locator for the range preset button with the given value.
   *
   * @param range - The range preset value, e.g. '1m'.
   * @returns A Playwright locator.
   */
  rangeButton(range: RangePreset): Locator {
    log('info', `Getting locator for range button: ${range}`);
    const button = this.page.locator(`.range-btn[data-range="${range}"]`);
    log('info', `Successfully got locator for range button: ${range}`);
    return button;
  }

  /**
   * Returns a locator for the currently active range button.
   *
   * @returns A Playwright locator.
   */
  activeRangeButton(): Locator {
    log('info', 'Getting locator for the active range button');
    const button = this.page.locator('.range-btn.active');
    log('info', 'Successfully got locator for the active range button');
    return button;
  }

  /**
   * Clicks a range preset button.
   *
   * @param range - The range preset to select.
   */
  async selectRange(range: RangePreset): Promise<void> {
    log('info', `Selecting range preset: ${range}`);
    try {
      await this.rangeButton(range).click();
      log('info', `Successfully selected range preset: ${range}`);
    } catch (error) {
      log('error', `Failed to select range preset ${range}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Sets the custom date range inputs and dispatches the change event.
   *
   * @param from - The start date in yyyy-MM-dd format.
   * @param to - The end date in yyyy-MM-dd format.
   */
  async setCustomDateRange(from: string, to: string): Promise<void> {
    log('info', `Setting custom date range from ${from} to ${to}`);
    try {
      await this.fromDateInput.fill(from);
      await this.toDateInput.fill(to);
      await this.toDateInput.dispatchEvent('change');
      log('info', `Successfully set custom date range from ${from} to ${to}`);
    } catch (error) {
      log('error', `Failed to set custom date range from ${from} to ${to}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the value of the from date input.
   *
   * @returns The current from date value.
   */
  async getFromDateValue(): Promise<string> {
    log('info', 'Getting value of the from date input');
    try {
      const value = await this.fromDateInput.inputValue();
      log('info', `Successfully got value of the from date input: ${value}`);
      return value;
    } catch (error) {
      log('error', `Failed to get value of the from date input: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the value of the to date input.
   *
   * @returns The current to date value.
   */
  async getToDateValue(): Promise<string> {
    log('info', 'Getting value of the to date input');
    try {
      const value = await this.toDateInput.inputValue();
      log('info', `Successfully got value of the to date input: ${value}`);
      return value;
    } catch (error) {
      log('error', `Failed to get value of the to date input: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the given range preset button is active.
   *
   * @param range - The range preset to check.
   * @returns True if the button has the active class, false otherwise.
   */
  async isRangeButtonActive(range: RangePreset): Promise<boolean> {
    log('info', `Checking whether range button is active: ${range}`);
    try {
      const classAttribute = await this.rangeButton(range).getAttribute('class');
      const isActive = classAttribute !== null && classAttribute.includes('active');
      log('info', `Range button active check completed: ${range} (active: ${isActive})`);
      return isActive;
    } catch (error) {
      log('error', `Failed to check whether range button is active ${range}: ${this.formatError(error)}`);
      throw error;
    }
  }
}
