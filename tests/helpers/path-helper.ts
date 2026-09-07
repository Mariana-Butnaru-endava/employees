import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Returns the absolute path to a fixture file stored in the shared constants directory.
 *
 * @param name - The file name of the fixture (e.g. 'list2.csv').
 * @returns The absolute path to the requested fixture file.
 */
export function getFixturePath(name: string) {
  return path.join(__dirname, '..', '..', 'src', 'core', 'constants', name);
}
