package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

import java.util.List;
import java.util.Map;

/**
 * Page object for the chart area on the home page.
 */
public class ChartPage extends BasePage {

  private static final By CHART_CANVAS = By.cssSelector("#employees-chart");
  private static final By CHART_MESSAGE = By.cssSelector("#chart-message");

  /**
   * Creates a new ChartPage instance.
   *
   * @param driver - The WebDriver instance.
   */
  public ChartPage(WebDriver driver) {
    super(driver);
  }

  @Override
  protected String baseUrl() {
    return "";
  }

  /**
   * Waits until the Chart.js instance is exposed on the window.
   */
  public void waitForChart() {
    log.info("Waiting for the Chart.js instance to be exposed on the window");
    waitForScript("return Boolean(window.__employeesChart)");
  }

  /**
   * Returns summary information about all rendered datasets.
   *
   * @return A map with datasetCount, labels, and pointCounts.
   */
  @SuppressWarnings("unchecked")
  public Map<String, Object> getDatasetSummary() {
    log.info("Getting dataset summary");
    return (Map<String, Object>) executeScript(
        "const chart = window.__employeesChart;"
            + "return {"
            + "  datasetCount: chart.data.datasets.length,"
            + "  labels: chart.data.datasets.map(d => d.label),"
            + "  pointCounts: chart.data.datasets.map(d => d.data.length)"
            + "}");
  }

  /**
   * Returns the distinct border colors used by all datasets.
   *
   * @return A list of border color strings.
   */
  @SuppressWarnings("unchecked")
  public List<Object> getBorderColors() {
    log.info("Getting border colors");
    return (List<Object>) executeScript(
        "return window.__employeesChart.data.datasets.map(d => d.borderColor)");
  }

  /**
   * Returns whether the chart canvas is displayed.
   *
   * @return True if the canvas is displayed.
   */
  public boolean isChartDisplayed() {
    return isDisplayed(CHART_CANVAS);
  }

  /**
   * Returns the chart placeholder message text.
   *
   * @return The chart message text.
   */
  public String getChartMessage() {
    return getText(CHART_MESSAGE);
  }
}
