import { Page, Locator } from '@playwright/test';

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
    await this.page.goto(path);
  }

  /**
   * Waits up to 5 seconds for the given locator to become visible.
   *
   * @param locator - The Playwright locator to wait for.
   */
  protected async waitForVisibleLocator(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.visibilityTimeout });
  }

  /**
   * Clicks the element matching the given selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   */
  async click(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await this.waitForVisibleLocator(locator);
    await locator.click();
  }

  /**
   * Clicks the given Playwright locator after verifying it is visible.
   *
   * @param locator - The locator to click.
   */
  async clickLocator(locator: Locator): Promise<void> {
    await this.waitForVisibleLocator(locator);
    await locator.click();
  }

  /**
   * Types text into the element matching the given selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   * @param text - The text to type.
   */
  async typeInto(selector: string, text: string): Promise<void> {
    const locator = this.page.locator(selector);
    await this.waitForVisibleLocator(locator);
    await locator.fill(text);
  }

  /**
   * Types text into the given Playwright locator after verifying it is visible.
   *
   * @param locator - The locator to fill.
   * @param text - The text to type.
   */
  async typeIntoLocator(locator: Locator, text: string): Promise<void> {
    await this.waitForVisibleLocator(locator);
    await locator.fill(text);
  }

  /**
   * Returns the text content of the element matching the given selector.
   *
   * @param selector - A Playwright selector string.
   * @returns The element's text content, or null if it has none.
   */
  async getText(selector: string): Promise<string | null> {
    return this.page.locator(selector).textContent();
  }

  /**
   * Returns a Playwright locator for the given selector.
   *
   * @param selector - A Playwright selector string.
   * @returns A Locator instance.
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Waits up to 5 seconds until the element matching the given selector is visible.
   *
   * @param selector - A Playwright selector string.
   */
  async waitForVisible(selector: string): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: this.visibilityTimeout });
  }

  /**
   * Waits up to 5 seconds until the element matching the given selector is hidden.
   *
   * @param selector - A Playwright selector string.
   */
  async waitForHidden(selector: string): Promise<void> {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout: this.visibilityTimeout });
  }

  /**
   * Checks whether the element matching the given selector is visible.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is visible, false otherwise.
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /**
   * Checks whether the element matching the given selector is hidden.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is hidden, false otherwise.
   */
  async isHidden(selector: string): Promise<boolean> {
    return this.page.locator(selector).isHidden();
  }

  /**
   * Checks whether the element matching the given selector is enabled.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is enabled, false otherwise.
   */
  async isEnabled(selector: string): Promise<boolean> {
    return this.page.locator(selector).isEnabled();
  }

  /**
   * Checks whether the element matching the given selector is disabled.
   *
   * @param selector - A Playwright selector string.
   * @returns True if the element is disabled, false otherwise.
   */
  async isDisabled(selector: string): Promise<boolean> {
    return this.page.locator(selector).isDisabled();
  }

  /**
   * Dispatches the given DOM event on the element matching the selector after verifying it is visible.
   *
   * @param selector - A Playwright selector string.
   * @param event - The event type to dispatch, e.g. 'change'.
   */
  async dispatchEvent(selector: string, event: string): Promise<void> {
    const locator = this.page.locator(selector);
    await this.waitForVisibleLocator(locator);
    await locator.dispatchEvent(event);
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
    const locator = this.page.locator(selector);
    await this.waitForVisibleLocator(locator);
    await locator.setInputFiles(files);
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
    return this.page.evaluate(pageFunction as () => R | Promise<R>, arg);
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
    await this.page.waitForFunction(predicate, options);
  }
}
