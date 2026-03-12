/**
 * VMD Parser Unified Error Handling Module
 * Provides standardized error types, error codes, and error reporting format
 */

import path from 'path';

// Project root for resolving absolute paths
const PROJECT_ROOT = process.cwd();

/**
 * Error Code Enum - defines all possible error types
 */
export enum VmdErrorCode {
  // System errors (1xxx)
  UNKNOWN_ERROR = 'E1000',
  CONFIG_ERROR = 'E1001',
  FILE_SYSTEM_ERROR = 'E1002',

  // Frontmatter errors (2xxx)
  FRONTMATTER_PARSE_ERROR = 'E2000',
  FRONTMATTER_MISSING_REQUIRED = 'E2001',
  FRONTMATTER_INVALID_VALUE = 'E2002',
  FRONTMATTER_INVALID_FORMAT = 'E2003',

  // Markdown compilation errors (3xxx)
  MARKDOWN_COMPILE_ERROR = 'E3000',
  MARKDOWN_SYNTAX_ERROR = 'E3001',
  MARKDOWN_NESTED_CODE_BLOCK = 'E3002',
  MARKDOWN_XSS_DETECTED = 'E3003',
  MARKDOWN_EMPTY_MARKUP = 'E3004',
  MARKDOWN_SINGLE_BACKTICK_CODEBLOCK = 'E3005',
  MARKDOWN_INVALID_TAG_NESTING = 'E3006',

  // Extension syntax errors (4xxx)
  EXTENSION_POST_MISSING_TAGS = 'E4000',
  EXTENSION_POST_INVALID_CONTENT = 'E4001',
  EXTENSION_POST_MISSING_IMAGE = 'E4002',
  EXTENSION_POST_MISSING_ALT = 'E4003',
  EXTENSION_CUSTOM_BLOCK_ERROR = 'E4004',
  EXTENSION_POST_INVALID_FORMAT = 'E4005',
  EXTENSION_POST_LFT_INVALID_TAG = 'E4006',
  EXTENSION_POST_RT_INVALID_SPACING = 'E4007',
  EXTENSION_POST_LFT_CODE_BLOCK = 'E4008',
  EXTENSION_POST_LFT_DISALLOWED_TAG = 'E4009',
  EXTENSION_POST_LFT_BLOCK_MATH = 'E4010',
  EXTENSION_POST_LFT_IMAGE = 'E4011',
  EXTENSION_POST_LFT_BLOCKQUOTE = 'E4012',
  EXTENSION_POST_LFT_INVALID_SPACING = 'E4013',
  EXTENSION_EMPTY_CUSTOM_BLOCK = 'E4014',

  // Asset processing errors (5xxx)
  ASSET_PROCESS_ERROR = 'E5000',
  IMAGE_NOT_FOUND = 'E5001',
  IMAGE_PROCESS_FAILED = 'E5002',
  CODE_FILE_WRITE_ERROR = 'E5003',

  // Site build errors (6xxx)
  BUILD_ERROR = 'E6000',
  BUILD_MISSING_H1 = 'E6001',
  BUILD_MISSING_CUSTOM_TSX = 'E6002',
  BUILD_INVALID_PATH = 'E6003',
}

/**
 * Error Severity Level
 */
export enum VmdErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Error Location Information
 */
export interface ErrorLocation {
  file?: string;
  line?: number;
  column?: number;
}

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

/**
 * Error Message Templates
 */
export const ErrorMessages: Record<VmdErrorCode, (details?: Record<string, any>) => string> = {
  [VmdErrorCode.UNKNOWN_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Unknown error${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.CONFIG_ERROR]: (d) => `Configuration error: ${d?.message || 'Invalid configuration'}`,
  [VmdErrorCode.FILE_SYSTEM_ERROR]: (d) => `File system error: ${d?.message || 'Cannot access file'}`,

  [VmdErrorCode.FRONTMATTER_PARSE_ERROR]: (d) => `Frontmatter parse failed`,
  [VmdErrorCode.FRONTMATTER_MISSING_REQUIRED]: (d) =>
    `Missing required frontmatter attributes: ${d?.fields?.join(', ') || 'unknown fields'}`,
  [VmdErrorCode.FRONTMATTER_INVALID_VALUE]: (d) =>
    `Invalid value for frontmatter attribute '${d?.field}': ${d?.value}`,
  [VmdErrorCode.FRONTMATTER_INVALID_FORMAT]: (d) =>
    `Invalid frontmatter format: ${d?.message}`,

  [VmdErrorCode.MARKDOWN_COMPILE_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Markdown compilation failed${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.MARKDOWN_SYNTAX_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Markdown syntax error${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.MARKDOWN_NESTED_CODE_BLOCK]: (d) =>
    `Nested code block detected at line ${d?.line}. Code blocks cannot be nested within other code blocks.`,
  [VmdErrorCode.MARKDOWN_XSS_DETECTED]: (d) =>
    `XSS attack pattern '${d?.pattern}' detected in math formula: ${d?.formula || ''}`,
  [VmdErrorCode.MARKDOWN_EMPTY_MARKUP]: (d) =>
    `Empty ${d?.type} element detected (${d?.count || 1} occurrence${d?.count > 1 ? 's' : ''})`,
  [VmdErrorCode.MARKDOWN_SINGLE_BACKTICK_CODEBLOCK]: (d) =>
    `Single backtick code block is not allowed for VMD compiler. Use triple backticks (\`\`\`) for code blocks at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING]: (d) =>
    `Invalid tag nesting: <${d?.outerTag}> cannot contain <${d?.innerTag}> at line ${d?.line || 'unknown'}`,

  [VmdErrorCode.EXTENSION_POST_MISSING_TAGS]: (d) =>
    `Post block must contain both <lft> and <rt> tags`,
  [VmdErrorCode.EXTENSION_POST_INVALID_CONTENT]: (d) =>
    `Post <rt> only allows images, found content: '${d?.content}'`,
  [VmdErrorCode.EXTENSION_POST_MISSING_IMAGE]: (d) =>
    `Post <rt> must contain at least one image`,
  [VmdErrorCode.EXTENSION_POST_MISSING_ALT]: (d) =>
    `Images in Post <rt> must have alt text`,
  [VmdErrorCode.EXTENSION_CUSTOM_BLOCK_ERROR]: (d) =>
    `Custom block <${d?.blockName}> processing failed`,
  [VmdErrorCode.EXTENSION_POST_INVALID_FORMAT]: (d) =>
    `Post block format error: ${d?.message}`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_TAG]: (d) =>
    `Post <lft> contains invalid HTML tag '${d?.tag}'. Only inline code, smallimg, and inline formula are allowed`,
  [VmdErrorCode.EXTENSION_POST_RT_INVALID_SPACING]: (d) =>
    `Post <rt> image spacing error: ${d?.message}`,
  [VmdErrorCode.EXTENSION_POST_LFT_CODE_BLOCK]: (d) =>
    `Post <lft> cannot contain code blocks (\`\`\`). Use inline code (\`...\`) instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_DISALLOWED_TAG]: (d) =>
    `Post <lft> cannot contain <${d?.tag}> tag. <lft> only allows inline content: inline code, inline math ($...$), plain text, links, bold, italic, strike`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCK_MATH]: (d) =>
    `Post <lft> cannot contain block math ($$...$$). Use inline math ($...$) instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_IMAGE]: (d) =>
    `Post <lft> cannot contain images (![...](...)). Images are only allowed in <rt> at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCKQUOTE]: (d) =>
    `Post <lft> cannot contain blockquotes (> ...). Use plain text or inline formatting instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING]: (d) =>
    `Post <lft> spacing error: ${d?.message} at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_EMPTY_CUSTOM_BLOCK]: (d) =>
    `Empty <${d?.blockName || 'custom'}> block detected at line ${d?.line || 'unknown'}. Custom blocks cannot be empty.`,

  [VmdErrorCode.ASSET_PROCESS_ERROR]: (d) => `Asset processing failed: ${d?.asset || 'unknown asset'}`,
  [VmdErrorCode.IMAGE_NOT_FOUND]: (d) => `Image not found: ${d?.imageName || 'unknown image'}`,
  [VmdErrorCode.IMAGE_PROCESS_FAILED]: (d) => `Image processing failed: ${d?.imagePath || 'unknown path'}`,
  [VmdErrorCode.CODE_FILE_WRITE_ERROR]: (d) => `Code file write failed: ${d?.filePath || 'unknown path'}`,

  [VmdErrorCode.BUILD_ERROR]: (d) => `Build failed`,
  [VmdErrorCode.BUILD_MISSING_H1]: (d) => `File missing Markdown H1 heading (# Title)`,
  [VmdErrorCode.BUILD_MISSING_CUSTOM_TSX]: (d) =>
    `has_custom_tsx=true but corresponding TSX file not found: ${d?.expectedPath || ''}`,
  [VmdErrorCode.BUILD_INVALID_PATH]: (d) => `Invalid path: ${d?.path || ''}`,
};

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
