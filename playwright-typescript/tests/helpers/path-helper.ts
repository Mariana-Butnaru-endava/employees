import fs from 'node:fs';
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

/**
 * Reads a CSV fixture and returns its data rows (first column of each
 * non-empty line after the header).
 *
 * @param name - The fixture file name resolved via getFixturePath.
 * @returns The date value of each data row in the file.
 */
export function getFixtureRowDates(name: string): string[] {
  return fs
    .readFileSync(getFixturePath(name), 'utf-8')
    .split('\n')
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(',')[0]);
}
