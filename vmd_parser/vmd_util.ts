/**
 * ============================================================================
 * vmd_util.ts - VMD Utility Core File
 * ============================================================================
 *
 * This file is the core utility library of the VMD parsing system, consolidating
 * functionality previously scattered across multiple files. Main responsibilities:
 *
 * 1. Defines a complete error code system for standardized error messages
 * 2. Provides utility methods for file operations, image processing, and Git operations
 * 3. Compiles Markdown files into React components
 * 4. Handles multi-language site building
 *
 * The VmdUtil class is stateless (except for temporary data during builds)
 * and can be instantiated multiple times.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { BUILD_CONFIG, SITE_CONFIG, AVAILABLE_LANGUAGES, DEFAULT_LOCALE, CONTENT_SOURCE_CONFIG } from '../config/site.config';

// ============================================================================
// Part 1: Error System
// ============================================================================
//
// Defines error types used throughout the system. Designed with segmented
// error codes:
// - E prefix: General errors
// - V prefix: v0plex-specific errors
//
// Numeric segments:
// - 1xxx: System-level errors
// - 2xxx: Frontmatter related errors
// - 3xxx: Markdown compilation errors
// - 4xxx: Extension syntax errors (Post blocks, tables, etc.)
// - 5xxx: Asset processing errors
// - 6xxx: Build process errors
// - 7xxx: Filesystem operation errors
// - 8xxx: Author format errors
// ============================================================================

/**
 * Error location information
 *
 * Records where an error occurred for easy problem location
 */
export interface ErrorLocation {
  file?: string;    // Path to the file where error occurred
  line?: number;    // Line number (1-based)
  column?: number;  // Column number (1-based)
}

/**
 * Error severity level
 *
 * - error: Critical error, stops the build
 * - warning: Warning, doesn't stop build but needs attention
 * - info: Informational message
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Error code enum
 *
 * Each error has a unique code so users can look up documentation
 */
export enum VmdErrorCode {
  // System-level errors (E1xxx) - lowest level errors
  UNKNOWN_ERROR = 'E1000',
  CONFIG_ERROR = 'E1001',
  FILE_SYSTEM_ERROR = 'E1002',

  // Configuration errors (V0xxx) - site configuration related
  CONFIG_PARSE_ERROR = 'V0001',
  CONFIG_MISSING_REPO_URL = 'V0002',
  CONFIG_INVALID_BRANCH_NAME = 'V0003',

  // Git operation errors (V1xxx)
  GIT_CLONE_FAILED = 'V1000',
  GIT_CHECKOUT_FAILED = 'V1001',
  GIT_DELETE_FAILED = 'V1002',
  GIT_NOT_AVAILABLE = 'V1003',

  // dev folder errors (V2xxx)
  DEV_FOLDER_NOT_FOUND = 'V2000',
  DEV_FOLDER_NO_LANGUAGE = 'V2001',
  DEV_FOLDER_NO_FILES = 'V2002',
  DEV_FOLDER_INVALID_STRUCTURE = 'V2003',
  DEV_FOLDER_MISSING_REQUIRED_LANGUAGE = 'V2004',
  DEV_FOLDER_EXTRA_LANGUAGE = 'V2005',

  // Frontmatter errors (E2xxx) - metadata at the head of Markdown files
  FRONTMATTER_PARSE_ERROR = 'E2000',
  FRONTMATTER_MISSING_REQUIRED = 'E2001',
  FRONTMATTER_INVALID_VALUE = 'E2002',
  FRONTMATTER_INVALID_FORMAT = 'E2003',
  FRONTMATTER_INVALID_AUTHOR_FORMAT = 'E2004',

  // Markdown compilation errors (E3xxx)
  MARKDOWN_COMPILE_ERROR = 'E3000',
  MARKDOWN_SYNTAX_ERROR = 'E3001',
  MARKDOWN_NESTED_CODE_BLOCK = 'E3002',
  MARKDOWN_XSS_DETECTED = 'E3003',
  MARKDOWN_EMPTY_MARKUP = 'E3004',
  MARKDOWN_SINGLE_BACKTICK_CODEBLOCK = 'E3005',
  MARKDOWN_INVALID_TAG_NESTING = 'E3006',

  // Extension syntax errors (E4xxx) - VMD-specific extensions
  EXTENSION_POST_MISSING_TAGS = 'E4000',
  EXTENSION_POST_INVALID_CONTENT = 'E4001',
  EXTENSION_POST_MISSING_IMAGE = 'E4002',
  EXTENSION_POST_MISSING_ALT = 'E4003',
  EXTENSION_CUSTOM_BLOCK_ERROR = 'E4004',
  EXTENSION_POST_INVALID_FORMAT = 'E4005',
  EXTENSION_POST_LFT_INVALID_TAG = 'E4006',
  EXTENSION_POST_LFT_INVALID_SPACING = 'E4007',
  EXTENSION_POST_LFT_CODE_BLOCK = 'E4008',
  EXTENSION_POST_LFT_DISALLOWED_TAG = 'E4009',
  EXTENSION_POST_LFT_BLOCK_MATH = 'E4010',
  EXTENSION_POST_LFT_IMAGE = 'E4011',
  EXTENSION_POST_LFT_BLOCKQUOTE = 'E4012',
  EXTENSION_POST_LFT_INVALID_SPACING_DUPLICATE = 'E4013',
  EXTENSION_EMPTY_CUSTOM_BLOCK = 'E4014',

  // Table errors (E41xx) - tables cannot contain certain block elements
  TABLE_INVALID_CONTENT = 'E4100',
  TABLE_DISALLOWED_BLOCK_ELEMENT = 'E4101',
  TABLE_DISALLOWED_IMAGE = 'E4102',
  TABLE_DISALLOWED_LIST = 'E4103',
  TABLE_DISALLOWED_BLOCKQUOTE = 'E4104',
  TABLE_DISALLOWED_CODE_BLOCK = 'E4105',
  TABLE_DISALLOWED_BLOCK_MATH = 'E4106',
  TABLE_INVALID_FORMAT = 'E4107',

  // Asset processing errors (E5xxx)
  ASSET_PROCESS_ERROR = 'E5000',
  IMAGE_NOT_FOUND = 'E5001',
  IMAGE_PROCESS_FAILED = 'E5002',
  CODE_FILE_WRITE_ERROR = 'E5003',

  // Build errors (E6xxx)
  BUILD_ERROR = 'E6000',
  BUILD_MISSING_H1 = 'E6001',
  BUILD_MISSING_CUSTOM_TSX = 'E6002',
  BUILD_INVALID_PATH = 'E6003',
  BUILD_GIT_NOT_AVAILABLE = 'E6004',
  BUILD_INVALID_LANGUAGE_FOLDER = 'E6005',
  BUILD_I18N_PREFIX_MISMATCH = 'E6006',

  // Filesystem operation errors (E7xxx)
  FS_CLEAN_FAILED = 'E7000',
  FS_DELETE_FILE_FAILED = 'E7001',
  FS_CREATE_DIR_FAILED = 'E7002',
  FS_RESET_DIR_FAILED = 'E7003',
  FS_READ_FILE_FAILED = 'E7004',
  FS_WRITE_FILE_FAILED = 'E7005',
  FS_WRITE_SITE_DATA_FAILED = 'E7006',

  // Author format errors (E8xxx)
  AUTHOR_LIST_EMPTY = 'E8000',
  AUTHOR_MULTIPLE_GIT_PLACEHOLDER = 'E8001',
  AUTHOR_INVALID_ENTRY_FORMAT = 'E8002',
  AUTHOR_NAME_EMPTY = 'E8003',
  AUTHOR_DUPLICATE_EMAIL = 'E8004',
  AUTHOR_DUPLICATE_URL = 'E8005',
  AUTHOR_INVALID_EMAIL_OR_URL = 'E8006',
  AUTHOR_EMPTY_ENTRY = 'E8007',
}

/**
 * Error message mapping table
 *
 * Each error code maps to a message generator function that can dynamically
 * generate specific error messages based on the details object
 */
export const ErrorMessages: Record<VmdErrorCode, (details?: Record<string, any>) => string> = {
  // System errors
  [VmdErrorCode.UNKNOWN_ERROR]: (d) => `Unknown error${d?.details ? `: ${d.details}` : ''}`,
  [VmdErrorCode.CONFIG_ERROR]: (d) => `Configuration error: ${d?.message || 'Invalid configuration'}`,
  [VmdErrorCode.FILE_SYSTEM_ERROR]: (d) => `Filesystem error: ${d?.message || 'Unable to access file'}`,

  // Configuration errors
  [VmdErrorCode.CONFIG_PARSE_ERROR]: (d) => `Failed to parse configuration: ${d?.message || 'Unknown error'}`,
  [VmdErrorCode.CONFIG_MISSING_REPO_URL]: (d) => `REPO_URL is required when USE_LOCAL_MARKDOWN is false. Please specify the git repository URL in config/site.config.ts`,
  [VmdErrorCode.CONFIG_INVALID_BRANCH_NAME]: (d) => `Branch name "${d?.branch}" contains invalid characters. Branch names can only contain letters, numbers, hyphens, underscores, dots, and slashes.`,

  // Git operation errors
  [VmdErrorCode.GIT_CLONE_FAILED]: (d) => `Failed to clone repository from ${d?.repoUrl || 'unknown address'}`,
  [VmdErrorCode.GIT_CHECKOUT_FAILED]: (d) => `Failed to checkout commit ${d?.commitHash || 'unknown'}`,
  [VmdErrorCode.GIT_DELETE_FAILED]: (d) => `Failed to delete dev folder: ${d?.message || 'Unknown error'}`,
  [VmdErrorCode.GIT_NOT_AVAILABLE]: (d) => `Git is not available. Please ensure Git is installed and added to your system PATH.`,

  // dev folder errors
  [VmdErrorCode.DEV_FOLDER_NOT_FOUND]: (d) => `dev folder does not exist`,
  [VmdErrorCode.DEV_FOLDER_NO_LANGUAGE]: (d) => `dev folder must contain at least one language folder (e.g., "en", "zh")`,
  [VmdErrorCode.DEV_FOLDER_NO_FILES]: (d) => `dev folder must contain at least one file (cannot be folders only)`,
  [VmdErrorCode.DEV_FOLDER_INVALID_STRUCTURE]: (d) => `Invalid dev folder structure. Remote mode requires: dev/{language}/... format where language must be one of the configured valid languages`,
  [VmdErrorCode.DEV_FOLDER_MISSING_REQUIRED_LANGUAGE]: (d) => `Missing required language folder(s): ${d?.missing?.join(', ')}. Configuration requires: ${d?.required?.join(', ')}`,
  [VmdErrorCode.DEV_FOLDER_EXTRA_LANGUAGE]: (d) => `Found unconfigured language folder(s): ${d?.extra?.join(', ')}. Allowed languages: ${d?.allowed?.join(', ')}`,

  // Frontmatter errors
  [VmdErrorCode.FRONTMATTER_PARSE_ERROR]: (d) => `Failed to parse frontmatter`,
  [VmdErrorCode.FRONTMATTER_MISSING_REQUIRED]: (d) => `Missing required frontmatter attribute(s): ${d?.fields?.join(', ') || 'unknown fields'}`,
  [VmdErrorCode.FRONTMATTER_INVALID_VALUE]: (d) => `Invalid value for frontmatter attribute '${d?.field}': ${d?.value}`,
  [VmdErrorCode.FRONTMATTER_INVALID_FORMAT]: (d) => `Invalid frontmatter format: ${d?.message}`,
  [VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT]: (d) => `Invalid author format: ${d?.message}. Expected format: "Name1 | Name2 | Name->email@example.com"`,

  // Markdown compilation errors
  [VmdErrorCode.MARKDOWN_COMPILE_ERROR]: (d) => `Markdown compilation failed${d?.details ? `: ${d.details}` : ''}`,
  [VmdErrorCode.MARKDOWN_SYNTAX_ERROR]: (d) => `Markdown syntax error${d?.details ? `: ${d.details}` : ''}`,
  [VmdErrorCode.MARKDOWN_NESTED_CODE_BLOCK]: (d) => `Nested code block detected at line ${d?.line}. Code blocks cannot be nested inside other code blocks.`,
  [VmdErrorCode.MARKDOWN_XSS_DETECTED]: (d) => `XSS attack pattern '${d?.pattern}' detected in math formula: ${d?.formula || ''}`,
  [VmdErrorCode.MARKDOWN_EMPTY_MARKUP]: (d) => `Empty ${d?.type} element(s) detected (${d?.count || 1} occurrence(s))`,
  [VmdErrorCode.MARKDOWN_SINGLE_BACKTICK_CODEBLOCK]: (d) => `Single backtick code blocks are not allowed in VMD compiler. At line ${d?.line || 'unknown'}, please use triple backticks (\`\`\`) for code blocks.`,
  [VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING]: (d) => `Invalid tag nesting: <${d?.outerTag}> cannot contain <${d?.innerTag}>, location: line ${d?.line || 'unknown'}`,

  // Extension syntax errors
  [VmdErrorCode.EXTENSION_POST_MISSING_TAGS]: (d) => `Post block must contain both <lft> and <rt> tags`,
  [VmdErrorCode.EXTENSION_POST_INVALID_CONTENT]: (d) => {
    if (d?.type === 'text_not_allowed') return `Post <rt> can only contain images, no other text is allowed`;
    if (d?.type === 'missing_newline_between_images') return `Each image in Post <rt> must be on its own line`;
    if (d?.type === 'text_between_images') return `Post <rt> can only contain images, no text allowed between images`;
    if (d?.type === 'missing_alt') return `Image is missing alt text`;
    if (d?.type === 'text_after_image') return `Post <rt> can only contain images, text found on same line as image`;
    return `Post <rt> only allows images, found content: '${d?.content || 'unknown'}'`;
  },
  [VmdErrorCode.EXTENSION_POST_MISSING_IMAGE]: (d) => `Post <rt> must contain at least one image`,
  [VmdErrorCode.EXTENSION_POST_MISSING_ALT]: (d) => `Images in Post <rt> must have alt text`,
  [VmdErrorCode.EXTENSION_CUSTOM_BLOCK_ERROR]: (d) => `Custom block <${d?.blockName}> processing failed`,
  [VmdErrorCode.EXTENSION_POST_INVALID_FORMAT]: (d) => {
    if (d?.type === 'post_to_lft_spacing') return `Exactly one space or newline is required between <post> and <lft>`;
    if (d?.type === 'lft_to_rt_spacing') return `Exactly one space or newline is required between </lft> and <rt>`;
    if (d?.type === 'rt_to_post_spacing') return `Exactly one space or newline is required between </rt> and </post>`;
    return `Post block format error`;
  },
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_TAG]: (d) => `Post <lft> contains invalid HTML tag '${d?.tag}'. Only inline code, smallimg, and inline math are allowed`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING]: (d) => {
    if (d?.type === 'no_images') return `No images found in <rt> section`;
    if (d?.type === 'after_rt') return `Empty line required after <rt>`;
    if (d?.type === 'before_rt') return `Empty line required before </rt>`;
    return `Post <rt> image spacing error`;
  },
  [VmdErrorCode.EXTENSION_POST_LFT_CODE_BLOCK]: (d) => `Code blocks are not allowed inside <post> blocks${d?.line ? ` (at line ${d.line})` : ''}`,
  [VmdErrorCode.EXTENSION_POST_LFT_DISALLOWED_TAG]: (d) => `Tag <${d?.tag}> is not allowed inside <post> blocks${d?.line ? ` (at line ${d.line})` : ''}`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCK_MATH]: (d) => `Block-level math is not allowed inside <post> blocks${d?.line ? ` (at line ${d.line})` : ''}`,
  [VmdErrorCode.EXTENSION_POST_LFT_IMAGE]: (d) => `Regular images are not allowed inside <lft>, please use <smallimg>${d?.line ? ` (at line ${d.line})` : ''}`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCKQUOTE]: (d) => `Blockquotes are not allowed inside <post> blocks${d?.line ? ` (at line ${d.line})` : ''}`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING_DUPLICATE]: (d) => `Invalid Post block spacing`,
  [VmdErrorCode.EXTENSION_EMPTY_CUSTOM_BLOCK]: (d) => `Empty custom block detected`,

  // Table errors
  [VmdErrorCode.TABLE_INVALID_CONTENT]: (d) => `Invalid table content`,
  [VmdErrorCode.TABLE_DISALLOWED_BLOCK_ELEMENT]: (d) => `Block elements are not allowed inside tables`,
  [VmdErrorCode.TABLE_DISALLOWED_IMAGE]: (d) => `Images are not allowed inside tables`,
  [VmdErrorCode.TABLE_DISALLOWED_LIST]: (d) => `Lists are not allowed inside tables`,
  [VmdErrorCode.TABLE_DISALLOWED_BLOCKQUOTE]: (d) => `Blockquotes are not allowed inside tables`,
  [VmdErrorCode.TABLE_DISALLOWED_CODE_BLOCK]: (d) => `Code blocks are not allowed inside tables`,
  [VmdErrorCode.TABLE_DISALLOWED_BLOCK_MATH]: (d) => `Block-level math is not allowed inside tables`,
  [VmdErrorCode.TABLE_INVALID_FORMAT]: (d) => `Invalid table format`,

  // Asset processing errors
  [VmdErrorCode.ASSET_PROCESS_ERROR]: (d) => `Asset processing error: ${d?.message}`,
  [VmdErrorCode.IMAGE_NOT_FOUND]: (d) => `Image not found: "${d?.imageName || d?.imagePath}"${d?.searchedPaths ? '\n  Searched paths: ' + d.searchedPaths.join(', ') : ''}`,
  [VmdErrorCode.IMAGE_PROCESS_FAILED]: (d) => `Failed to process image "${d?.imagePath}": ${d?.details}`,
  [VmdErrorCode.CODE_FILE_WRITE_ERROR]: (d) => `Failed to write code file "${d?.filePath}": ${d?.details}`,

  // Build errors
  [VmdErrorCode.BUILD_ERROR]: (d) => `Build error: ${d?.details}`,
  [VmdErrorCode.BUILD_MISSING_H1]: (d) => `Markdown file must start with a level 1 heading (# Title)`,
  [VmdErrorCode.BUILD_MISSING_CUSTOM_TSX]: (d) => `Missing custom TSX file: "${d?.expectedPath}" (frontmatter has has_custom_tsx: true)`,
  [VmdErrorCode.BUILD_INVALID_PATH]: (d) => `Invalid build path: "${d?.path}"`,
  [VmdErrorCode.BUILD_GIT_NOT_AVAILABLE]: (d) => `Git is not available. Please install git or remove the @git placeholder from frontmatter.`,
  [VmdErrorCode.BUILD_INVALID_LANGUAGE_FOLDER]: (d) => `Invalid language folder found: "${d?.invalidFolders}". Valid folders: ${d?.validFolders}`,
  [VmdErrorCode.BUILD_I18N_PREFIX_MISMATCH]: (d) => `i18n prefix mismatch: "${d?.prefixPath}" exists in [${d?.pageLocales}] but missing [${d?.missingLocales}]. Configured languages: [${d?.configuredLocales}]`,

  // Filesystem operation errors
  [VmdErrorCode.FS_CLEAN_FAILED]: (d) => `Failed to clean directory: ${d?.error}`,
  [VmdErrorCode.FS_DELETE_FILE_FAILED]: (d) => `Failed to delete file "${d?.file}": ${d?.error}`,
  [VmdErrorCode.FS_CREATE_DIR_FAILED]: (d) => `Failed to create directory "${d?.dir}": ${d?.error}`,
  [VmdErrorCode.FS_RESET_DIR_FAILED]: (d) => `Failed to reset directory "${d?.dir}": ${d?.error}`,
  [VmdErrorCode.FS_READ_FILE_FAILED]: (d) => `Failed to read file: ${d?.error || 'Unknown error'}`,
  [VmdErrorCode.FS_WRITE_FILE_FAILED]: (d) => `Failed to write file: ${d?.error || 'Unknown error'}`,
  [VmdErrorCode.FS_WRITE_SITE_DATA_FAILED]: (d) => `Failed to write site data: ${d?.error}`,

  // Author format errors
  [VmdErrorCode.AUTHOR_LIST_EMPTY]: (d) => `Author list is empty`,
  [VmdErrorCode.AUTHOR_MULTIPLE_GIT_PLACEHOLDER]: (d) => `Multiple @git placeholders found in author list (maximum 1 allowed)`,
  [VmdErrorCode.AUTHOR_INVALID_ENTRY_FORMAT]: (d) => `Invalid author format: "${d?.author}". Please use "Name->email@example.com" or "Name" or "@git"`,
  [VmdErrorCode.AUTHOR_NAME_EMPTY]: (d) => `Author name cannot be empty`,
  [VmdErrorCode.AUTHOR_DUPLICATE_EMAIL]: (d) => `Duplicate email found in author list`,
  [VmdErrorCode.AUTHOR_DUPLICATE_URL]: (d) => `Duplicate URL found in author list`,
  [VmdErrorCode.AUTHOR_INVALID_EMAIL_OR_URL]: (d) => `Invalid email or URL format`,
  [VmdErrorCode.AUTHOR_EMPTY_ENTRY]: (d) => `Author entry is empty`,
};

/**
 * VMD Error class
 *
 * Extends the standard Error class with error codes, location information,
 * timestamps, etc. Provides formatted output methods for debugging and logging.
 */
export class VmdError extends Error {
  public readonly code: VmdErrorCode;
  public readonly location: ErrorLocation;
  public readonly timestamp: string;
  public readonly originalError?: Error;
  public readonly severity: ErrorSeverity;

  constructor(
    code: VmdErrorCode,
    message: string,
    options: {
      location?: ErrorLocation;
      originalError?: Error;
      severity?: ErrorSeverity;
    } = {}
  ) {
    super(message);
    this.name = 'VmdError';
    this.code = code;
    this.location = options.location || {};
    this.timestamp = new Date().toISOString();
    this.originalError = options.originalError;
    this.severity = options.severity || 'error';

    // This line fixes TypeScript prototype chain issues when extending Error
    Object.setPrototypeOf(this, VmdError.prototype);
  }

  /**
   * Format error as string
   *
   * Output format:
   * [ERROR_CODE] SEVERITY: Error message
   *   File: /absolute/path/to/file:line:column
   *   URL: file:///absolute/path/to/file
   *   Original: Original error message
   */
  public format(): string {
    const parts: string[] = [];
    parts.push(`[${this.code}] ${this.severity.toUpperCase()}: ${this.message}`);

    if (this.location.file) {
      // Ensure absolute path for clickable links
      const absolutePath = path.isAbsolute(this.location.file)
        ? this.location.file
        : path.resolve(process.cwd(), this.location.file);
      let locationStr = `  File: ${absolutePath}`;
      if (this.location.line !== undefined) {
        locationStr += `:${this.location.line}`;
        if (this.location.column !== undefined) {
          locationStr += `:${this.location.column}`;
        }
      }
      parts.push(locationStr);
      parts.push(`  URL: file://${absolutePath}`);
    }

    if (this.originalError && this.originalError !== this) {
      parts.push(`  Original: ${this.originalError.message}`);
    }

    return parts.join('\n');
  }

  /**
   * Format with context
   *
   * Displays Markdown source context around the error location.
   * Shows a few lines before and after the error line, with the error line
   * marked with ">>>".
   */
  public formatWithContext(fullContent?: string): string {
    const lines: string[] = [];
    lines.push('');
    lines.push(`File: ${this.location.file ? path.basename(this.location.file) : 'unknown'}`);
    lines.push('-'.repeat(70));

    if (this.location.file) {
      const absolutePath = path.isAbsolute(this.location.file)
        ? this.location.file
        : path.resolve(process.cwd(), this.location.file);
      lines.push(`Markdown source: file://${absolutePath}`);
    }

    if (this.location.line && this.location.line > 0) {
      lines.push(`Error location: line ${this.location.line}`);
    }

    lines.push('');
    lines.push(`Error message:`);
    lines.push(`  ${this.message.replace(/\n/g, '\n  ')}`);

    // Display Markdown context
    if (this.location.file && this.location.line && this.location.line > 0) {
      try {
        const content = fullContent || fs.readFileSync(this.location.file, 'utf-8');
        const fileLines = content.split('\n');
        // Show 4 lines before to 3 lines after the error line
        const startContext = Math.max(0, this.location.line - 4);
        const endContext = Math.min(fileLines.length, this.location.line + 3);

        lines.push('');
        lines.push('Markdown context:');
        lines.push('-'.repeat(70));

        for (let i = startContext; i < endContext; i++) {
          const isErrorLine = i === this.location.line - 1;
          const prefix = isErrorLine ? '>>> ' : '    ';
          const lineNum = (i + 1).toString().padStart(3);
          lines.push(`${prefix}${lineNum} | ${fileLines[i]}`);
        }

        if (endContext < fileLines.length) {
          lines.push(`    ... (${fileLines.length - endContext} more lines)`);
        }
      } catch {
        // Ignore read failures
      }
    }

    lines.push('');
    lines.push('='.repeat(70));
    return lines.join('\n');
  }

  /**
   * Convert to JSON object
   *
   * Used for logging output or API responses
   */
  public toJSON(): object {
    return {
      code: this.code,
      message: this.message,
      location: this.location,
      timestamp: this.timestamp,
      severity: this.severity,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Convenience function to create VmdError
 */
export function createVmdError(
  code: VmdErrorCode,
  details?: Record<string, any>,
  location?: ErrorLocation,
  originalError?: Error
): VmdError {
  const message = ErrorMessages[code](details);
  return new VmdError(code, message, { location, originalError });
}

/**
 * Check if error is VmdError
 */
export function isVmdError(error: unknown): error is VmdError {
  return error instanceof VmdError;
}

/**
 * Wrap unknown error as VmdError
 *
 * Returns directly if already a VmdError, otherwise creates a new VmdError
 */
export function wrapError(
  error: unknown,
  code: VmdErrorCode = VmdErrorCode.UNKNOWN_ERROR,
  location?: ErrorLocation
): VmdError {
  if (isVmdError(error)) return error;
  if (error instanceof Error) {
    return createVmdError(code, { details: error.message }, location, error);
  }
  return createVmdError(code, { details: String(error) }, location);
}

// ============================================================================
// Part 2: Type Definitions
// ============================================================================
//
// Core data structures used throughout the system.
// ============================================================================

/**
 * Frontmatter attributes
 *
 * YAML-formatted metadata at the head of Markdown files, parsed as key-value pairs
 */
export interface FrontMatterAttributes {
  [key: string]: string | undefined;
}

/**
 * Frontmatter parse result
 */
export interface ParseResult {
  attributes: FrontMatterAttributes;  // Parsed attributes
  body: string;                        // Content without frontmatter
  frontmatterLineCount: number;        // Number of lines frontmatter occupies
}

/**
 * Navigation node
 *
 * Represents a node in the site navigation tree, can be folder, page, or section
 */
export interface NavigationNode {
  title: string;           // Display title
  type: 'section' | 'page' | 'folder';  // Node type
  path?: string;           // Page path (e.g., /abc123)
  hash?: string;           // Path hash value
  hasCustomTsx?: boolean;  // Whether has custom TSX
  mdPath?: string;         // Markdown source file path
  tsxPath?: string;        // Generated TSX file path
  codeFiles?: { originalPath: string; hashPath: string }[];  // Associated code files
  images?: { originalName: string; hashPath: string }[];     // Associated images
  tags?: string[];         // Tags
  locale?: string;         // Language code
  languageLinks?: Record<string, string>;  // Links to other language versions
  prefixId?: string;       // Prefix ID (for multi-language matching)
  children: NavigationNode[];  // Child nodes
}

/**
 * Site data
 *
 * Site-wide metadata, written to JSON file for frontend use
 */
export interface SiteData {
  navigation: NavigationNode[];      // Navigation tree
  images: { originalPath: string; hashPath: string }[];  // All images
  availableLocales: string[];        // Available language list
  defaultLocale: string;             // Default language
}

// ============================================================================
// Part 3: VmdUtil Main Class
// ============================================================================
//
// This is the core class of the system, providing:
// - Error management
// - File operations
// - Image processing
// - Git operations
// - Frontmatter parsing
// - Site building
// etc.
// ============================================================================

export class VmdUtil {
  // Project root directory
  private projectRoot: string;
  // Collected error list
  private errors: VmdError[] = [];
  // Image name to hash name mapping
  private imageMap: Record<string, string> = {};
  // Site-wide image list
  private siteImages: { originalPath: string; hashPath: string }[] = [];
  // Generated TSX file set (to avoid duplicate processing)
  private generatedTsxFiles = new Set<string>();
  // Navigation tree
  private navigation: NavigationNode[] = [];
  // Whether in remote Git mode
  private isRemoteGitMode = false;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.isRemoteGitMode = !CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN;
  }

  // ========================================================================
  // Module 1: Error Management
  // ========================================================================

  /**
   * Create error
   *
   * Creates a VmdError and optionally adds it to the error list
   */
  public createError(
    code: VmdErrorCode,
    details?: Record<string, any>,
    location?: ErrorLocation,
    options?: { report?: boolean; originalError?: Error }
  ): VmdError {
    const message = ErrorMessages[code](details);
    const error = new VmdError(code, message, { location, originalError: options?.originalError });
    // By default adds to error list
    if (options?.report !== false) this.errors.push(error);
    return error;
  }

  /**
   * Get error status
   *
   * @param options.print Whether to print all errors
   * @param options.clear Whether to clear error list
   */
  public getErrorStatus(options?: { print?: boolean; clear?: boolean }): { hasErrors: boolean; count: number; errors: VmdError[] } {
    const result = { hasErrors: this.errors.length > 0, count: this.errors.length, errors: [...this.errors] };
    if (options?.print && this.errors.length > 0) {
      this.errors.forEach(e => console.error(e.format()));
    }
    if (options?.clear) this.errors = [];
    return result;
  }

  // ========================================================================
  // Module 2: Filesystem and Directory Operations
  // ========================================================================

  /**
   * Unified file operation entry point
   *
   * Supports read, write, and ensureDir operations.
   * Automatically handles errors, returns null or false on failure.
   */
  public fileOperation(
    operation: 'read' | 'write' | 'ensureDir',
    filePath: string,
    content?: string,
    encoding: BufferEncoding = 'utf8'
  ): string | boolean | null {
    try {
      switch (operation) {
        case 'read':
          return fs.readFileSync(filePath, encoding);
        case 'write':
          if (content === undefined) throw new Error('Write operation requires content');
          fs.writeFileSync(filePath, content);
          return true;
        case 'ensureDir':
          if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
          return true;
      }
    } catch (err) {
      const code = operation === 'read' ? VmdErrorCode.FS_READ_FILE_FAILED :
                   operation === 'write' ? VmdErrorCode.FS_WRITE_FILE_FAILED :
                   VmdErrorCode.FS_CREATE_DIR_FAILED;
      this.createError(code, { file: filePath, dir: filePath, error: err instanceof Error ? err.message : String(err) }, { file: filePath });
      return operation === 'read' ? null : false;
    }
  }

  /**
   * Clean build output directories
   *
   * Empties vmdcode, vmdimage, vmdjson directories and page output directory
   */
  public cleanBuildOutput(): void {
    console.log('Starting build output cleanup...');
    const publicPath = path.join(this.projectRoot, BUILD_CONFIG.PUBLIC_DIR);
    const appPath = path.join(this.projectRoot, BUILD_CONFIG.APP_DIR);

    // Clean three resource directories
    [BUILD_CONFIG.VMD_CODE_DIR, BUILD_CONFIG.VMD_IMAGE_DIR, BUILD_CONFIG.VMD_JSON_DIR].forEach(dir => {
      this.resetDirectory(path.join(publicPath, dir));
    });
    // Clean page output directory
    this.resetDirectory(path.join(appPath, BUILD_CONFIG.OUT_DIR));
    console.log('Cleanup complete.');
  }

  /**
   * Reset directory
   *
   * Deletes directory contents but keeps the directory itself.
   * Creates if directory doesn't exist.
   */
  private resetDirectory(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
          const filePath = path.join(dirPath, file);
          try {
            fs.rmSync(filePath, { recursive: true, force: true });
          } catch (err) {
            throw this.createError(VmdErrorCode.FS_DELETE_FILE_FAILED,
              { file: filePath, error: err instanceof Error ? err.message : String(err) }, { file: filePath }, { report: false });
          }
        });
      } else {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (err) {
      if (err instanceof VmdError) throw err;
      throw this.createError(VmdErrorCode.FS_RESET_DIR_FAILED,
        { dir: dirPath, error: err instanceof Error ? err.message : String(err) }, { file: dirPath }, { report: false });
    }
  }

  /**
   * Scan directory for images
   *
   * Recursively scans directory to find all image files and process them
   */
  public scanDirectoryForImages(dir: string): void {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(item => {
      // Skip hidden files, node_modules, and excluded directories
      if (item.startsWith('.') || item === 'node_modules' || BUILD_CONFIG.EXCLUDED_DIRS.includes(item)) return;

      const srcPath = path.join(dir, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        this.scanDirectoryForImages(srcPath);
      }
      // No longer process images during pre-scan, handle dynamically during rendering
    });
  }

  // ========================================================================
  // Module 3: Asset Processing (Images and Code Files)
  // ========================================================================

  /**
   * Process image
   *
   * 1. Generate random filename prefix
   * 2. Hash the random prefix with SHA256 as new filename
   * 3. Copy to vmdimage directory
   * 4. Record in imageMap and siteImages
   *
   * Note: Same image referenced multiple times will generate different files
   * because each processing uses a random prefix to create unique filenames
   */
  public processImage(srcPath: string): string | null {
    try {
      if (!fs.existsSync(srcPath)) {
        throw this.createError(VmdErrorCode.IMAGE_NOT_FOUND, { imagePath: srcPath }, { file: srcPath }, { report: false });
      }

      const fileBuffer = fs.readFileSync(srcPath);
      // Generate random prefix to ensure same image referenced multiple times gets different filenames
      const randomPrefix = crypto.randomUUID();
      const hash = crypto.createHash('sha256').update(randomPrefix).digest('hex');
      const ext = path.extname(srcPath).toLowerCase();
      const destFileName = `${hash}${ext}`;
      const vmdImagePath = path.join(this.projectRoot, BUILD_CONFIG.PUBLIC_DIR, BUILD_CONFIG.VMD_IMAGE_DIR);

      // Ensure target directory exists
      if (!fs.existsSync(vmdImagePath)) fs.mkdirSync(vmdImagePath, { recursive: true });

      const destPath = path.join(vmdImagePath, destFileName);
      fs.writeFileSync(destPath, fileBuffer);

      const relativeSrcPath = path.relative(this.projectRoot, srcPath);
      const relativeHashPath = path.join(BUILD_CONFIG.VMD_IMAGE_DIR, destFileName);

      // Avoid duplicate records
      if (!this.siteImages.some(img => img.hashPath === relativeHashPath)) {
        this.siteImages.push({ originalPath: relativeSrcPath, hashPath: relativeHashPath });
      }

      // Record image name to hash name mapping
      this.imageMap[path.basename(srcPath)] = destFileName;
      return hash;
    } catch (err) {
      if (err instanceof VmdError) throw err;
      throw this.createError(VmdErrorCode.IMAGE_PROCESS_FAILED,
        { imagePath: srcPath, details: err instanceof Error ? err.message : String(err) }, { file: srcPath }, { report: false });
    }
  }

  /**
   * Validate image exists
   *
   * Only accepts local images, remote URLs will error
   */
  public validateImageExists(imagePath: string, location?: ErrorLocation): void {
    // Reject remote URLs
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      throw this.createError(
        VmdErrorCode.IMAGE_NOT_FOUND,
        { imageName: imagePath, reason: 'Remote images are not allowed, please use local images' },
        location,
        { report: false }
      );
    }

    // Check processed images
    const basename = path.basename(decodeURIComponent(imagePath));
    if (basename in this.imageMap) return;

    // Check possible local paths
    const decodedPath = decodeURIComponent(imagePath);
    const possiblePaths = [
      path.join(this.projectRoot, 'public', decodedPath),
      path.join(this.projectRoot, 'dev', 'assets', 'images', path.basename(decodedPath)),
      path.join(this.projectRoot, decodedPath),
      // Relative to current file's directory
      ...(location?.file ? [path.normalize(path.join(path.dirname(path.isAbsolute(location.file) ? location.file : path.join(this.projectRoot, location.file)), decodedPath))] : [])
    ];

    if (!possiblePaths.some(p => fs.existsSync(p))) {
      throw this.createError(VmdErrorCode.IMAGE_NOT_FOUND, { imageName: imagePath, searchedPaths: possiblePaths }, location, { report: false });
    }
  }

  /**
   * Write code file
   *
   * Writes code block content to vmdcode directory, filename is content hash
   */
  public writeCodeFile(content: string, hash: string): void {
    const codeDir = path.join(this.projectRoot, BUILD_CONFIG.PUBLIC_DIR, BUILD_CONFIG.VMD_CODE_DIR);
    const codeFilePath = path.join(codeDir, `${hash}.txt`);

    try {
      if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir, { recursive: true });
      fs.writeFileSync(codeFilePath, content);
    } catch (err) {
      throw this.createError(VmdErrorCode.CODE_FILE_WRITE_ERROR,
        { filePath: codeFilePath, details: err instanceof Error ? err.message : String(err) }, { file: codeFilePath }, { report: false });
    }
  }

  /**
   * Process image and return hash filename (generates new file on each call)
   *
   * Finds actual file based on original image path, processes and copies to vmdimage directory.
   * Generates a new unique filename on each call, does not check if already exists.
   */
  public processImageAndGetHash(originalPath: string, currentFile?: string): string | null {
    // Possible image paths
    const possiblePaths = [
      path.join(this.projectRoot, 'dev', 'assets', 'images', originalPath),
      path.join(this.projectRoot, 'dev', 'assets', 'images', path.basename(originalPath)),
      path.join(this.projectRoot, 'public', originalPath),
      ...(currentFile ? [path.normalize(path.join(path.dirname(currentFile), originalPath))] : []),
      path.join(this.projectRoot, originalPath),
    ];

    // Find existing image file
    const srcPath = possiblePaths.find(p => fs.existsSync(p));
    if (!srcPath) return null;

    try {
      return this.processImage(srcPath);
    } catch {
      return null;
    }
  }

  /**
   * Get image hash filename
   */
  public getHashedImageName(originalName: string): string | null {
    return this.imageMap[originalName] || null;
  }

  /**
   * Check if image has been processed
   */
  public hasImage(originalName: string): boolean {
    return originalName in this.imageMap;
  }

  /**
   * Get asset data
   */
  public getAssetData(): { imageMap: Record<string, string>; siteImages: { originalPath: string; hashPath: string }[] } {
    return { imageMap: { ...this.imageMap }, siteImages: [...this.siteImages] };
  }

  /**
   * Reset asset tracking data
   */
  public resetAssets(): void {
    this.imageMap = {};
    this.siteImages = [];
  }

  // ========================================================================
  // Module 4: Git Operations (Date and Author Resolution)
  // ========================================================================

  /**
   * Check if Git is available
   */
  public checkGitAvailable(shouldThrow = false): boolean {
    try {
      execSync('git --version', { stdio: 'pipe' });
      return true;
    } catch {
      if (shouldThrow) throw this.createError(VmdErrorCode.GIT_NOT_AVAILABLE, {}, undefined, { report: false });
      return false;
    }
  }

  /**
   * Resolve date
   *
   * If value is @git, get file creation or last modification date from Git history
   * - earliest: Earliest commit date (file creation date)
   * - latest: Latest commit date (last modification date)
   *
   * Note: Remote mode uses downloaded repository's git history,
   * local mode uses v0plex project's git history
   */
  public resolveDate(value: string, filePath: string, type: 'earliest' | 'latest'): string {
    if (value !== '@git') return value;

    try {
      const format = '%Y-%m-%d';
      // Remote mode: use .git in dev folder (downloaded repo)
      // Local mode: use .git in current working directory (v0plex project)
      const gitCwd = this.isRemoteGitMode ? path.join(this.projectRoot, 'dev') : process.cwd();

      const command = type === 'earliest'
        ? `git log --follow --format=%cd --date=format:${format} -- "${filePath}" | tail -1`
        : `git log -1 --format=%cd --date=format:${format} -- "${filePath}"`;
      const result = execSync(command, { encoding: 'utf8', cwd: gitCwd }).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(result)) return result;
    } catch { /* Git command failed */ }

    // Return today's date on failure
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Resolve author
   *
   * If value contains @git, replace with Git user's name and email
   * Supports multiple authors separated by |
   *
   * Note: Remote mode uses downloaded repo's git config,
   * local mode uses v0plex project's git config
   */
  public resolveAuthor(value: string): string {
    if (!value.includes('@git')) return value;

    // Remote mode: use .git in dev folder (downloaded repo)
    // Local mode: use .git in current working directory (v0plex project)
    const gitCwd = this.isRemoteGitMode ? path.join(this.projectRoot, 'dev') : process.cwd();

    // Get Git user info
    let gitAuthorString = 'Unknown Author';
    try {
      const name = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe', cwd: gitCwd }).trim();
      const email = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe', cwd: gitCwd }).trim();
      if (name && email) gitAuthorString = `${name}->${email}`;
    } catch { /* Git not available */ }

    // Pure @git direct replacement
    if (value === '@git') return gitAuthorString;

    // Replace all @git placeholders
    return value.split('|').map(a => a.trim()).map(a => a === '@git' ? gitAuthorString : a).join('|');
  }

  /**
   * Scan directory or file for @git placeholders
   *
   * Used to determine if Git environment is needed
   */
  public scanForGitPlaceholders(inputPath: string): boolean {
    const scanDir = (dirPath: string): boolean => {
      for (const item of fs.readdirSync(dirPath)) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          if (scanDir(itemPath)) return true;
        } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.mdx'))) {
          if (/@git/.test(fs.readFileSync(itemPath, 'utf8'))) return true;
        }
      }
      return false;
    };

    try {
      const stats = fs.statSync(inputPath);
      if (stats.isDirectory()) return scanDir(inputPath);
      if (stats.isFile()) return /@git/.test(fs.readFileSync(inputPath, 'utf8'));
    } catch { /* Ignore errors */ }
    return false;
  }

  // ========================================================================
  // Module 5: Frontmatter Parsing and Validation
  // ========================================================================

  /**
   * Parse frontmatter
   *
   * Frontmatter is YAML-formatted metadata at the head of Markdown files,
   * enclosed in ---. Returns parsed attributes, body content, and frontmatter line count.
   */
  public parseFrontmatter(content: string, filePath?: string): ParseResult {
    const location: ErrorLocation = filePath ? { file: filePath } : {};

    try {
      // Match frontmatter starting and ending with ---
      const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
      if (!match) return { attributes: {}, body: content, frontmatterLineCount: 0 };

      const frontMatterBlock = match[1];
      const body = content.substring(match[0].length);
      const attributes: FrontMatterAttributes = {};

      // Simple key: value parsing
      frontMatterBlock.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key) attributes[key] = value;
        }
      });

      return { attributes, body, frontmatterLineCount: match[0].split('\n').length };
    } catch (err) {
      throw this.createError(VmdErrorCode.FRONTMATTER_PARSE_ERROR,
        { details: err instanceof Error ? err.message : String(err) }, location, { report: false });
    }
  }

  /**
   * Validate frontmatter attributes
   *
   * Checks if required fields exist and formats are correct
   */
  public validateFrontmatter(attributes: FrontMatterAttributes, filePath: string): void {
    const required = ['title', 'created_at', 'last_updated_at', 'author', 'has_custom_tsx', 'tags'];
    const allowed = new Set(required);

    // Check required fields
    const missing = required.filter(r => !attributes[r]);
    // Check extra fields
    const extra = Object.keys(attributes).filter(k => !allowed.has(k));

    if (missing.length > 0) {
      throw this.createError(VmdErrorCode.FRONTMATTER_MISSING_REQUIRED, { fields: missing }, { file: filePath }, { report: false });
    }
    if (extra.length > 0) {
      throw this.createError(VmdErrorCode.FRONTMATTER_INVALID_FORMAT,
        { message: `Unexpected attributes: ${extra.join(', ')}. Allowed attributes: ${required.join(', ')}` }, { file: filePath }, { report: false });
    }

    // Validate has_custom_tsx value
    if (attributes.has_custom_tsx !== 'true' && attributes.has_custom_tsx !== 'false') {
      throw this.createError(VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'has_custom_tsx', value: attributes.has_custom_tsx, expected: 'true or false' }, { file: filePath }, { report: false });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const gitRegex = /^@git$/;
    ['created_at', 'last_updated_at'].forEach(field => {
      const val = attributes[field];
      if (!dateRegex.test(val!) && !gitRegex.test(val!)) {
        throw this.createError(VmdErrorCode.FRONTMATTER_INVALID_VALUE,
          { field, value: val, expected: 'YYYY-MM-DD or @git' }, { file: filePath }, { report: false });
      }
    });

    // Validate author format
    this.validateAuthorFormat(attributes.author!, filePath);
  }

  /**
   * Parse tags string
   *
   * Converts "[tag1, tag2]" format to array
   */
  public parseTags(tagsValue: string | undefined): string[] {
    if (!tagsValue) return [];
    const match = tagsValue.match(/^\[([^\]]*)\]$/);
    return match ? match[1].split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
  }

  /**
   * Check if has custom TSX
   */
  public hasCustomTsx(attributes: FrontMatterAttributes): boolean {
    return attributes.has_custom_tsx === 'true';
  }

  /**
   * Validate author format
   *
   * Supported formats:
   * - "Name"
   * - "Name->email@example.com"
   * - "Name->https://url.com"
   * - "@git" (get from Git config)
   * - Multiple authors separated by "|"
   */
  private validateAuthorFormat(author: string, filePath: string): void {
    if (!author || author === '@git') return;

    const authors = author.split('|').map(a => a.trim()).filter(Boolean);
    if (authors.length === 0) {
      throw this.createError(VmdErrorCode.AUTHOR_LIST_EMPTY, {}, { file: filePath }, { report: false });
    }

    // At most one @git
    const gitCount = authors.filter(a => a === '@git').length;
    if (gitCount > 1) {
      throw this.createError(VmdErrorCode.AUTHOR_MULTIPLE_GIT_PLACEHOLDER, {}, { file: filePath }, { report: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^https?:\/\/.+/;

    for (const entry of authors) {
      if (entry === '@git') continue;

      if (entry.includes('->')) {
        const parts = entry.split('->');
        if (parts.length !== 2 || (!urlRegex.test(entry) && !emailRegex.test(parts[1].trim()))) {
          throw this.createError(VmdErrorCode.AUTHOR_INVALID_ENTRY_FORMAT, { message: entry }, { file: filePath }, { report: false });
        }
      }
    }
  }

  // ========================================================================
  // Module 6: Text and Hash Utilities
  // ========================================================================

  /**
   * Calculate hash
   *
   * - sha256: For content hashing (images, code)
   * - path: For path hashing (shake256, 4 byte output)
   */
  public calculateHash(content: string | Buffer, type: 'sha256' | 'path' = 'sha256'): string {
    if (type === 'path') {
      return crypto.createHash('shake256', { outputLength: 4 }).update(content).digest('hex');
    }
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Clean title
   *
   * Removes from filename:
   * - Number prefixes (e.g., "_01_")
   * - File extension
   * - Number suffixes
   */
  public cleanTitle(name: string, isDirectory: boolean = false): string {
    let cleaned = name.replace(/^_?\d+_/, '');
    if (!isDirectory) cleaned = cleaned.replace(/\.[^/.]+$/, '');
    return cleaned.replace(/_\d+$/, '');
  }

  /**
   * Format text
   *
   * Optional: HTML escaping, capitalize first letter
   */
  public formatText(text: string, options?: { escapeHtml?: boolean; capitalize?: boolean }): string {
    let result = text || '';
    if (options?.escapeHtml) {
      result = result.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#039;');
    }
    if (options?.capitalize && result) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  }

  // ========================================================================
  // Module 7: Site Build Orchestration
  // ========================================================================

  /**
   * Main build entry point
   *
   * Processes input path, generates site navigation and page files
   */
  public build(inputPath: string, markdownCompiler: any): boolean {
    console.log(`Starting site build, input path: ${inputPath}`);
    this.errors = [];

    // Check if input path exists
    if (!fs.existsSync(inputPath)) {
      this.createError(VmdErrorCode.BUILD_INVALID_PATH, { path: inputPath }, undefined, { report: true });
      this.getErrorStatus({ print: true });
      return false;
    }

    // If @git placeholders exist, validate Git environment
    if (this.scanForGitPlaceholders(inputPath)) {
      console.log('  Validating Git environment...');
      if (!this.checkGitAvailable(true)) return false;
      console.log('  Git environment validated');
    }

    try {
      this.generatedTsxFiles.clear();
      this.navigation = [];

      const stats = fs.statSync(inputPath);
      if (stats.isDirectory()) {
        // Process directory
        if (!this.validateAndScanDirectory(inputPath)) {
          this.getErrorStatus({ print: true });
          return false;
        }
        this.traverseDirectory(inputPath, this.navigation, markdownCompiler);
      } else {
        // Process single file
        this.processFile(inputPath, this.navigation, markdownCompiler);
      }

      // Build cross-language links
      this.buildCrossLanguageLinks();
      // Write site data
      this.writeSiteData();

      const status = this.getErrorStatus({ print: true });
      if (status.hasErrors) {
        console.error(`Build failed with ${status.count} error(s)`);
        return false;
      }
      return true;
    } catch (err) {
      if (err instanceof VmdError) this.errors.push(err);
      else this.createError(VmdErrorCode.BUILD_ERROR, { details: err instanceof Error ? err.message : String(err) }, { file: inputPath }, { report: true });
      this.getErrorStatus({ print: true });
      return false;
    }
  }

  /**
   * Validate directory structure and scan images
   *
   * Ensures language folders are valid, scans all images
   */
  private validateAndScanDirectory(inputPath: string): boolean {
    const validLocaleFolders = new Set(AVAILABLE_LANGUAGES.map(lang => lang.folder));
    const items = fs.readdirSync(inputPath);
    const subdirs = items.map(item => path.join(inputPath, item))
      .filter(itemPath => fs.statSync(itemPath).isDirectory())
      .map(itemPath => path.basename(itemPath));

    // Check for invalid language folders
    const invalidFolders = subdirs.filter(folder =>
      !validLocaleFolders.has(folder) && !BUILD_CONFIG.EXCLUDED_DIRS.includes(folder) && !folder.startsWith('.')
    );

    if (invalidFolders.length > 0) {
      this.createError(VmdErrorCode.BUILD_INVALID_LANGUAGE_FOLDER,
        { path: inputPath, invalidFolders: invalidFolders.join(', '), validFolders: Array.from(validLocaleFolders).join(', ') }, undefined, { report: true });
      return false;
    }

    // Scan images
    this.scanDirectoryForImages(inputPath);
    const assetsPath = path.join(inputPath, 'assets');
    if (fs.existsSync(assetsPath)) this.scanDirectoryForImages(assetsPath);
    return true;
  }

  /**
   * Traverse directory, build navigation structure
   *
   * Builds navigation tree based on folder and file naming conventions:
   * - Language folders (e.g., "en", "zh") identify content language
   * - Folders with number prefixes (e.g., "_01_Section") become navigation groups
   * - Markdown files become pages
   */
  private traverseDirectory(dir: string, navContainer: NavigationNode[], markdownCompiler: any, locale?: string): void {
    const items = fs.readdirSync(dir);
    const validLocaleFolders = new Set(AVAILABLE_LANGUAGES.map(lang => lang.folder));

    // Sort by number prefix
    items.sort((a, b) => {
      const getNum = (s: string) => { const m = s.match(/^(\d+)_/); return m ? parseInt(m[1], 10) : null; };
      const numA = getNum(a), numB = getNum(b);
      return numA !== null && numB !== null ? numA - numB : a.localeCompare(b, undefined, { numeric: true });
    });

    items.forEach(item => {
      if (item.startsWith('.') || BUILD_CONFIG.EXCLUDED_DIRS.includes(item)) return;

      const srcPath = path.join(dir, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        // Language folder
        if (!locale && validLocaleFolders.has(item)) {
          this.traverseDirectory(srcPath, navContainer, markdownCompiler, item);
        }
        // Folder with number prefix (group)
        else if (/^_(\d+)/.test(item)) {
          const newNavGroup: NavigationNode = {
            title: this.cleanTitle(item, true), type: 'folder', path: '', hash: '', hasCustomTsx: false,
            mdPath: '', tsxPath: '', codeFiles: [], images: [], tags: [], locale: locale, children: []
          };
          navContainer.push(newNavGroup);
          this.traverseDirectory(srcPath, newNavGroup.children, markdownCompiler, locale);
        }
        // Regular section
        else {
          const section: NavigationNode = { title: this.cleanTitle(item, true), type: 'section', locale: locale, children: [] };
          navContainer.push(section);
          this.traverseDirectory(srcPath, section.children, markdownCompiler, locale);
        }
      } else if (stats.isFile()) {
        this.processFile(srcPath, navContainer, markdownCompiler, locale);
      }
    });
  }

  /**
   * Process single file
   *
   * Dispatches to different processing methods based on file extension
   */
  private processFile(srcPath: string, navContainer: NavigationNode[], markdownCompiler: any, locale?: string): void {
    const ext = path.extname(srcPath).toLowerCase();
    if (ext === '.md' || ext === '.mdx') {
      this.processMarkdownFile(srcPath, navContainer, markdownCompiler, locale);
    } else if (ext === '.tsx' && !this.generatedTsxFiles.has(path.basename(srcPath))) {
      this.processTsxFile(srcPath, navContainer, locale);
    }
  }

  /**
   * Process Markdown file
   *
   * 1. Parse frontmatter
   * 2. Validate attributes
   * 3. Resolve @git placeholders (remote mode uses downloaded repo's git info)
   * 4. Compile Markdown to React component
   * 5. Write page.tsx file
   */
  private processMarkdownFile(srcPath: string, navContainer: NavigationNode[], markdownCompiler: any, locale?: string): void {
    const ext = path.extname(srcPath).toLowerCase();
    const relativePath = path.relative(this.projectRoot, srcPath);
    const item = path.basename(srcPath);
    const location = { file: relativePath };

    console.log(`Processing MD/MDX file: ${srcPath}`);

    const mdContent = this.fileOperation('read', srcPath);
    if (typeof mdContent !== 'string') return;

    // Calculate path hash as output directory name
    const hash = this.calculateHash(relativePath, 'path');
    const pageOutDir = path.join(this.projectRoot, BUILD_CONFIG.APP_DIR, BUILD_CONFIG.OUT_DIR, hash);
    if (!this.fileOperation('ensureDir', pageOutDir)) return;

    const destFile = path.join(pageOutDir, 'page.tsx');

    try {
      const { attributes, body, frontmatterLineCount } = this.parseFrontmatter(mdContent, relativePath);
      this.validateFrontmatter(attributes, relativePath);

      const pageTitle = this.cleanTitle(item);
      const hasCustomTsx = this.hasCustomTsx(attributes);
      const tags = this.parseTags(attributes.tags);
      const createdAt = this.resolveDate(attributes.created_at as string, srcPath, 'earliest');
      const lastUpdatedAt = this.resolveDate(attributes.last_updated_at as string, srcPath, 'latest');
      const resolvedAuthor = this.resolveAuthor(attributes.author as string);

      let generatedFiles: string[] = [];
      let usedImages: { originalName: string; hashName: string }[] = [];

      if (hasCustomTsx) {
        // Use custom TSX file
        const expectedTsxPath = path.join(path.dirname(srcPath), `${path.basename(srcPath, ext)}.tsx`);
        if (!fs.existsSync(expectedTsxPath)) {
          throw this.createError(VmdErrorCode.BUILD_MISSING_CUSTOM_TSX, { expectedPath: expectedTsxPath }, location, { report: false });
        }
        this.fileOperation('write', destFile, fs.readFileSync(expectedTsxPath, 'utf8'));
        this.generatedTsxFiles.add(path.basename(expectedTsxPath));
      } else {
        // Compile Markdown
        if (!body.trim().startsWith('# ')) {
          throw this.createError(VmdErrorCode.BUILD_MISSING_H1, {}, location, { report: false });
        }

        const result = markdownCompiler.compile(body, attributes, relativePath, frontmatterLineCount);
        const tsxContent = this.generatePageComponent(
          result.html.replace(/class="/g, 'className="'),
          `${BUILD_CONFIG.GITHUB_REPO_BASE_URL}${SITE_CONFIG.URL_PREFIX}/${hash}`,
          createdAt, lastUpdatedAt, resolvedAuthor
        );
        this.fileOperation('write', destFile, tsxContent);
        this.generatedTsxFiles.add(path.basename(srcPath, ext) + '.tsx');
        generatedFiles = result.generatedFiles || [];
        usedImages = result.usedImages || [];
      }

      // Add to navigation
      navContainer.push({
        title: pageTitle, type: 'page', path: `/${hash}`, hash: hash, hasCustomTsx: hasCustomTsx,
        mdPath: relativePath, tsxPath: path.relative(this.projectRoot, destFile),
        codeFiles: hasCustomTsx ? [] : generatedFiles.map(f => ({ originalPath: '', hashPath: path.join(BUILD_CONFIG.VMD_CODE_DIR, f) })),
        images: hasCustomTsx ? [] : usedImages.map(img => ({ originalName: img.originalName, hashPath: path.join(BUILD_CONFIG.VMD_IMAGE_DIR, img.hashName) })),
        tags: tags, locale: locale, children: []
      });
    } catch (err) {
      if (err instanceof VmdError) this.errors.push(err);
      else this.createError(VmdErrorCode.BUILD_ERROR, { details: err instanceof Error ? err.message : String(err) }, location, { report: true });
    }
  }

  /**
   * Process custom TSX file
   *
   * Directly copies to output directory
   */
  private processTsxFile(srcPath: string, navContainer: NavigationNode[], locale?: string): void {
    const relativePath = path.relative(this.projectRoot, srcPath);
    const item = path.basename(srcPath);

    console.log(`Processing custom TSX file: ${srcPath}`);

    const content = this.fileOperation('read', srcPath);
    if (typeof content !== 'string') return;

    const hash = this.calculateHash(relativePath, 'path');
    const pageOutDir = path.join(this.projectRoot, BUILD_CONFIG.APP_DIR, BUILD_CONFIG.OUT_DIR, hash);
    if (!this.fileOperation('ensureDir', pageOutDir)) return;

    const destFile = path.join(pageOutDir, 'page.tsx');
    if (!this.fileOperation('write', destFile, content)) return;

    navContainer.push({
      title: this.cleanTitle(item), type: 'page', path: `/${hash}`, hash: hash, hasCustomTsx: true,
      mdPath: '', tsxPath: path.relative(this.projectRoot, destFile),
      codeFiles: [], images: [], tags: [], locale: locale, children: []
    });
  }

  /**
   * Generate page component TSX content
   *
   * Creates a complete React component containing:
   * - Necessary imports
   * - VMD components
   * - Date and author information
   * - Edit link
   */
  private generatePageComponent(reactSafeHtml: string, editUrl: string, createdAt: string, lastUpdatedAt: string, author: string): string {
    const pageDatesComponent = `<PageDates publishedAt="${createdAt}" updatedAt="${lastUpdatedAt}" author="${author}" />`;
    const h1Regex = /(<H1vmd[^>]*>[\s\S]*?<\/H1vmd>)/;
    // Insert date component after H1
    const contentWithMeta = h1Regex.test(reactSafeHtml)
      ? reactSafeHtml.replace(h1Regex, `$1\n${pageDatesComponent}`)
      : pageDatesComponent + '\n' + reactSafeHtml;

    return `"use client"\n\nimport React from 'react';\nimport {\n  H1vmd, H2vmd, H3vmd, H4vmd, H5vmd, H6vmd,\n  Pvmd,\n  Boldvmd, Italicvmd, Bolditvmd, Strikevmd, Brvmd,\n  Ulvmd, Livmd,\n  Avmd, Imgvmd, Smallimgvmd,\n  Inlinecodevmd, Blockcodevmd,\n  Inlinemathvmd, Blockmathvmd,\n  Blockquotevmd,\n  Infovmd, Warningvmd, Successvmd, Titlevmd, Contentvmd,\n  Postvmd, Lftvmd, Rtvmd,\n  Olvmd,\n  Tablevmd, Tableheadvmd, Tablebodyvmd, Tablerowvmd, Tablecellvmd\n} from '${BUILD_CONFIG.COMPONENT_IMPORT_PATH}';\nimport { VmdThemeProvider } from '@/components/vmd/vmd-theme-context';\nimport PageDates from '@/components/common/last-updated-at';\nimport EditThisPage from '@/components/common/edit-this-page';\n\nexport default function GeneratedPage() {\n  return (\n    <VmdThemeProvider>\n      <div className="v0plex-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>\n        <div className="page-typography-content" style={{ flex: 1 }}>\n${contentWithMeta}\n        </div>\n        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>\n          <EditThisPage url="${editUrl}" />\n        </div>\n      </div>\n    </VmdThemeProvider>\n  );\n}\n`;
  }

  /**
   * Build cross-language links
   *
   * For multi-language sites, matches pages across languages based on file number prefixes,
   * adding links to other language versions for each page
   */
  private buildCrossLanguageLinks(): void {
    // Collect all pages and their prefix paths
    const collectPages = (nodes: NavigationNode[], result: Array<{ node: NavigationNode; prefixPath: string; locale: string }> = []): typeof result => {
      for (const node of nodes) {
        if (node.type === 'page' && node.mdPath) {
          // Extract number prefix from path
          const parts: string[] = [];
          node.mdPath.split(path.sep).forEach(part => {
            const match = part.match(/^_?(\d+)/);
            if (match) parts.push(match[1]);
          });
          const baseMatch = path.basename(node.mdPath).match(/^_?(\d+)/);
          if (baseMatch) {
            if (parts.length > 0 && !node.mdPath.endsWith(path.basename(node.mdPath))) parts.push(baseMatch[1]);
            result.push({ node, prefixPath: parts.join('_'), locale: node.locale || '' });
          }
        }
        if (node.children?.length) collectPages(node.children, result);
      }
      return result;
    };

    const allPages = collectPages(this.navigation);
    const pagesByPrefix = new Map<string, typeof allPages>();
    allPages.forEach(p => {
      if (!pagesByPrefix.has(p.prefixPath)) pagesByPrefix.set(p.prefixPath, []);
      pagesByPrefix.get(p.prefixPath)!.push(p);
    });

    // Build language links for each page's prefix group
    pagesByPrefix.forEach((pages, prefixPath) => {
      if (pages.length <= 1) return;
      const languageLinks: Record<string, string> = {};
      pages.forEach(({ node, locale }) => { if (locale && node.path) languageLinks[locale] = node.path; });
      pages.forEach(({ node }) => { node.languageLinks = { ...languageLinks }; node.prefixId = prefixPath; });
    });

    // Validate all configured languages exist
    const configuredLocales = new Set(AVAILABLE_LANGUAGES.map(l => l.code));
    pagesByPrefix.forEach((pages, prefixPath) => {
      const pageLocales = new Set(pages.map(p => p.locale).filter(Boolean));
      const missing = [...configuredLocales].filter(l => !pageLocales.has(l));
      if (missing.length > 0 && pages.length > 0) {
        this.createError(VmdErrorCode.BUILD_I18N_PREFIX_MISMATCH, {
          prefixPath, pageLocales: [...pageLocales].join(', '),
          missingLocales: missing.join(', '), configuredLocales: [...configuredLocales].join(', ')
        }, undefined, { report: true });
      }
    });
  }

  /**
   * Write site data
   *
   * Writes navigation tree, image list, and language config to JSON file
   */
  private writeSiteData(): void {
    const availableLocales = [...new Set(this.navigation.map(n => n.locale).filter((l): l is string => !!l))];
    const finalLocales = availableLocales.length > 0 ? availableLocales : AVAILABLE_LANGUAGES.map(l => l.code);

    const siteData: SiteData = {
      navigation: this.navigation, images: this.siteImages,
      availableLocales: finalLocales, defaultLocale: DEFAULT_LOCALE
    };

    const jsonDir = path.join(this.projectRoot, BUILD_CONFIG.PUBLIC_DIR, BUILD_CONFIG.VMD_JSON_DIR);
    this.fileOperation('ensureDir', jsonDir);
    this.fileOperation('write', path.join(jsonDir, BUILD_CONFIG.SITE_DATA_JSON), JSON.stringify(siteData, null, 2));
    console.log(`Generated ${BUILD_CONFIG.SITE_DATA_JSON}, languages: ${finalLocales.join(', ')}`);
  }

  // ========================================================================
  // Module 8: Git Sync Operations
  // ========================================================================

  /**
   * Get Git config
   *
   * Gets Git-related configuration from site config
   */
  public static getGitConfig(): { repoUrl: string; branch: string } {
    return {
      repoUrl: CONTENT_SOURCE_CONFIG.GIT_CONFIG.REPO_URL,
      branch: CONTENT_SOURCE_CONFIG.GIT_CONFIG.BRANCH,
    };
  }

  /**
   * Validate Git config
   *
   * Remote mode checks:
   * - Whether REPO_URL is configured
   * - Whether BRANCH name is valid
   */
  public validateGitConfig(): VmdError[] {
    const errors: VmdError[] = [];
    const configPath = path.resolve(this.projectRoot, 'config/site.config.ts');
    const { REPO_URL, BRANCH } = CONTENT_SOURCE_CONFIG.GIT_CONFIG;

    // Rule 1: Non-local mode requires REPO_URL
    if (!CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN && !REPO_URL) {
      errors.push(createVmdError(VmdErrorCode.CONFIG_MISSING_REPO_URL, {}, { file: configPath }));
    }

    // Local mode skips Git-related validation
    if (CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN) {
      return errors;
    }

    // Rule 2: Validate branch name
    if (BRANCH && !/[\w\-./]+$/.test(BRANCH)) {
      errors.push(createVmdError(VmdErrorCode.CONFIG_INVALID_BRANCH_NAME, { branch: BRANCH }, { file: configPath }));
    }

    return errors;
  }

  /**
   * Sync from Git (remote mode)
   *
   * Workflow:
   * 1. Validate configuration
   * 2. Force check if git is available
   * 3. Delete existing dev folder
   * 4. Full clone (preserves .git directory)
   * 5. Force validate directory structure meets requirements
   */
  public syncFromGit(): boolean {
    const errors = this.validateGitConfig();
    if (errors.length > 0) {
      console.error('\n[Error] Git configuration errors:\n');
      errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error.message}\n`);
      });
      console.error('Please fix configuration errors in config/site.config.ts\n');
      return false;
    }

    // Local mode: only validate dev folder
    if (CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN) {
      return this.validateDevFolderStructure();
    }

    const { REPO_URL, BRANCH } = CONTENT_SOURCE_CONFIG.GIT_CONFIG;
    const devFolderPath = path.resolve(this.projectRoot, 'dev');

    if (!REPO_URL) {
      const error = createVmdError(VmdErrorCode.CONFIG_MISSING_REPO_URL, {}, { file: 'config/site.config.ts' });
      console.error(error.format());
      return false;
    }

    // Force check if git is available
    if (!this.checkGitAvailable(true)) {
      console.error('[Error] Git is not available, cannot sync content from remote repository');
      return false;
    }

    // Delete dev folder
    if (fs.existsSync(devFolderPath)) {
      try {
        fs.rmSync(devFolderPath, { recursive: true, force: true });
      } catch (err) {
        const error = createVmdError(
          VmdErrorCode.GIT_DELETE_FAILED,
          { message: err instanceof Error ? err.message : String(err) },
          { file: devFolderPath }
        );
        console.error(error.format());
        return false;
      }
    }

    // Extract repo name from REPO_URL
    const repoName = (REPO_URL as string).replace(/\.git$/, '').split('/').pop() || 'repo';
    const clonedFolderPath = path.resolve(this.projectRoot, repoName);

    // Delete existing folder with same name if exists
    if (fs.existsSync(clonedFolderPath)) {
      fs.rmSync(clonedFolderPath, { recursive: true, force: true });
    }

    // Build clone command (no target path, git will use repo name as folder name)
    const cloneArgs: string[] = ['clone', '--branch', BRANCH, REPO_URL];

    // Execute full clone
    try {
      console.log(`[Git] Cloning ${BRANCH} branch from ${REPO_URL}...`);
      execSync(`git ${cloneArgs.join(' ')}`, { stdio: 'inherit', cwd: this.projectRoot });
    } catch (err) {
      const error = createVmdError(
        VmdErrorCode.GIT_CLONE_FAILED,
        { repoUrl: REPO_URL },
        undefined,
        err instanceof Error ? err : undefined
      );
      console.error(error.format());
      // Clean up cloned folder
      if (fs.existsSync(clonedFolderPath)) {
        fs.rmSync(clonedFolderPath, { recursive: true, force: true });
      }
      return false;
    }

    // Rename to dev
    try {
      fs.renameSync(clonedFolderPath, devFolderPath);
      console.log('[Git] Renamed to dev folder');
    } catch (err) {
      console.error(`[Error] Failed to rename folder: ${err instanceof Error ? err.message : String(err)}`);
      if (fs.existsSync(clonedFolderPath)) {
        fs.rmSync(clonedFolderPath, { recursive: true, force: true });
      }
      return false;
    }

    // Force validate remote repository directory structure
    console.log('[Git] Validating remote repository directory structure...');
    if (!this.validateRemoteDevStructure(devFolderPath)) {
      return false;
    }

    return true;
  }

  /**
   * Validate remote dev directory structure
   *
   * Remote mode requires:
   * 1. Directly under dev folder must be language folders (e.g., zh, en)
   * 2. Language folders must exactly match AVAILABLE_LANGUAGES configuration
   * 3. No extra folders or files allowed
   */
  private validateRemoteDevStructure(devFolderPath: string): boolean {
    if (!fs.existsSync(devFolderPath)) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NOT_FOUND, {}, { file: devFolderPath });
      console.error(error.format());
      return false;
    }

    const entries = fs.readdirSync(devFolderPath, { withFileTypes: true });
    const configuredLanguages = new Set(AVAILABLE_LANGUAGES.map(l => l.folder));
    const requiredLanguages = AVAILABLE_LANGUAGES.map(l => l.folder);

    // Separate folders and files
    const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== '.git');
    const files = entries.filter(e => e.isFile());
    const folderNames = folders.map(f => f.name);

    // Check for files directly in dev root (not allowed)
    if (files.length > 0) {
      console.error(`[Error] Files are not allowed directly in dev folder root, must be inside language folders`);
      const error = createVmdError(
        VmdErrorCode.DEV_FOLDER_INVALID_STRUCTURE,
        { reason: 'Root contains files', files: files.map(f => f.name).join(', ') },
        { file: devFolderPath }
      );
      console.error(error.format());
      return false;
    }

    // Check for non-language folders
    const nonLanguageFolders = folderNames.filter(name => !configuredLanguages.has(name));
    if (nonLanguageFolders.length > 0) {
      console.error(`[Error] Found unconfigured language folder(s): ${nonLanguageFolders.join(', ')}`);
      console.error(`       Allowed language folders: ${requiredLanguages.join(', ')}`);
      const error = createVmdError(
        VmdErrorCode.DEV_FOLDER_EXTRA_LANGUAGE,
        { extra: nonLanguageFolders, allowed: requiredLanguages },
        { file: devFolderPath }
      );
      console.error(error.format());
      return false;
    }

    // Check for missing required language folders
    const missingLanguages = requiredLanguages.filter(lang => !folderNames.includes(lang));
    if (missingLanguages.length > 0) {
      console.error(`[Error] Missing required language folder(s): ${missingLanguages.join(', ')}`);
      console.error(`       Configuration requires: ${requiredLanguages.join(', ')}`);
      const error = createVmdError(
        VmdErrorCode.DEV_FOLDER_MISSING_REQUIRED_LANGUAGE,
        { missing: missingLanguages, required: requiredLanguages },
        { file: devFolderPath }
      );
      console.error(error.format());
      return false;
    }

    // Check each language folder has files
    for (const folder of folders) {
      const folderPath = path.join(devFolderPath, folder.name);
      if (!this.checkForFilesRecursive(folderPath)) {
        console.error(`[Error] Language folder "${folder.name}" contains no files`);
        const error = createVmdError(
          VmdErrorCode.DEV_FOLDER_NO_FILES,
          { language: folder.name },
          { file: folderPath }
        );
        console.error(error.format());
        return false;
      }
    }

    console.log(`[Git] Directory structure validated, found language folders: ${folderNames.join(', ')}`);
    return true;
  }

  /**
   * Validate dev folder structure (local mode)
   *
   * Must satisfy:
   * - At least one language folder
   * - At least one file
   */
  public validateDevFolderStructure(): boolean {
    const devFolderPath = path.resolve(this.projectRoot, 'dev');

    if (!fs.existsSync(devFolderPath)) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NOT_FOUND, {}, { file: devFolderPath });
      console.error(error.format());
      return false;
    }

    const entries = fs.readdirSync(devFolderPath, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    const files = entries.filter(e => e.isFile());

    // Check language folders
    if (folders.length === 0) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NO_LANGUAGE, {}, { file: devFolderPath });
      console.error(error.format());
      return false;
    }

    // Check files
    let hasFile = files.length > 0;
    if (!hasFile) {
      for (const folder of folders) {
        const folderPath = path.join(devFolderPath, folder.name);
        if (this.checkForFilesRecursive(folderPath)) {
          hasFile = true;
          break;
        }
      }
    }

    if (!hasFile) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NO_FILES, {}, { file: devFolderPath });
      console.error(error.format());
      return false;
    }

    return true;
  }

  /**
   * Recursively check if directory contains files
   */
  private checkForFilesRecursive(dirPath: string): boolean {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) return true;
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          if (this.checkForFilesRecursive(path.join(dirPath, entry.name))) return true;
        }
      }
    } catch {
      // Ignore errors
    }
    return false;
  }

  /**
   * Validate dev folder (local mode)
   *
   * Similar to validateDevFolderStructure but also checks if language folders are valid
   */
  public validateDevFolder(devPath: string): boolean {
    if (!fs.existsSync(devPath)) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NOT_FOUND, {}, { file: devPath });
      console.error(error.format());
      return false;
    }

    const entries = fs.readdirSync(devPath, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    const files = entries.filter(e => e.isFile());

    // Get valid language folder names
    const validLanguageFolders = new Set(AVAILABLE_LANGUAGES.map(lang => lang.folder));

    // Check valid language folders
    const languageFolders = folders.filter(f => validLanguageFolders.has(f.name));
    if (languageFolders.length === 0) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NO_LANGUAGE, {}, { file: devPath });
      console.error(error.format());
      return false;
    }

    // Check files
    let hasFile = files.length > 0;
    if (!hasFile) {
      for (const folder of languageFolders) {
        const folderPath = path.join(devPath, folder.name);
        if (this.checkForFilesRecursive(folderPath)) {
          hasFile = true;
          break;
        }
      }
    }

    if (!hasFile) {
      const error = createVmdError(VmdErrorCode.DEV_FOLDER_NO_FILES, {}, { file: devPath });
      console.error(error.format());
      return false;
    }

    return true;
  }

  /**
   * CLI main entry point
   *
   * This is the main method called by command line tools:
   * 1. If local mode, validate dev folder
   * 2. If remote mode, sync content from Git
   * 3. Clean build output
   * 4. Create Markdown compiler
   * 5. Execute build
   *
   * @param inputPath Input path, default is 'dev'
   * @returns Whether build succeeded
   */
  public run(inputPath: string = 'dev'): boolean {
    const fullInputPath = path.resolve(inputPath);

    // Validate or sync content
    if (CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN) {
      // Local mode: validate dev folder
      if (!this.validateDevFolder(fullInputPath)) {
        return false;
      }
    } else {
      // Remote mode: sync from Git
      if (!this.syncFromGit()) {
        return false;
      }
    }

    // Clean previous build
    this.cleanBuildOutput();

    // Create Markdown compiler
    const { MarkdownCompiler } = require('./state_machine');
    const markdownCompiler = new MarkdownCompiler(this, this.projectRoot);

    // Execute build
    const success = this.build(fullInputPath, markdownCompiler);

    // Remote mode: delete dev/.git folder after build
    if (success && this.isRemoteGitMode) {
      const devGitPath = path.join(this.projectRoot, 'dev', '.git');
      if (fs.existsSync(devGitPath)) {
        try {
          fs.rmSync(devGitPath, { recursive: true, force: true });
          console.log('[Git] Deleted dev/.git folder');
        } catch (err) {
          console.warn(`[Warning] Failed to delete dev/.git folder: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return success;
  }
}

export default VmdUtil;
