/** Supported log severity levels. */
export type LogLevel = 'info' | 'warn' | 'error';

/** ANSI color codes used to colorize log output in the terminal. */
const levelColors: Record<LogLevel, string> = {
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};

/** ANSI reset code used to restore default terminal colors. */
const resetColor = '\x1b[0m';

/**
 * Logs a message to the console with a colored level prefix.
 *
 * @param level - The severity level of the message.
 * @param message - The message to log.
 */
export function log(level: LogLevel, message: string): void {
  const color = levelColors[level];
  console.log(`${color}[${level.toUpperCase()}]${resetColor} ${message}`);
}
