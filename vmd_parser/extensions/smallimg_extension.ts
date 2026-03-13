/**
 * Small image extension for VMD
 * Handles <smallimg>![alt](src)</smallimg> syntax
 */

import path from 'path';
import { VmdErrorCode } from '../errors';
import { getFileLocation } from './utils';

export const smallImgExtension = (assetProcessor: any, imageWebPrefix: string, filePath?: string) => {
  return {
    name: 'smallimg',
    level: 'inline' as const,
    start(src: string) {
      return src.match(/^<smallimg>/m) ? src.indexOf('<smallimg>') : -1;
    },
    tokenizer(this: any, src: string, tokens: any[]) {
      if (filePath && this.lexer && !this.lexer.filePath) {
        this.lexer.filePath = filePath;
      }
      const rule = /^<smallimg>(.*?)<\/smallimg>/;
      const match = rule.exec(src);
      if (match) {
        const inner = match[1];
        const imgMatch = /^!\[(.*?)\]\((.*?)\)$/.exec(inner.trim());
        if (imgMatch) {
          const location = getFileLocation(this);
          const srcUrl = imgMatch[2];

          if (assetProcessor) {
            try {
              assetProcessor.validateImageExists(srcUrl, location);
            } catch (err) {
              throw err;
            }
          }

          return {
            type: 'smallimg',
            raw: match[0],
            alt: imgMatch[1],
            src: srcUrl,
            text: match[0]
          };
        }
      }
      return undefined;
    },
    renderer(token: any) {
      // Convert image src to hash path if available
      let src = token.src;
      if (assetProcessor && imageWebPrefix) {
        const originalName = decodeURIComponent(path.basename(token.src));
        const hashName = assetProcessor.getHashedImageName(originalName);
        if (hashName) {
          src = `${imageWebPrefix}${hashName}`;
        }
      }
      return `<Smallimgvmd src="${src}" alt="${token.alt}"></Smallimgvmd>`;
    }
  };
};
