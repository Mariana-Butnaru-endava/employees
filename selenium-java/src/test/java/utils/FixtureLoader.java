package utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Loads CSV test fixtures from the classpath.
 */
public final class FixtureLoader {

  private FixtureLoader() {}

  /**
   * Resolves a fixture file name to an absolute filesystem path.
   *
   * @param name - The fixture file name (e.g. "list2.csv").
   * @return The absolute path to the fixture.
   */
  public static String getFixturePath(String name) {
    try {
      return Path.of(Objects.requireNonNull(
          FixtureLoader.class.getClassLoader().getResource(name)).toURI()
      ).toAbsolutePath().toString();
    } catch (Exception e) {
      throw new IllegalArgumentException("Fixture not found: " + name, e);
    }
  }

  /**
   * Reads a CSV fixture and returns the data rows.
   *
   * @param name - The fixture file name.
   * @return The list of data-row strings after the header.
   */
  public static List<String> getFixtureRowDates(String name) {
    List<String> rows = new ArrayList<>();
    try (InputStream stream = FixtureLoader.class.getClassLoader().getResourceAsStream(name);
         BufferedReader reader = new BufferedReader(
             new InputStreamReader(Objects.requireNonNull(stream), StandardCharsets.UTF_8))) {
      reader.readLine(); // skip header
      String line;
      while ((line = reader.readLine()) != null) {
        if (!line.trim().isEmpty()) {
          rows.add(line.split(",")[0]);
        }
      }
    } catch (IOException | NullPointerException e) {
      throw new IllegalArgumentException("Unable to read fixture: " + name, e);
    }
    return rows;
  }
}
