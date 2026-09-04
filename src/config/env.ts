import 'dotenv/config';

/**
 * Reads an environment variable and returns a fallback value if the variable
 * is missing, empty, or only whitespace.
 *
 * @param name - The name of the environment variable to read.
 * @param fallback - The default value to use when the variable is not set.
 * @returns The environment variable value or the fallback.
 */
function getEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value?.trim() || fallback;
}

/**
 * Application environment configuration with guaranteed fallback values.
 */
export const env = {
  /** Base URL of the backend API server. */
  baseURL: getEnv('BASE_URL', 'http://localhost:3000'),

  /** Base URL of the Vite dev server (frontend). */
  devBaseURL: getEnv('DEV_BASE_URL', 'http://localhost:5173'),

  /** Health check endpoint path. */
  healthEndpoint: getEnv('HEALTH_ENDPOINT', '/health'),

  /** CSV upload endpoint path. */
  uploadEndpoint: getEnv('UPLOAD_ENDPOINT', '/api/upload'),
};
