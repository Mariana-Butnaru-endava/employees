package config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Loads test configuration from config.properties and system properties.
 *
 * Priority order:
 * 1. System property (-Dkey=value)
 * 2. config.properties file on the classpath
 * 3. Hard-coded defaults
 */
public final class TestConfig {

  private static final Properties props = new Properties();

  static {
    try (InputStream stream = TestConfig.class.getClassLoader().getResourceAsStream("config.properties")) {
      if (stream != null) {
        props.load(stream);
      }
    } catch (IOException e) {
      throw new ExceptionInInitializerError("Failed to load config.properties: " + e.getMessage());
    }
  }

  private TestConfig() {}

  /**
   * Reads a configuration value with the given fallback.
   *
   * @param key - The property name to look up.
   * @param fallback - The default value if the property is missing.
   * @return The configured value or the fallback.
   */
  private static String get(String key, String fallback) {
    return System.getProperty(key, props.getProperty(key, fallback));
  }

  /**
   * Base URL of the backend Express server.
   *
   * @return The backend base URL.
   */
  public static String baseUrl() {
    return get("baseURL", "http://localhost:3000");
  }

  /**
   * Base URL of the Vite dev server (frontend).
   *
   * @return The frontend base URL.
   */
  public static String devBaseUrl() {
    return get("devBaseURL", "http://localhost:5173");
  }

  /**
   * Health check endpoint path.
   *
   * @return The health endpoint path.
   */
  public static String healthEndpoint() {
    return get("healthEndpoint", "/health");
  }

  /**
   * CSV upload endpoint path.
   *
   * @return The upload endpoint path.
   */
  public static String uploadEndpoint() {
    return get("uploadEndpoint", "/api/upload");
  }

  /**
   * Whether to auto-start the backend and dev servers before tests.
   *
   * @return True if auto-start is enabled.
   */
  public static boolean isAutostartServers() {
    return Boolean.parseBoolean(get("autostart.servers", "true"));
  }

  /**
   * Command used to start the Express backend server.
   *
   * @return The shell command for the backend server.
   */
  public static String serverStartCommand() {
    return get("server.start.command", "npm run server");
  }

  /**
   * Health-check URL used to verify the backend server is ready.
   *
   * @return The backend readiness URL.
   */
  public static String serverStartUrl() {
    return get("server.start.url", "http://localhost:3000/health");
  }

  /**
   * Command used to start the Vite dev server.
   *
   * @return The shell command for the dev server.
   */
  public static String devStartCommand() {
    return get("dev.start.command", "npm run dev");
  }

  /**
   * URL used to verify the dev server is ready.
   *
   * @return The dev server readiness URL.
   */
  public static String devStartUrl() {
    return get("dev.start.url", "http://localhost:5173");
  }

  /**
   * Maximum seconds to wait for a server to become ready.
   *
   * @return The server startup timeout in seconds.
   */
  public static int serverTimeoutSeconds() {
    return Integer.parseInt(get("server.timeout.seconds", "60"));
  }

  /**
   * Whether to run the browser in headless mode.
   *
   * @return True if headless mode is enabled.
   */
  public static boolean isHeadless() {
    return Boolean.parseBoolean(get("headless", "true"));
  }

  /**
   * Browser name to launch (chrome, edge, firefox).
   *
   * @return The configured browser name.
   */
  public static String browser() {
    return get("browser", "chrome");
  }
}
