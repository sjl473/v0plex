/**
 * Shared CLI Logging Utilities
 * Provides logging to console and optionally to file
 */

import fs from 'fs';
import path from 'path';

let logStream: fs.WriteStream | null = null;
let useLogMode = false;

/**
 * Setup logging based on environment variable
 * Returns the log file path if logging is enabled, null otherwise
 */
export function setupLogging(logDir: string, logPrefix: string = 'vmd'): string | null {
  useLogMode = process.env.VMD_BUILD_LOG === '1' ||
               process.env.VMD_BUILD_LOG === 'true' ||
               process.env.VMD_TEST_LOG === '1' ||
               process.env.VMD_TEST_LOG === 'true';

  if (!useLogMode) {
    return null;
  }

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logFile = path.join(logDir, `${logPrefix}_log_${timestamp}.log`);
  logStream = fs.createWriteStream(logFile, { flags: 'w' });

  return logFile;
}

/**
 * Log to file only (if logging is enabled)
 */
export function log(line: string = ''): void {
  if (useLogMode && logStream) {
    logStream.write(line + '\n');
  }
}

/**
 * Log to both console and file (if logging is enabled)
 */
export function logToBoth(line: string = ''): void {
  console.log(line);
  log(line);
}

/**
 * Close the log stream
 * Returns a promise that resolves when the stream is closed
 */
export function closeLog(): Promise<void> {
  return new Promise((resolve) => {
    if (logStream) {
      logStream.end(() => resolve());
    } else {
      resolve();
    }
  });
}

/**
 * Check if log mode is enabled
 */
export function isLogModeEnabled(): boolean {
  return useLogMode;
}
