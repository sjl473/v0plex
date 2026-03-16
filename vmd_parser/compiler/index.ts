/**
 * VMD Compiler Module
 * Central export point for all compiler functionality
 */

// Main compiler class
export { MarkdownCompiler } from './compiler.ts';

// Renderer configuration
export { createRenderer, configureMarked } from './renderer.ts';

// HTML transformers
export {
  addVmdSuffix,
  fixLinkedImages,
  unwrapInvalidNesting,
  injectMetaComponent
} from './transformers.ts';

// Validators
export {
  detectNestedCodeBlocks,
  detectSingleBacktickCodeBlocks,
  detectInvalidTagNesting,
  detectEmptyMarkup
} from './validators.ts';

// Token writer
export { writeTokens } from './token_writer.ts';
