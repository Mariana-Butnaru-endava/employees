package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page object for the upload controls on the home page.
 */
public class UploadPage extends BasePage {

  private static final By FILE_INPUT = By.cssSelector("#file-input");
  private static final By UPLOAD_BUTTON = By.cssSelector("label.upload-button");
  private static final By DROPZONE = By.cssSelector("#dropzone");
  private static final By UPLOAD_STATUS = By.cssSelector("#upload-status");
  private static final By UPLOAD_ERROR = By.cssSelector("#upload-error");

  /**
   * Creates a new UploadPage instance.
   *
   * @param driver - The WebDriver instance.
   */
  public UploadPage(WebDriver driver) {
    super(driver);
  }

  @Override
  protected String baseUrl() {
    return "";
  }

  /**
   * Uploads a CSV file by setting the file path directly on the hidden input.
   *
   * @param filePath - The absolute path to the CSV file.
   */
  public void uploadFile(String filePath) {
    log.info("Uploading CSV file via file input: {}", filePath);
    waitForVisible(FILE_INPUT).sendKeys(filePath);
  }

  /**
   * Uploads a CSV file by clicking the visible upload button.
   *
   * In Selenium we trigger the file input directly because the OS file
   * chooser cannot be automated. This method still exercises the
   * user-visible button before sending keys to the input.
   *
   * @param filePath - The absolute path to the CSV file.
   */
  public void uploadFileViaButton(String filePath) {
    log.info("Uploading CSV file via visible upload button: {}", filePath);
    click(UPLOAD_BUTTON);
    waitForVisible(FILE_INPUT).sendKeys(filePath);
  }

  /**
   * Simulates dropping a CSV file onto the dropzone using JavaScript.
   *
   * @param csvContent - The raw CSV content to drop.
   * @param fileName - The name to assign to the dropped file.
   */
  public void dragAndDropCsv(String csvContent, String fileName) {
    log.info("Dragging and dropping CSV file onto dropzone: {}", fileName);
    executeScript(
        "const file = new File([arguments[0]], arguments[1], { type: 'text/csv' });"
            + "const dataTransfer = new DataTransfer();"
            + "dataTransfer.items.add(file);"
            + "const dropzone = document.getElementById('dropzone');"
            + "const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });"
            + "Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });"
            + "if (!dropzone) { throw new Error('Dropzone not found'); }"
            + "dropzone.dispatchEvent(dropEvent);",
        csvContent, fileName);
  }

  /**
   * Returns the current upload status text.
   *
   * @return The upload status text.
   */
  public String getStatusText() {
    return getText(UPLOAD_STATUS);
  }

  /**
   * Waits until the upload status text contains the given substring.
   *
   * @param expected - The substring expected in the status text.
   */
  public void waitForStatusToContain(String expected) {
    log.info("Waiting for upload status to contain: {}", expected);
    wait.until(org.openqa.selenium.support.ui.ExpectedConditions
        .textToBePresentInElementLocated(UPLOAD_STATUS, expected));
  }

  /**
   * Returns the current upload error text.
   *
   * @return The upload error text, or null if absent.
   */
  public String getErrorText() {
    return isDisplayed(UPLOAD_ERROR) ? getText(UPLOAD_ERROR) : null;
  }
}
