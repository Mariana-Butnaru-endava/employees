import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

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
    return this.page.locator(`.range-btn[data-range="${range}"]`);
  }

  /**
   * Returns a locator for the currently active range button.
   *
   * @returns A Playwright locator.
   */
  activeRangeButton(): Locator {
    return this.page.locator('.range-btn.active');
  }

  /**
   * Clicks a range preset button.
   *
   * @param range - The range preset to select.
   */
  async selectRange(range: RangePreset): Promise<void> {
    await this.rangeButton(range).click();
  }

  /**
   * Sets the custom date range inputs and dispatches the change event.
   *
   * @param from - The start date in yyyy-MM-dd format.
   * @param to - The end date in yyyy-MM-dd format.
   */
  async setCustomDateRange(from: string, to: string): Promise<void> {
    await this.fromDateInput.fill(from);
    await this.toDateInput.fill(to);
    await this.toDateInput.dispatchEvent('change');
  }

  /**
   * Returns the value of the from date input.
   *
   * @returns The current from date value.
   */
  async getFromDateValue(): Promise<string> {
    return this.fromDateInput.inputValue();
  }

  /**
   * Returns the value of the to date input.
   *
   * @returns The current to date value.
   */
  async getToDateValue(): Promise<string> {
    return this.toDateInput.inputValue();
  }

  /**
   * Checks whether the given range preset button is active.
   *
   * @param range - The range preset to check.
   * @returns True if the button has the active class, false otherwise.
   */
  async isRangeButtonActive(range: RangePreset): Promise<boolean> {
    const classAttribute = await this.rangeButton(range).getAttribute('class');
    return classAttribute !== null && classAttribute.includes('active');
  }
}
