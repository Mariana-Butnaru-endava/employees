package tests.ui;

import org.testng.Assert;
import org.testng.annotations.Test;
import utils.FixtureLoader;

import java.util.List;
import java.util.Map;

/**
 * UI tests for CSV upload and chart rendering, ported from Playwright TypeScript.
 */
public class UploadTest extends BaseUiTest {

  /**
   * The chart area is disabled until a file is uploaded.
   */
  @Test
  public void chartAreaDisabledUntilFileUploaded() {
    homePage.gotoPage();

    Assert.assertEquals(homePage.upload.getStatusText(), "No file selected");
    Assert.assertFalse(homePage.chart.isChartDisplayed());
    Assert.assertEquals(homePage.chart.getChartMessage(), "Upload a CSV file to see the chart.");
    Assert.assertFalse(homePage.rangeSelector.isFirstRangeButtonEnabled());
    Assert.assertFalse(homePage.rangeSelector.isFromDateEnabled());
  }

  /**
   * Uploading a valid CSV renders a line for every series.
   */
  @Test
  public void uploadingValidCsvRendersLineForEverySeries() {
    String fileName = "list2.csv";
    String fixturePath = FixtureLoader.getFixturePath(fileName);
    List<String> rowDates = FixtureLoader.getFixtureRowDates(fileName);
    String expectedSeries = "Endava Bucuresti,Endava Romania,Endava CE Region,All Company";

    homePage.gotoPage();
    homePage.upload.uploadFileViaButton(fixturePath);

    homePage.upload.waitForStatusToContain("Uploaded: " + fileName);
    Assert.assertNull(homePage.upload.getErrorText());
    Assert.assertTrue(homePage.chart.isChartDisplayed());
    Assert.assertTrue(homePage.rangeSelector.isFirstRangeButtonEnabled());
    Assert.assertTrue(homePage.rangeSelector.isFromDateEnabled());

    homePage.chart.waitForChart();
    Map<String, Object> summary = homePage.chart.getDatasetSummary();
    Assert.assertEquals(((Number) summary.get("datasetCount")).intValue(), 4);
    Assert.assertEquals(summary.get("labels"), List.of(expectedSeries.split(",")));

    List<Integer> pointCounts = ((List<?>) summary.get("pointCounts")).stream()
        .map(n -> ((Number) n).intValue())
        .toList();
    Assert.assertEquals(pointCounts, List.of(
        rowDates.size(), rowDates.size(), rowDates.size(), rowDates.size()));

    List<Object> colors = homePage.chart.getBorderColors();
    Assert.assertEquals(colors.size(), colors.stream().distinct().count());
  }

  /**
   * Drag-and-drop uploads a CSV file.
   */
  @Test
  public void dragAndDropUploadsCsvFile() {
    String csv = "observation_date,Endava Bucuresti\n2025-04-08,878\n2025-05-08,866\n";

    homePage.gotoPage();
    homePage.upload.dragAndDropCsv(csv, "dropped.csv");

    homePage.upload.waitForStatusToContain("Uploaded: dropped.csv (2 rows)");
    Assert.assertTrue(homePage.chart.isChartDisplayed());
  }
}
