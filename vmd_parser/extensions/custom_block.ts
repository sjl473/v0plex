/**
 * Custom block extensions for VMD
 * Handles info, warning, success blocks
 */

import { capitalize } from '../utils';
import { VmdErrorCode, createVmdError, ErrorLocation } from '../errors';
import { getMarkdownSource, getFrontmatterLineCount } from './compilation_context';
import { getFileLocation, isPositionInCode, getLineAtPosition } from './validation_helpers';

export const createCustomBlock = (name: string) => {
  return {
    name: name,
    level: 'block' as const,
    start(src: string) {
      // Find all occurrences and check if they are inside code blocks
      const pattern = new RegExp(`<${name}>`, 'g');
      let match;
      while ((match = pattern.exec(src)) !== null) {
        const pos = match.index;
        // Use isPositionInCode to check for both fenced and inline code
        if (!isPositionInCode(src, pos)) {
          return pos;
        }
      }
      return -1;
    },
    tokenizer(this: any, src: string, tokens: any[]) {
      const pattern = new RegExp(`^<${name}>([\\s\\S]*?)<\\/${name}>`);
      const match = pattern.exec(src);
      if (match) {
        // Note: Invalid tag nesting is detected globally in MarkdownCompiler.detectInvalidTagNesting
        // Single backtick code blocks are also detected globally in MarkdownCompiler.detectSingleBacktickCodeBlocks

        const location = getFileLocation(this);
        const matchText = match[0];
        let matchPos = -1;
        let inCodeBlock = false;
        let fullSource: string | undefined;

        // Check if this match is inside a code block by checking position in full source
        if (location.file) {
          fullSource = getMarkdownSource(location.file);
          if (fullSource) {
            // Find the position of this match in the full source
            // We need to find the specific occurrence that corresponds to this tokenizer call
            let searchPos = 0;
            let occurrenceCount = 0;
            while ((matchPos = fullSource.indexOf(matchText, searchPos)) !== -1) {
              occurrenceCount++;
              // Check if this position is in a code block
              const isInCode = isPositionInCode(fullSource, matchPos);
              // For empty blocks, we care about non-code-block occurrences
              // For non-empty blocks in code blocks, we skip them
              if (!isInCode) {
                // This is a non-code-block occurrence
                break;
              }
              // This occurrence is in a code block, continue searching
              searchPos = matchPos + 1;
            }

            // Check if the found position is in a code block
            if (matchPos !== -1) {
              inCodeBlock = isPositionInCode(fullSource, matchPos);
            }
          }
        }

        // Parse content into tokens for renderer
        const contentStr = match[1].trim();

        // Check for empty content (only for blocks NOT in code blocks)
        if (!contentStr && !inCodeBlock) {
          // Calculate line number from the match position with frontmatter offset
          let line = location.line || 1;
          if (fullSource && matchPos !== -1) {
            line = getLineAtPosition(fullSource, matchPos, location.file);
          }
          throw createVmdError(
            VmdErrorCode.EXTENSION_EMPTY_CUSTOM_BLOCK,
            { blockName: name, line },
            { ...location, line }
          );
        }

        // If in code block, just return as plain text (don't process as VMD block)
        if (inCodeBlock) {
          return undefined;
        }

        const contentTokens = this.lexer.blockTokens(contentStr);
        return {
          type: name,
          raw: match[0],
          tokens: contentTokens,
          text: contentStr
        };
      }
      return undefined;
    },
    renderer(this: any, token: any) {
      // token.tokens is already tokens array from tokenizer
      const parsedContent = this.parser.parse(token.tokens);
      const componentName = capitalize(name) + 'vmd';
      return `<${componentName}>${parsedContent}</${componentName}>\n`;
    }
  };
};
