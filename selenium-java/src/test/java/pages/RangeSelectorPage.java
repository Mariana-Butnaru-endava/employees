package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for the time range selector controls on the home page.
 */
public class RangeSelectorPage extends BasePage {

  private static final By RANGE_FIELDSET = By.cssSelector("#range-fieldset");
  private static final By RANGE_BUTTONS = By.cssSelector(".range-btn");
  private static final By FROM_DATE = By.cssSelector("#from-date");
  private static final By TO_DATE = By.cssSelector("#to-date");

  /**
   * Creates a new RangeSelectorPage instance.
   *
   * @param driver - The WebDriver instance.
   */
  public RangeSelectorPage(WebDriver driver) {
    super(driver);
  }

  @Override
  protected String baseUrl() {
    return "";
  }

  /**
   * Returns whether the first range preset button is enabled.
   *
   * @return True if the first range button is enabled.
   */
  public boolean isFirstRangeButtonEnabled() {
    return driver.findElements(RANGE_BUTTONS).stream()
        .findFirst()
        .map(org.openqa.selenium.WebElement::isEnabled)
        .orElse(false);
  }

  /**
   * Returns whether the from-date input is enabled.
   *
   * @return True if the from-date input is enabled.
   */
  public boolean isFromDateEnabled() {
    return isEnabled(FROM_DATE);
  }

  /**
   * Returns whether the to-date input is enabled.
   *
   * @return True if the to-date input is enabled.
   */
  public boolean isToDateEnabled() {
    return isEnabled(TO_DATE);
  }
}
