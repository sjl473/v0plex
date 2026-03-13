/**
 * Token Saver
 * Saves marked lexer tokens for debugging
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { CONFIG } from '../config';

/**
 * Save marked lexer tokens to public/vmdtoken for debugging
 * Only enabled when CONFIG.ENABLE_TOKEN_GENERATION is true
 * Adds line numbers to each token based on frontmatter offset
 */
export function saveTokens(
  markdownBody: string,
  filePath: string | undefined,
  projectRoot: string,
  frontmatterLineOffset: number
): void {
  if (!filePath || !CONFIG.ENABLE_TOKEN_GENERATION) return;

  try {
    // Get tokens from marked lexer
    const tokens = marked.lexer(markdownBody);

    // Add line numbers to tokens
    const tokensWithLineNumbers = addLineNumbersToTokens(tokens, markdownBody, frontmatterLineOffset);

    // Create vmdtoken directory
    const tokenDir = path.join(projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_TOKEN_DIR);
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }

    // Generate filename based on input file
    const baseName = path.basename(filePath, path.extname(filePath));
    const tokenFileName = `${baseName}.tokens.json`;
    const tokenFilePath = path.join(tokenDir, tokenFileName);

    // Write tokens as formatted JSON
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokensWithLineNumbers, null, 2), 'utf-8');
  } catch (err) {
    // Silently fail - this is for debugging only
    console.warn(`Warning: Could not save tokens for ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Add line numbers to tokens based on their position in the source
 */
function addLineNumbersToTokens(
  tokens: any[],
  source: string,
  frontmatterLineOffset: number
): any[] {
  let currentPos = 0;

  return tokens.map(token => {
    // Find the position of this token's raw text in the source
    const tokenStartPos = source.indexOf(token.raw, currentPos);
    if (tokenStartPos !== -1) {
      currentPos = tokenStartPos + token.raw.length;

      // Calculate line number
      const textBefore = source.substring(0, tokenStartPos);
      const bodyLineNumber = (textBefore.match(/\n/g) || []).length + 1;
      const actualLineNumber = bodyLineNumber + frontmatterLineOffset;

      // Create enhanced token with line number
      const enhancedToken = {
        ...token,
        lineNumber: actualLineNumber,
        bodyLineNumber: bodyLineNumber
      };

      // Recursively add line numbers to nested tokens
      if (token.tokens && Array.isArray(token.tokens)) {
        enhancedToken.tokens = addLineNumbersToTokens(token.tokens, source, frontmatterLineOffset);
      }
      if (token.items && Array.isArray(token.items)) {
        enhancedToken.items = token.items.map((item: any) => {
          if (item.tokens && Array.isArray(item.tokens)) {
            return {
              ...item,
              tokens: addLineNumbersToTokens(item.tokens, source, frontmatterLineOffset)
            };
          }
          return item;
        });
      }

      return enhancedToken;
    }
    return token;
  });
}
