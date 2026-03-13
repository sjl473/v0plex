/**
 * Markdown Validators
 * Pre and post validation for markdown compilation
 */

import { VmdErrorCode, createVmdError, ErrorLocation, VmdError } from '../errors';

/**
 * Detect nested code blocks (code blocks inside code blocks)
 */
export function detectNestedCodeBlocks(
  body: string,
  getActualLineNumber: (line: number) => number,
  getLocation: () => ErrorLocation
): void {
  const lines = body.split('\n');
  let inCodeBlock = false;
  let codeBlockStartLine = 0;
  let backtickCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeFenceMatch = line.match(/^(```+)(\w*)/);

    if (codeFenceMatch) {
      const ticks = codeFenceMatch[1].length;

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStartLine = i + 1;
        backtickCount = ticks;
      } else if (ticks === backtickCount) {
        inCodeBlock = false;
        backtickCount = 0;
      } else if (ticks >= 3) {
        const actualLine = getActualLineNumber(i + 1);
        throw createVmdError(
          VmdErrorCode.MARKDOWN_NESTED_CODE_BLOCK,
          { line: actualLine, expected: backtickCount, found: ticks },
          { ...getLocation(), line: actualLine }
        );
      }
    }
  }
}

/**
 * Detect single backtick code blocks inside custom markup blocks
 * Only triple backticks (```) are allowed for code blocks in VMD
 * Single ` inside code blocks (```...```) is allowed, but not as a code block delimiter
 */
export function detectSingleBacktickCodeBlocks(
  body: string,
  getActualLineNumber: (line: number) => number,
  getLocation: () => ErrorLocation
): void {
  const lines = body.split('\n');
  let inCodeBlock = false;

  // Track the hierarchy of custom blocks
  const blockStack: Array<{ tag: string; line: number }> = [];

  // Custom block tags that trigger validation
  const customBlockTags = ['post', 'lft', 'rt', 'info', 'warning', 'success', 'smallimg'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block boundaries (triple backticks)
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }

    // Skip content inside code blocks (allowed to have anything)
    if (inCodeBlock) {
      continue;
    }

    // Track custom block hierarchy
    for (const tag of customBlockTags) {
      const openRegex = new RegExp(`^\\s*<${tag}\\b[^>]*>`, 'i');
      const closeRegex = new RegExp(`^\\s*</${tag}>`, 'i');

      if (openRegex.test(trimmedLine)) {
        blockStack.push({ tag: tag.toLowerCase(), line: i + 1 });
      }

      if (closeRegex.test(trimmedLine)) {
        // Pop from stack until we find matching tag
        for (let j = blockStack.length - 1; j >= 0; j--) {
          if (blockStack[j].tag === tag.toLowerCase()) {
            blockStack.splice(j, blockStack.length - j);
            break;
          }
        }
      }
    }

    // Check for single backtick used as code block delimiter (not inline)
    // Only check if we're inside any custom block
    // Pattern: line starts with ` followed by non-whitespace, non-backtick content
    if (blockStack.length > 0 && /^`[^\s`]/.test(trimmedLine)) {
      const actualLine = getActualLineNumber(i + 1);
      throw createVmdError(
        VmdErrorCode.MARKDOWN_SINGLE_BACKTICK_CODEBLOCK,
        { line: actualLine },
        { ...getLocation(), line: actualLine }
      );
    }
  }
}

/**
 * Detect invalid tag nesting: <post>, <lft>, <rt> cannot be nested inside other custom blocks
 * Also checks that these tags are not nested inside each other incorrectly
 */
export function detectInvalidTagNesting(
  body: string,
  getActualLineNumber: (line: number) => number,
  getLocation: () => ErrorLocation
): void {
  const lines = body.split('\n');
  let inCodeBlock = false;

  // Track the hierarchy of custom blocks
  const blockStack: Array<{ tag: string; line: number }> = [];

  // Tags that cannot contain <post>, <lft>, or <rt>
  const containerTags = ['info', 'warning', 'success', 'smallimg'];
  // Tags that are protected (cannot be nested inside other custom blocks except post)
  const protectedTags = ['post', 'lft', 'rt'];
  // Tags that can only be inside <post>
  const postOnlyTags = ['lft', 'rt'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block boundaries (triple backticks)
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }

    // Skip content inside code blocks (allowed to have anything)
    if (inCodeBlock) {
      continue;
    }

    // Check for opening tags
    const openTagMatch = trimmedLine.match(/^<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/);

    if (openTagMatch) {
      const tagName = openTagMatch[1].toLowerCase();

      // Check if this is a protected tag being nested inside a container
      if (protectedTags.includes(tagName)) {
        // Check if we're inside a container block (not post)
        for (const block of blockStack) {
          if (containerTags.includes(block.tag)) {
            const actualLine = getActualLineNumber(i + 1);
            throw createVmdError(
              VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING,
              {
                outerTag: block.tag,
                innerTag: tagName,
                line: actualLine
              },
              { ...getLocation(), line: actualLine }
            );
          }
        }

        // lft and rt can only be inside post
        if (postOnlyTags.includes(tagName)) {
          const isInsidePost = blockStack.some(b => b.tag === 'post');
          if (!isInsidePost) {
            const actualLine = getActualLineNumber(i + 1);
            throw createVmdError(
              VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING,
              {
                outerTag: 'none (root level)',
                innerTag: tagName,
                line: actualLine
              },
              { ...getLocation(), line: actualLine }
            );
          }
        }
      }

      // Check if this is a self-closing tag or inline tag (opening and closing on same line)
      // If so, don't push to stack as it doesn't create a nesting context
      const closeTagPattern = new RegExp(`<\\/${tagName}>`, 'i');
      const isSelfClosing = trimmedLine.includes('/>') || closeTagPattern.test(trimmedLine);

      if (!isSelfClosing) {
        blockStack.push({ tag: tagName, line: i + 1 });
      }
    }

    // Check for closing tags at line start (for multi-line blocks)
    const closeTagMatch = trimmedLine.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)>/);
    if (closeTagMatch) {
      const tagName = closeTagMatch[1].toLowerCase();
      // Pop from stack until we find matching tag
      while (blockStack.length > 0) {
        const popped = blockStack.pop();
        if (popped && popped.tag === tagName) {
          break;
        }
      }
    }
  }
}

/**
 * Detect empty markup elements
 */
export function detectEmptyMarkup(html: string): void {
  const emptyPatterns = [
    { tag: 'bold', pattern: /<bold>\s*<\/bold>/g },
    { tag: 'italic', pattern: /<italic>\s*<\/italic>/g },
    { tag: 'strike', pattern: /<strike>\s*<\/strike>/g },
    { tag: 'inlinecode', pattern: /<inlinecode>\s*<\/inlinecode>/g },
    { tag: 'boldit', pattern: /<boldit>\s*<\/boldit>/g },
  ];

  for (const { tag, pattern } of emptyPatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      console.warn(
        `[WARNING] Empty ${tag} element detected (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`
      );
    }
  }
}
