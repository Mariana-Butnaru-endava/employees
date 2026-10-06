package pages;

import config.TestConfig;
import org.openqa.selenium.WebDriver;

/**
 * Page object for the home page of the application.
 *
 * Composes section-specific page objects (upload, chart, range selector)
 * and exposes a single entry point for navigation.
 */
public class HomePage extends BasePage {

  /** Page object for the upload controls. */
  public final UploadPage upload;
  /** Page object for the chart area. */
  public final ChartPage chart;
  /** Page object for the range selector controls. */
  public final RangeSelectorPage rangeSelector;

  /**
   * Creates a new HomePage instance.
   *
   * @param driver - The WebDriver instance.
   */
  public HomePage(WebDriver driver) {
    super(driver);
    this.upload = new UploadPage(driver);
    this.chart = new ChartPage(driver);
    this.rangeSelector = new RangeSelectorPage(driver);
  }

  @Override
  protected String baseUrl() {
    return TestConfig.devBaseUrl();
  }

  /**
   * Navigates to the home page (`/`).
   */
  public void gotoPage() {
    navigateTo("/");
  }
}
