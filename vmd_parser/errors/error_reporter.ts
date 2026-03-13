/**
 * Error Reporter
 * Collects and outputs errors during VMD parsing
 */

import { VmdErrorCode, VmdErrorSeverity, ErrorLocation } from './error_codes';
import { VmdError } from './vmd_error';
import { ErrorMessages } from './error_messages';

/**
 * Error Reporter - collects and outputs errors
 */
export class ErrorReporter {
  private errors: VmdError[] = [];
  private warnings: VmdError[] = [];

  /**
   * Report error
   */
  public report(error: VmdError): void {
    if (error.severity === VmdErrorSeverity.WARNING) {
      this.warnings.push(error);
    } else {
      this.errors.push(error);
    }
  }

  /**
   * Create and report error (convenience method)
   */
  public createError(
    code: VmdErrorCode,
    details?: Record<string, any>,
    location?: ErrorLocation,
    severity?: VmdErrorSeverity
  ): VmdError {
    const message = ErrorMessages[code](details);
    const error = new VmdError(code, message, {
      severity: severity || VmdErrorSeverity.ERROR,
      location,
    });
    this.report(error);
    return error;
  }

  /**
   * Create and report warning (convenience method)
   */
  public createWarning(
    code: VmdErrorCode,
    details?: Record<string, any>,
    location?: ErrorLocation
  ): VmdError {
    const message = ErrorMessages[code](details);
    const error = new VmdError(code, message, {
      severity: VmdErrorSeverity.WARNING,
      location,
    });
    this.report(error);
    return error;
  }

  /**
   * Check if has errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if has warnings
   */
  public hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Get all errors
   */
  public getErrors(): VmdError[] {
    return [...this.errors];
  }

  /**
   * Get all warnings
   */
  public getWarnings(): VmdError[] {
    return [...this.warnings];
  }

  /**
   * Print all reports
   */
  public printReports(): void {
    // ANSI color codes
    const red = '\x1b[31m';
    const yellow = '\x1b[33m';
    const cyan = '\x1b[36m';
    const underline = '\x1b[4m';
    const reset = '\x1b[0m';

    if (this.errors.length > 0) {
      this.errors.forEach((err) => {
        const formatted = err.formatWithColors(red, yellow, cyan, underline, reset);
        console.error(formatted);
        console.error();
      });
    }

    if (this.warnings.length > 0) {
      this.warnings.forEach((warn) => {
        console.warn(warn.format());
        console.warn();
      });
    }
  }

  /**
   * Get summary
   */
  public getSummary(): { errors: number; warnings: number } {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
    };
  }

  /**
   * Clear reports
   */
  public clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}

export const globalErrorReporter = new ErrorReporter();
