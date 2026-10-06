package utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.ISuite;
import org.testng.ISuiteListener;

/**
 * TestNG suite listener that starts the application servers once before any
 * tests run, regardless of parallel execution.
 */
public class ServerBootstrapListener implements ISuiteListener {

  private static final Logger log = LoggerFactory.getLogger(ServerBootstrapListener.class);

  /**
   * Ensures servers are running before the suite starts.
   *
   * @param suite - The TestNG suite being started.
   */
  @Override
  public void onStart(ISuite suite) {
    log.info("Suite '{}' starting; ensuring servers are up", suite.getName());
    ServerBootstrap.ensureServersRunning();
  }
}
