package utils;

import config.TestConfig;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

import java.time.Duration;

/**
 * Factory responsible for creating and configuring WebDriver instances.
 *
 * Use {@link #createDriver()} to get a ready-to-use driver and call
 * {@link #quitDriver(WebDriver)} in teardown methods.
 */
public final class DriverFactory {

  private DriverFactory() {}

  /**
   * Creates a new WebDriver instance for the configured browser.
   *
   * @return A configured WebDriver instance.
   */
  public static WebDriver createDriver() {
    String browser = TestConfig.browser().toLowerCase();
    boolean headless = TestConfig.isHeadless();

    WebDriver driver;

    switch (browser) {
      case "firefox":
        WebDriverManager.firefoxdriver().setup();
        FirefoxOptions firefoxOptions = new FirefoxOptions();
        if (headless) {
          firefoxOptions.addArguments("--headless");
        }
        driver = new FirefoxDriver(firefoxOptions);
        break;

      case "edge":
        WebDriverManager.edgedriver().setup();
        EdgeOptions edgeOptions = new EdgeOptions();
        if (headless) {
          edgeOptions.addArguments("--headless");
        }
        driver = new EdgeDriver(edgeOptions);
        break;

      case "chrome":
      default:
        WebDriverManager.chromedriver().setup();
        ChromeOptions chromeOptions = new ChromeOptions();
        if (headless) {
          chromeOptions.addArguments("--headless=new");
        }
        chromeOptions.addArguments("--disable-gpu", "--no-sandbox", "--window-size=1920,1080");
        driver = new ChromeDriver(chromeOptions);
        break;
    }

    driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
    return driver;
  }

  /**
   * Safely quits a WebDriver instance.
   *
   * @param driver - The WebDriver instance to quit; may be null.
   */
  public static void quitDriver(WebDriver driver) {
    if (driver != null) {
      driver.quit();
    }
  }
}
