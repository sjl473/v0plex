/**
 * Text formatting extensions for VMD
 * Handles bold-italic (***) and other inline formatting
 */

import { escapeHtml } from '../utils';

/**
 * Bold-italic extension (***text***)
 */
export const boldItalicExtension = {
  name: 'bolditalic',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf('***');
  },
  tokenizer(this: any, src: string, tokens: any[]) {
    const rule = /^\*\*\*(.+?)\*\*\*/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'bolditalic',
        raw: match[0],
        text: match[1]
      };
    }
    return undefined;
  },
  renderer(token: any) {
    return `<Bolditvmd>${escapeHtml(token.text)}</Bolditvmd>`;
  }
};
