package services;

import config.TestConfig;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
    
import static io.restassured.RestAssured.*;

/**
 * Service wrapper for the backend health endpoint.
 */
public class HealthService {

  private static final Logger log = LoggerFactory.getLogger(HealthService.class);

  private final RequestSpecification request;

  /**
   * Creates a HealthService bound to the configured base URL.
   */
  public HealthService() {
    this.request = given().baseUri(TestConfig.baseUrl());
  }

  /**
   * Calls GET /health and returns the raw response.
   *
   * @return The REST Assured response.
   */
  public Response getStatus() {
    log.info("GET {}{}", TestConfig.baseUrl(), TestConfig.healthEndpoint());
    Response response = request.get(TestConfig.healthEndpoint());
    response.then().log().all();
    return response;
  }
}
