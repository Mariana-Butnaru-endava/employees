package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

/**
 * Base page object that wraps common Selenium interactions.
 *
 * All page objects should extend this class so that low-level actions
 * (clicking, typing, navigating, waiting, etc.) are centralized and reusable.
 */
public abstract class BasePage {

  protected final WebDriver driver;
  protected final WebDriverWait wait;
  protected final Logger log = LoggerFactory.getLogger(getClass());
  private static final Duration VISIBILITY_TIMEOUT = Duration.ofSeconds(10);

  /**
   * Creates a new base page object.
   *
   * @param driver - The WebDriver instance to wrap.
   */
  protected BasePage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, VISIBILITY_TIMEOUT);
  }

  /**
   * Navigates to the given path relative to the configured base URL.
   *
   * @param path - The URL path to navigate to.
   */
  public void navigateTo(String path) {
    String url = baseUrl() + path;
    log.info("Navigating to {}", url);
    driver.get(url);
  }

  /**
   * Returns the base URL used for navigation.
   *
   * @return The base URL.
   */
  protected abstract String baseUrl();

  /**
   * Waits for an element to become visible and returns it.
   *
   * @param locator - The By locator for the element.
   * @return The visible WebElement.
   */
  protected WebElement waitForVisible(By locator) {
    log.info("Waiting for element to be visible: {}", locator);
    return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
  }

  /**
   * Waits for an element to become clickable and returns it.
   *
   * @param locator - The By locator for the element.
   * @return The clickable WebElement.
   */
  protected WebElement waitForClickable(By locator) {
    log.info("Waiting for element to be clickable: {}", locator);
    return wait.until(ExpectedConditions.elementToBeClickable(locator));
  }

  /**
   * Waits until a JavaScript condition returns true.
   *
   * @param script - The JavaScript to evaluate; must return a Boolean.
   */
  protected void waitForScript(String script) {
    log.info("Waiting for script condition: {}", script);
    wait.until(d -> Boolean.TRUE.equals(
        ((JavascriptExecutor) d).executeScript(script)));
  }

  /**
   * Executes JavaScript in the browser context.
   *
   * @param script - The JavaScript to execute.
   * @param args - Arguments to pass to the script.
   * @return The script result.
   */
  protected Object executeScript(String script, Object... args) {
    log.info("Executing script: {}", script);
    return ((JavascriptExecutor) driver).executeScript(script, args);
  }

  /**
   * Clicks an element after waiting for it to be clickable.
   *
   * @param locator - The By locator for the element.
   */
  protected void click(By locator) {
    log.info("Clicking element: {}", locator);
    waitForClickable(locator).click();
  }

  /**
   * Types text into an element after waiting for it to be visible.
   *
   * @param locator - The By locator for the element.
   * @param text - The text to type.
   */
  protected void sendKeys(By locator, String text) {
    log.info("Typing '{}' into element: {}", text, locator);
    WebElement element = waitForVisible(locator);
    element.clear();
    element.sendKeys(text);
  }

  /**
   * Returns the visible text of an element.
   *
   * @param locator - The By locator for the element.
   * @return The element text.
   */
  protected String getText(By locator) {
    log.info("Getting text of element: {}", locator);
    return waitForVisible(locator).getText();
  }

  /**
   * Checks whether an element is displayed.
   *
   * @param locator - The By locator for the element.
   * @return True if the element is displayed.
   */
  protected boolean isDisplayed(By locator) {
    try {
      return driver.findElement(locator).isDisplayed();
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * Checks whether an element is enabled.
   *
   * @param locator - The By locator for the element.
   * @return True if the element is enabled.
   */
  protected boolean isEnabled(By locator) {
    try {
      return driver.findElement(locator).isEnabled();
    } catch (Exception e) {
      return false;
    }
  }
}
