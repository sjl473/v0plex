/**
 * Shared CLI Error Formatting Utilities
 * Formats errors with context for CLI output
 */

import fs from 'fs';
import path from 'path';
import { log, logToBoth } from './logger';

/**
 * Convert a file path to a file:// URL for clickable links in terminals
 */
export function toFileUrl(filePath: string): string {
  return 'file://' + filePath;
}

/**
 * Format and display an error with markdown context
 */
export function formatErrorWithContext(
  file: string,
  error: string,
  errorLine?: number,
  duration?: number,
  fullContent?: string
): void {
  logToBoth('');
  logToBoth(`File: ${path.basename(file)}`);
  if (duration !== undefined) {
    logToBoth(`Duration: ${duration}ms`);
  }
  logToBoth('-'.repeat(70));

  // File URL for easy navigation
  logToBoth(`Markdown Source: ${toFileUrl(file)}`);

  // Extract error line from message if not provided
  if (!errorLine) {
    const lineMatch = error.match(/at line (\d+)/i);
    if (lineMatch) {
      errorLine = parseInt(lineMatch[1], 10);
    }
  }

  if (errorLine && errorLine > 0) {
    logToBoth(`Error Location: Line ${errorLine}`);
  }

  logToBoth('');
  logToBoth(`Error Message:`);
  logToBoth(`  ${error.replace(/\n/g, '\n  ')}`);

  // Show markdown context around error
  if (fs.existsSync(file) && errorLine && errorLine > 0) {
    try {
      const content = fullContent || fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const startContext = Math.max(0, errorLine - 4);
      const endContext = Math.min(lines.length, errorLine + 3);

      logToBoth('');
      logToBoth('Markdown Context:');
      logToBoth('-'.repeat(70));

      for (let i = startContext; i < endContext; i++) {
        const isErrorLine = i === errorLine - 1;
        const prefix = isErrorLine ? '>>> ' : '    ';
        const lineNum = (i + 1).toString().padStart(3);
        logToBoth(`${prefix}${lineNum} | ${lines[i]}`);
      }

      if (endContext < lines.length) {
        logToBoth(`    ... (${lines.length - endContext} more lines)`);
      }
    } catch {
      // Ignore read errors
    }
  }

  logToBoth('');
  logToBoth('='.repeat(70));
}

/**
 * Print a summary of successful and failed files
 */
export function printSummary(
  successful: Array<{ file: string; duration: number }>,
  failed: Array<{ file: string; error: string; errorLine?: number; duration: number; fullContent?: string }>,
  total: number
): void {
  logToBoth('');
  logToBoth('='.repeat(70));
  logToBoth('SUMMARY');
  logToBoth('='.repeat(70));
  logToBoth(`Total Files: ${total}`);
  logToBoth(`Successful: ${successful.length}`);
  logToBoth(`Failed: ${failed.length}`);

  if (successful.length > 0) {
    logToBoth('');
    logToBoth(`✅ SUCCESS (${successful.length}/${total}):`);
    successful.forEach(r => {
      logToBoth(`   ✓ ${r.file} (${r.duration}ms)`);
    });
  }

  if (failed.length > 0) {
    logToBoth('');
    logToBoth(`❌ FAILED (${failed.length}/${total}):`);
    failed.forEach(r => {
      logToBoth(`   ✗ ${r.file} (${r.duration}ms)`);
      if (r.error) {
        logToBoth(`     Error: ${r.error.split('\n')[0]}`);
      }
    });
  }

  logToBoth('');
  logToBoth('='.repeat(70));
}

/**
 * Print detailed error report
 */
export function printDetailedErrors(
  failed: Array<{ file: string; error: string; errorLine?: number; duration: number; fullContent?: string }>,
  fixturesDir?: string
): void {
  if (failed.length === 0) return;

  logToBoth('');
  logToBoth('FAILED FILES - DETAILED ERROR REPORT');
  logToBoth('='.repeat(70));

  failed.forEach(r => {
    const fullPath = fixturesDir ? path.join(fixturesDir, r.file) : r.file;
    formatErrorWithContext(fullPath, r.error, r.errorLine, r.duration, r.fullContent);
  });
}
