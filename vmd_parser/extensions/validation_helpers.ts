/**
 * Validation and helper functions for markdown block extensions
 * Contains validation logic for custom blocks, post blocks, and nesting rules
 */

import { getMarkdownSource, getFrontmatterLineCount } from './compilation_context';

// Tags that are protected and cannot be nested inside other custom blocks
export const PROTECTED_TAGS = ['post', 'lft', 'rt'];

// Tags that can only appear inside <post>
export const POST_ONLY_TAGS = ['lft', 'rt'];

// Container tags that cannot contain protected tags
export const CONTAINER_TAGS = ['info', 'warning', 'success', 'smallimg'];

/**
 * Code region detector
 * Returns true if the given position is inside any code context:
 * - Fenced code block (```...```)
 * - Inline code (`...`)
 */
export function isPositionInCode(source: string, position: number): boolean {
  // First, identify all fenced code block regions
  const fencedBlocks: Array<[number, number]> = [];
  const lines = source.split('\n');
  let charPos = 0;
  let fencedStart: number | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (/^```+/.test(trimmedLine)) {
      if (fencedStart === null) {
        fencedStart = charPos;
      } else {
        fencedBlocks.push([fencedStart, charPos + line.length + 1]); // +1 for newline
        fencedStart = null;
      }
    }
    charPos += line.length + 1; // +1 for newline
  }

  // Check if position is in a fenced block
  for (const [start, end] of fencedBlocks) {
    if (position >= start && position < end) {
      return true;
    }
  }

  // If not in fenced block, check for inline code
  // Find all inline code regions (not inside fenced blocks)
  const inlineCodeRegex = /`[^`]*`/g;
  let match;
  while ((match = inlineCodeRegex.exec(source)) !== null) {
    // Skip if this inline code is inside a fenced block
    let inFenced = false;
    for (const [start, end] of fencedBlocks) {
      if (match.index >= start && match.index < end) {
        inFenced = true;
        break;
      }
    }
    if (!inFenced) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (position > matchStart && position < matchEnd) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate line number by counting newlines in text before a position
 * Returns the actual line number in the full markdown file (including frontmatter)
 */
export function getLineAtPosition(fullSource: string, position: number, filePath?: string): number {
  const textBefore = fullSource.substring(0, position);
  const bodyLineNumber = (textBefore.match(/\n/g) || []).length + 1;

  // Add frontmatter offset to get the actual line number
  if (filePath) {
    const offset = getFrontmatterLineCount(filePath);
    return bodyLineNumber + offset;
  }
  return bodyLineNumber;
}

/**
 * Check if content contains protected tags that would be invalid nesting
 * Returns the first invalid tag found, or null if valid
 * This checks direct nesting - protected tags cannot be inside container tags
 */
export function checkInvalidNesting(content: string, parentTag: string): { tag: string; line: number } | null {
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block boundaries - skip content inside code blocks
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }

    // Skip content inside code blocks (```...```)
    if (inCodeBlock) {
      continue;
    }

    // Check for opening of protected tags
    // Use word boundary to ensure we match complete tag names
    for (const tag of PROTECTED_TAGS) {
      // Match tag at the start of line (possibly with whitespace), not just anywhere in the line
      const openRegex = new RegExp(`^\\s*<${tag}\\b[^>]*>`, 'i');
      if (openRegex.test(trimmedLine)) {
        // Check if parent is a container tag (which cannot contain protected tags)
        if (CONTAINER_TAGS.includes(parentTag.toLowerCase())) {
          return { tag, line: i + 1 };
        }

        // Check if it's lft or rt outside of post
        if (POST_ONLY_TAGS.includes(tag) && parentTag.toLowerCase() !== 'post') {
          return { tag, line: i + 1 };
        }
      }
    }
  }

  return null;
}

/**
 * Check if content contains single backtick at line start (invalid for VMD)
 * Inside code blocks (```...```) is allowed
 * Note: single ` for inline code is allowed, but not as a code block delimiter
 */
export function checkSingleBacktickInContent(content: string): number | null {
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block boundaries
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }

    // Skip content inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Check for single backtick at start of line followed by content
    // This indicates someone trying to use ` as a code block delimiter
    // Pattern: line starts with ` followed by non-whitespace, non-backtick content
    if (/^`[^\s`]/.test(trimmedLine)) {
      return i + 1;
    }
  }

  return null;
}

/**
 * Get file location from lexer context
 */
export function getFileLocation(context: any): { file?: string; line?: number; column?: number } {
  const location: { file?: string; line?: number; column?: number } = {};
  if (context && context.lexer) {
    if (context.lexer.filePath) {
      location.file = context.lexer.filePath;
    }
  }
  return location;
}

/**
 * Find position of a substring within full source, starting from a given offset
 */
export function findPosition(fullSource: string, searchText: string, startOffset: number = 0): number {
  return fullSource.indexOf(searchText, startOffset);
}
