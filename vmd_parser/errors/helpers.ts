/**
 * Error Helper Functions
 * Convenience functions for working with VMD errors
 */

import { VmdErrorCode, VmdErrorSeverity, ErrorLocation } from './error_codes';
import { VmdError } from './vmd_error';
import { ErrorMessages } from './error_messages';

/**
 * Convenience function to create VmdError
 */
export function createVmdError(
  code: VmdErrorCode,
  details?: Record<string, any>,
  location?: ErrorLocation,
  severity?: VmdErrorSeverity,
  originalError?: Error
): VmdError {
  const message = ErrorMessages[code](details);
  return new VmdError(code, message, {
    severity: severity || VmdErrorSeverity.ERROR,
    location,
    originalError,
  });
}

/**
 * Check if value is VmdError
 */
export function isVmdError(error: unknown): error is VmdError {
  return error instanceof VmdError;
}

/**
 * Wrap unknown error as VmdError
 */
export function wrapError(
  error: unknown,
  code: VmdErrorCode = VmdErrorCode.UNKNOWN_ERROR,
  location?: ErrorLocation
): VmdError {
  if (isVmdError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createVmdError(code, { details: error.message }, location, VmdErrorSeverity.ERROR, error);
  }

  return createVmdError(code, { details: String(error) }, location);
}
