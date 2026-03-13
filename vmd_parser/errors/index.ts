/**
 * VMD Error Handling Module
 * Central export point for all error handling functionality
 */

// Error codes and types
export {
  VmdErrorCode,
  VmdErrorSeverity
} from './error_codes.ts';
export type { ErrorLocation } from './error_codes.ts';

// Error class
export { VmdError } from './vmd_error.ts';

// Error messages
export { ErrorMessages } from './error_messages.ts';

// Error reporter
export { ErrorReporter, globalErrorReporter } from './error_reporter.ts';

// Helper functions
export {
  createVmdError,
  isVmdError,
  wrapError
} from './helpers.ts';
