package utils;

import config.TestConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Starts the Node.js backend and Vite dev servers before the TestNG suite and
 * stops them when the suite finishes.
 *
 * If a server is already reachable, it is not restarted.
 */
public final class ServerBootstrap {

  private static final Logger log = LoggerFactory.getLogger(ServerBootstrap.class);
  private static final List<Process> runningProcesses = new ArrayList<>();
  private static boolean started = false;

  private ServerBootstrap() {}

  /**
   * Ensures the backend and frontend servers are running.
   *
   * @return True if servers were started by this bootstrapper, false if they were already running.
   */
  public static synchronized boolean ensureServersRunning() {
    if (!TestConfig.isAutostartServers()) {
      log.info("Auto-start disabled; assuming servers are already running.");
      return false;
    }

    if (started) {
      return false;
    }

    boolean serverOk = isReachable(TestConfig.serverStartUrl());
    boolean devOk = isReachable(TestConfig.devStartUrl());

    if (serverOk && devOk) {
      log.info("Both servers are already running.");
      return false;
    }

    Runtime.getRuntime().addShutdownHook(new Thread(ServerBootstrap::shutdownAll));

    if (!serverOk) {
      startServer("express-backend", TestConfig.serverStartCommand(), TestConfig.serverStartUrl());
    }
    if (!devOk) {
      startServer("vite-dev", TestConfig.devStartCommand(), TestConfig.devStartUrl());
    }

    started = true;
    return true;
  }

  private static void startServer(String name, String command, String healthUrl) {
    log.info("Starting {} with command: {}", name, command);
    try {
      java.io.File logDir = new java.io.File("target");
      if (!logDir.exists()) {
        logDir.mkdirs();
      }
      java.io.File logFile = new java.io.File(logDir, name + ".log");

      boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
      ProcessBuilder builder = isWindows
          ? new ProcessBuilder("cmd.exe", "/c", command)
          : new ProcessBuilder("sh", "-c", command);
      builder.redirectErrorStream(true);
      builder.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));
      builder.directory(new java.io.File("..").getCanonicalFile());
      Process process = builder.start();
      runningProcesses.add(process);
      waitForUrl(name, healthUrl, TestConfig.serverTimeoutSeconds());
      log.info("{} is ready at {}", name, healthUrl);
    } catch (IOException e) {
      throw new IllegalStateException("Failed to start " + name, e);
    }
  }

  private static boolean isReachable(String url) {
    try {
      URI uri = URI.create(url);
      String host = uri.getHost();
      int port = uri.getPort();

      // "localhost" may resolve differently for the probe (IPv4) than for the
      // server process (IPv6). Try a TCP connect against every resolved address.
      for (java.net.InetAddress address : java.net.InetAddress.getAllByName(host)) {
        try (java.net.Socket socket = new java.net.Socket()) {
          socket.connect(new java.net.InetSocketAddress(address, port), 2_000);
          return true;
        } catch (Exception ignored) {
          // Try the next resolved address.
        }
      }
      return false;
    } catch (Exception e) {
      return false;
    }
  }

  private static void waitForUrl(String name, String url, int timeoutSeconds) {
    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds);
    while (System.nanoTime() < deadline) {
      if (isReachable(url)) {
        return;
      }
      try {
        Thread.sleep(1000);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException("Interrupted while waiting for " + name, e);
      }
    }
    throw new IllegalStateException(name + " did not become ready within " + timeoutSeconds + "s");
  }

  private static synchronized void shutdownAll() {
    for (Process p : runningProcesses) {
      if (p != null && p.isAlive()) {
        log.info("Stopping process tree rooted at PID {}", p.pid());
        try {
          boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
          if (isWindows) {
            // taskkill /T /F terminates the cmd.exe wrapper and all child processes.
            new ProcessBuilder("taskkill", "/PID", String.valueOf(p.pid()), "/T", "/F")
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                .start()
                .waitFor(10, TimeUnit.SECONDS);
          } else {
            p.descendants().forEach(ProcessHandle::destroy);
            p.destroy();
            p.waitFor(10, TimeUnit.SECONDS);
          }
        } catch (Exception e) {
          p.descendants().forEach(ProcessHandle::destroyForcibly);
          p.destroyForcibly();
        }
      }
    }
    runningProcesses.clear();
  }
}
