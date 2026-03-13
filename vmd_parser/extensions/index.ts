/**
 * VMD Markdown Extensions
 * Central export point for all markdown extensions
 */

// Source store for tracking full source per file
export {
  setFullSource,
  clearFullSource,
  getFullSource,
  getFrontmatterOffset,
  hasFullSource
} from './source_store.ts';

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
} from './utils.ts';

// Block extensions
export { createPostBlock } from './post_block.ts';
export { createCustomBlock } from './custom_block.ts';

// Inline extensions
export { smallImgExtension } from './smallimg_extension.ts';
export { boldItalicExtension } from './text_formatting.ts';
export { blockMathExtension, inlineMathExtension } from './math_extension.ts';
