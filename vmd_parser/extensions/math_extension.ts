/**
 * Math extensions for VMD
 * Handles inline ($...$) and block ($$...$$) math
 */

import { escapeHtml } from '../utils';
import { VmdErrorCode, createVmdError, ErrorLocation } from '../errors';
import { getFileLocation } from './validation_helpers';

// XSS detection for math formulas
const dangerousPatterns = [
  { pattern: /<script\b[^>]*>/i, name: 'script tag' },
  { pattern: /javascript:/i, name: 'javascript protocol' },
  { pattern: /on\w+\s*=/i, name: 'event handler' },
  { pattern: /<script/i, name: 'encoded script tag' },
  { pattern: /&#x?\d+;/i, name: 'HTML entity' },
];

function checkXssInMath(formula: string, location: ErrorLocation): void {
  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(formula)) {
      throw createVmdError(
        VmdErrorCode.MARKDOWN_XSS_DETECTED,
        { formula, pattern: name },
        location
      );
    }
  }
}

/**
 * Block math extension ($$...$$)
 */
export const blockMathExtension = {
  name: 'blockMath',
  level: 'block' as const,
  start(src: string) {
    return src.indexOf('$$');
  },
  tokenizer(this: any, src: string, tokens: any[]) {
    const rule = /^\$\$([\s\S]+?)\$\$/;
    const match = rule.exec(src);
    if (match) {
      const formula = match[1].trim();
      const location = getFileLocation(this);
      checkXssInMath(formula, location);
      return {
        type: 'blockMath',
        raw: match[0],
        formula: formula,
        text: match[0]
      };
    }
    return undefined;
  },
  renderer(token: any) {
    return `<Blockmathvmd formula="${escapeHtml(token.formula)}"></Blockmathvmd>`;
  }
};

/**
 * Inline math extension ($...$)
 */
export const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf('$');
  },
  tokenizer(this: any, src: string, tokens: any[]) {
    const rule = /^\$(.+?)\$/;
    const match = rule.exec(src);
    if (match) {
      const formula = match[1].trim();
      const location = getFileLocation(this);
      checkXssInMath(formula, location);
      return {
        type: 'inlineMath',
        raw: match[0],
        formula: formula,
        text: match[0]
      };
    }
    return undefined;
  },
  renderer(token: any) {
    return `<Inlinemathvmd formula="${escapeHtml(token.formula)}"></Inlinemathvmd>`;
  }
};
