package services;

import config.TestConfig;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;

/**
 * Service wrapper for the backend health endpoint.
 */
public class HealthService {

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
    return request.get(TestConfig.healthEndpoint());
  }
}
