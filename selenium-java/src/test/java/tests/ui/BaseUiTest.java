package tests.ui;

import config.TestConfig;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import pages.HomePage;
import utils.DriverFactory;
import utils.ServerBootstrap;

/**
 * Base class for UI tests. Manages the WebDriver lifecycle and optional
 * server startup.
 */
public abstract class BaseUiTest {

  protected WebDriver driver;
  protected HomePage homePage;

  /**
   * Starts the application servers and creates a WebDriver before the class.
   */
  @BeforeClass
  public void setUp() {
    ServerBootstrap.ensureServersRunning();
    driver = DriverFactory.createDriver();
    homePage = new HomePage(driver);
  }

  /**
   * Quits the WebDriver after the class.
   */
  @AfterClass
  public void tearDown() {
    DriverFactory.quitDriver(driver);
  }
}
