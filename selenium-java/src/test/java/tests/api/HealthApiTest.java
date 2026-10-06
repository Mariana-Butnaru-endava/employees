package tests.api;

import config.TestConfig;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;
import services.HealthService;

import static io.restassured.RestAssured.given;

/**
 * API tests for the backend health endpoint, ported from Playwright TypeScript.
 */
public class HealthApiTest {

  private final HealthService healthService = new HealthService();

  /**
   * GET /health returns a 200 OK status payload.
   */
  @Test
  public void returnsOkStatusPayload() {
    Response response = healthService.getStatus();

    Assert.assertEquals(response.getStatusCode(), 200);
    Assert.assertEquals(response.jsonPath().getString("status"), "ok");
  }

  /**
   * POST /health is not allowed and returns 404.
   */
  @Test
  public void postHealthIsNotAllowed() {
    Response response = given()
        .baseUri(TestConfig.baseUrl())
        .post(TestConfig.healthEndpoint());

    Assert.assertEquals(response.getStatusCode(), 404);
  }
}
