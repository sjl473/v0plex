/**
 * VMD Error Class
 * Standard error class for all VMD parser errors
 */

import path from 'path';
import { VmdErrorCode, VmdErrorSeverity, ErrorLocation } from './error_codes';

// Project root for resolving absolute paths
const PROJECT_ROOT = process.cwd();

/**
 * VMD Standard Error Class
 */
export class VmdError extends Error {
  public readonly code: VmdErrorCode;
  public readonly severity: VmdErrorSeverity;
  public readonly location: ErrorLocation;
  public readonly timestamp: string;
  public readonly originalError?: Error;

  constructor(
    code: VmdErrorCode,
    message: string,
    options: {
      severity?: VmdErrorSeverity;
      location?: ErrorLocation;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'VmdError';
    this.code = code;
    this.severity = options.severity || VmdErrorSeverity.ERROR;
    this.location = options.location || {};
    this.timestamp = new Date().toISOString();
    this.originalError = options.originalError;

    Object.setPrototypeOf(this, VmdError.prototype);
  }

  /**
   * Format error as string
   */
  public format(): string {
    const parts: string[] = [];

    parts.push(`[${this.code}] ${this.severity.toUpperCase()}`);

    if (this.location.file) {
      // Always use absolute path
      const absolutePath = path.isAbsolute(this.location.file)
        ? this.location.file
        : path.resolve(PROJECT_ROOT, this.location.file);
      let locationStr = `  File: ${absolutePath}`;
      if (this.location.line !== undefined) {
        locationStr += `:${this.location.line}`;
        if (this.location.column !== undefined) {
          locationStr += `:${this.location.column}`;
        }
      }
      parts.push(locationStr);
    }

    // Sanitize message
    let sanitizedMessage = this.message.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    parts.push(`  Message: ${sanitizedMessage}`);

    if (this.originalError && this.originalError !== this) {
      let originalMessage = this.originalError.message.replace(
        /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
        'If you have questions, please report to https://github.com/sjl473/v0plex'
      );
      parts.push(`  Original: ${originalMessage}`);
    }

    return parts.join('\n');
  }

  /**
   * Format error with ANSI colors - simplified output
   */
  public formatWithColors(
    red: string,
    yellow: string,
    cyan: string,
    underline: string,
    reset: string
  ): string {
    const parts: string[] = [];
    const isError = this.severity === VmdErrorSeverity.ERROR;
    const color = isError ? red : yellow;

    parts.push(`${color}[${this.code}] ${this.severity.toUpperCase()}${reset}`);

    if (this.location.file) {
      const absolutePath = path.isAbsolute(this.location.file)
        ? this.location.file
        : path.resolve(PROJECT_ROOT, this.location.file);

      let locationStr = `${cyan}${absolutePath}${reset}`;
      if (this.location.line !== undefined) {
        locationStr += ` ${cyan}line ${this.location.line}${reset}`;
      }
      parts.push(locationStr);
    }

    // Sanitize message
    let sanitizedMessage = this.message.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    parts.push(`${sanitizedMessage}`);

    return parts.join('\n');
  }

  /**
   * Convert to JSON object
   */
  public toJSON(): object {
    return {
      code: this.code,
      severity: this.severity,
      message: this.message,
      location: this.location,
      timestamp: this.timestamp,
      originalError: this.originalError?.message,
    };
  }
}
