import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function fixture(name: string) {
  return path.join(__dirname, 'fixtures', name);
}
