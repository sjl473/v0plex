/**
 * VMD Markdown Extensions
 * Central export point for all markdown extensions
 */

// Compilation context for tracking source and frontmatter per file
export {
  setCompilationContext,
  clearCompilationContext,
  getMarkdownSource,
  getFrontmatterLineCount,
  hasCompilationContext
} from './compilation_context.ts';

// Utility functions
export {
  isPositionInCode,
  getLineAtPosition,
  checkInvalidNesting,
  checkSingleBacktickInContent,
  getFileLocation,
  findPosition,
  PROTECTED_TAGS,
  POST_ONLY_TAGS,
  CONTAINER_TAGS
} from './validation_helpers.ts';

// Block extensions
export { createPostBlock } from './post_block.ts';
export { createCustomBlock } from './custom_block.ts';

// Inline extensions
export { smallImageExtension } from './small_image_extension.ts';
export { boldItalicExtension } from './text_formatting.ts';
export { blockMathExtension, inlineMathExtension } from './math_extension.ts';

// Line tracker for accurate line number reporting
export {
  clearLineTracker,
  scanVmdBlocks,
  getBlockLineNumber,
  resetBlockIndices,
  calculateSubContentLine,
  debugPrintTrackedBlocks
} from './line_tracker.ts';
