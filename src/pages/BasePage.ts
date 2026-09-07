import { Page, Locator } from '@playwright/test';
import { log } from '../../tests/helpers/logger.js';

/**
 * Base page object that wraps common Playwright interactions.
 *
 * All page objects should extend this class so that low-level actions
 * (clicking, typing, navigating, etc.) are centralized and reusable.
 */
export abstract class BasePage {
  /** The underlying Playwright page instance. */
  protected readonly page: Page;

  /** Default timeout in milliseconds used when waiting for elements to become visible. */
  private readonly visibilityTimeout = 5_000;

  /**
   * Creates a new base page object.
   *
   * @param page - The Playwright page to wrap.
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to the given path relative to the configured baseURL.
   *
   * @param path - The URL path to navigate to.
   */
  async navigateTo(path: string): Promise<void> {
    log('info', `Navigating to path: ${path}`);
    try {
      await this.page.goto(path);
      log('info', `Successfully navigated to path: ${path}`);
    } catch (error) {
      log('error', `Failed to navigate to path ${path}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Waits up to 5 seconds for the given locator to become visible.
   *
   * @param locator - The Playwright locator to wait for.
   */
  protected async waitForVisibleLocator(locator: Locator): Promise<void> {
    log('info', 'Waiting for locator to become visible');
    try {
      await locator.waitFor({ state: 'visible', timeout: this.visibilityTimeout });
      log('info', 'Locator became visible successfully');
    } catch (error) {
      log('error', `Locator did not become visible: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Clicks the element matching the given selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   */
  async click(selector: string): Promise<void> {
    log('info', `Clicking element with selector: ${selector}`);
    try {
      const locator = this.page.locator(selector);
      await this.waitForVisibleLocator(locator);
      await locator.click();
      log('info', `Successfully clicked element with selector: ${selector}`);
    } catch (error) {
      log('error', `Failed to click element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Clicks the given Playwright locator after verifying it is visible.
   *
   * @param locator - The locator to click.
   */
  async clickLocator(locator: Locator): Promise<void> {
    log('info', 'Clicking the provided locator');
    try {
      await this.waitForVisibleLocator(locator);
      await locator.click();
      log('info', 'Successfully clicked the provided locator');
    } catch (error) {
      log('error', `Failed to click the provided locator: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Types text into the element matching the given selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   * @param text - The text to type.
   */
  async typeInto(selector: string, text: string): Promise<void> {
    log('info', `Typing text into element with selector: ${selector}`);
    try {
      const locator = this.page.locator(selector);
      await this.waitForVisibleLocator(locator);
      await locator.fill(text);
      log('info', `Successfully typed text into element with selector: ${selector}`);
    } catch (error) {
      log('error', `Failed to type text into element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Types text into the given Playwright locator after verifying it is visible.
   *
   * @param locator - The locator to fill.
   * @param text - The text to type.
   */
  async typeIntoLocator(locator: Locator, text: string): Promise<void> {
    log('info', 'Typing text into the provided locator');
    try {
      await this.waitForVisibleLocator(locator);
      await locator.fill(text);
      log('info', 'Successfully typed text into the provided locator');
    } catch (error) {
      log('error', `Failed to type text into the provided locator: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns the text content of the element matching the given selector.
   *
   * @param selector - A Playwright selector string.
   * @returns The element's text content, or null if it has none.
   */
  async getText(selector: string): Promise<string | null> {
    log('info', `Getting text content of element with selector: ${selector}`);
    try {
      const text = await this.page.locator(selector).textContent();
      log('info', `Successfully retrieved text content of element with selector: ${selector}`);
      return text;
    } catch (error) {
      log('error', `Failed to get text content of element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Returns a Playwright locator for the given selector.
   *
   * @param selector - A Playwright selector string.
   * @returns A Locator instance.
   */
  getLocator(selector: string): Locator {
    log('info', `Getting locator for selector: ${selector}`);
    const locator = this.page.locator(selector);
    log('info', `Successfully got locator for selector: ${selector}`);
    return locator;
  }

  /**
   * Waits up to 5 seconds until the element matching the given selector is visible.
   *
   * @param selector - A Playwright selector string.
   */
  async waitForVisible(selector: string): Promise<void> {
    log('info', `Waiting for element with selector to become visible: ${selector}`);
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: this.visibilityTimeout });
      log('info', `Element with selector became visible successfully: ${selector}`);
    } catch (error) {
      log('error', `Element with selector did not become visible: ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Waits up to 5 seconds until the element matching the given selector is hidden.
   *
   * @param selector - A Playwright selector string.
   */
  async waitForHidden(selector: string): Promise<void> {
    log('info', `Waiting for element with selector to become hidden: ${selector}`);
    try {
      await this.page.locator(selector).waitFor({ state: 'hidden', timeout: this.visibilityTimeout });
      log('info', `Element with selector became hidden successfully: ${selector}`);
    } catch (error) {
      log('error', `Element with selector did not become hidden: ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the element matching the given selector is visible.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is visible, false otherwise.
   */
  async isVisible(selector: string): Promise<boolean> {
    log('info', `Checking visibility of element with selector: ${selector}`);
    try {
      const visible = await this.page.locator(selector).isVisible();
      log('info', `Visibility check completed for selector: ${selector} (visible: ${visible})`);
      return visible;
    } catch (error) {
      log('error', `Failed to check visibility of element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the element matching the given selector is hidden.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is hidden, false otherwise.
   */
  async isHidden(selector: string): Promise<boolean> {
    log('info', `Checking hidden state of element with selector: ${selector}`);
    try {
      const hidden = await this.page.locator(selector).isHidden();
      log('info', `Hidden state check completed for selector: ${selector} (hidden: ${hidden})`);
      return hidden;
    } catch (error) {
      log('error', `Failed to check hidden state of element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the element matching the given selector is enabled.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is enabled, false otherwise.
   */
  async isEnabled(selector: string): Promise<boolean> {
    log('info', `Checking enabled state of element with selector: ${selector}`);
    try {
      const enabled = await this.page.locator(selector).isEnabled();
      log('info', `Enabled state check completed for selector: ${selector} (enabled: ${enabled})`);
      return enabled;
    } catch (error) {
      log('error', `Failed to check enabled state of element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Checks whether the element matching the given selector is disabled.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is disabled, false otherwise.
   */
  async isDisabled(selector: string): Promise<boolean> {
    log('info', `Checking disabled state of element with selector: ${selector}`);
    try {
      const disabled = await this.page.locator(selector).isDisabled();
      log('info', `Disabled state check completed for selector: ${selector} (disabled: ${disabled})`);
      return disabled;
    } catch (error) {
      log('error', `Failed to check disabled state of element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Dispatches the given DOM event on the element matching the selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   * @param event - The event type to dispatch, e.g. 'change'.
   */
  async dispatchEvent(selector: string, event: string): Promise<void> {
    log('info', `Dispatching event "${event}" on element with selector: ${selector}`);
    try {
      const locator = this.page.locator(selector);
      await this.waitForVisibleLocator(locator);
      await locator.dispatchEvent(event);
      log('info', `Successfully dispatched event "${event}" on element with selector: ${selector}`);
    } catch (error) {
      log('error', `Failed to dispatch event "${event}" on element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Sets files on a file input element matching the given selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string for the file input.
   * @param files - File paths or file payloads to set.
   */
  async setInputFiles(
    selector: string,
    files: Parameters<Page['setInputFiles']>[1]
  ): Promise<void> {
    log('info', `Setting input files on element with selector: ${selector}`);
    try {
      const locator = this.page.locator(selector);
      await this.waitForVisibleLocator(locator);
      await locator.setInputFiles(files);
      log('info', `Successfully set input files on element with selector: ${selector}`);
    } catch (error) {
      log('error', `Failed to set input files on element with selector ${selector}: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Executes JavaScript in the browser page context.
   *
   * @param pageFunction - The function to evaluate in the page.
   * @param arg - Optional argument to pass to the function.
   * @returns The result of the evaluated function.
   */
  async evaluate<R>(pageFunction: () => R | Promise<R>): Promise<R>;
  async evaluate<R, Arg>(pageFunction: (arg: Arg) => R | Promise<R>, arg: Arg): Promise<R>;
  async evaluate<R, Arg>(
    pageFunction: (() => R | Promise<R>) | ((arg: Arg) => R | Promise<R>),
    arg?: Arg
  ): Promise<R> {
    log('info', 'Evaluating JavaScript in the browser page context');
    try {
      const result = await this.page.evaluate(pageFunction as () => R | Promise<R>, arg);
      log('info', 'Successfully evaluated JavaScript in the browser page context');
      return result;
    } catch (error) {
      log('error', `Failed to evaluate JavaScript in the browser page context: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Waits until the given predicate returns a truthy value.
   *
   * @param predicate - The predicate to wait for in the page context.
   * @param options - Optional Playwright waitForFunction options.
   */
  async waitForFunction(
    predicate: () => boolean | Promise<boolean>,
    options?: { timeout?: number }
  ): Promise<void> {
    log('info', 'Waiting for function predicate to return true');
    try {
      await this.page.waitForFunction(predicate, options);
      log('info', 'Function predicate returned true successfully');
    } catch (error) {
      log('error', `Function predicate did not return true: ${this.formatError(error)}`);
      throw error;
    }
  }

  /**
   * Formats an unknown error value into a human-readable string.
   *
   * @param error - The error value to format.
   * @returns A string representation of the error.
   */
  protected formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
