/**
 * Marked Renderer Configuration
 * Configures the marked renderer for VMD compilation
 */

import crypto from 'crypto';
import path from 'path';
import { marked } from 'marked';
import { AssetProcessor } from '../asset_processor';
import { CONFIG } from '../config';
import { escapeHtml, capitalize } from '../utils';
import { VmdErrorCode, createVmdError, VmdError } from '../errors';
import {
  createPostBlock,
  createCustomBlock,
  smallImageExtension,
  boldItalicExtension,
  blockMathExtension,
  inlineMathExtension
} from '../extensions';

/**
 * Create marked renderer configuration
 */
export function createRenderer(
  assetProcessor: AssetProcessor,
  usedImages: Array<{ originalName: string; hashName: string }>,
  generatedFiles: string[],
  currentFile: string
) {
  const self = { assetProcessor, usedImages, generatedFiles, currentFile };

  return {
    strong(this: any, token: any) {
      return `<bold>${this.parser.parseInline(token.tokens)}</bold>`;
    },
    em(this: any, token: any) {
      return `<italic>${this.parser.parseInline(token.tokens)}</italic>`;
    },
    del(this: any, token: any) {
      return `<strike>${this.parser.parseInline(token.tokens)}</strike>`;
    },

    image(this: any, token: any) {
      const href = token.href;
      const title = token.title;
      const text = token.text;

      // Validate image exists
      const location = self.currentFile ? { file: self.currentFile } : {};
      self.assetProcessor.validateImageExists(href, location);

      let src = href;
      const originalName = decodeURIComponent(path.basename(href));
      const hashName = self.assetProcessor.getHashedImageName(originalName);

      if (hashName) {
        src = `${CONFIG.IMAGE_WEB_PREFIX}${hashName}`;
        self.usedImages.push({ originalName, hashName });
      }

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const altAttr = text ? ` alt="${escapeHtml(text)}"` : '';

      return `<Imgvmd src="${src}"${altAttr}${titleAttr}></Imgvmd>`;
    },

    list(this: any, token: any) {
      let body = '';
      for (let i = 0; i < token.items.length; i++) {
        const item = token.items[i];
        const itemContent = this.parser.parse(item.tokens);
        body += `<Livmd>${itemContent}</Livmd>\n`;
      }
      return token.ordered ? `<Olvmd>${body}</Olvmd>\n` : `<Ulvmd>${body}</Ulvmd>\n`;
    },

    codespan(this: any, token: any) {
      try {
        const text = (typeof token === 'string') ? token : token.text;
        const hash = crypto.createHash('sha256').update(text).digest('hex');

        self.assetProcessor.writeCodeFile(text, hash);
        self.generatedFiles.push(`${hash}.txt`);

        return `<Inlinecodevmd filePath="${hash}"></Inlinecodevmd>`;
      } catch (err) {
        if (err instanceof VmdError) {
          throw err;
        }
        const location = self.currentFile ? { file: self.currentFile } : {};
        throw createVmdError(
          VmdErrorCode.CODE_FILE_WRITE_ERROR,
          { details: err instanceof Error ? err.message : String(err) },
          location
        );
      }
    },

    code(this: any, token: any) {
      try {
        const text = (typeof token === 'string') ? token : token.text;
        const lang = (typeof token === 'string') ? null : token.lang;
        const hash = crypto.createHash('sha256').update(text).digest('hex');

        self.assetProcessor.writeCodeFile(text, hash);
        self.generatedFiles.push(`${hash}.txt`);

        return `<Blockcodevmd language="${escapeHtml(lang || 'text')}" filePath="${hash}"></Blockcodevmd>\n`;
      } catch (err) {
        if (err instanceof VmdError) {
          throw err;
        }
        const location = self.currentFile ? { file: self.currentFile } : {};
        throw createVmdError(
          VmdErrorCode.CODE_FILE_WRITE_ERROR,
          { details: err instanceof Error ? err.message : String(err) },
          location
        );
      }
    },

    paragraph(this: any, token: any) {
      const text = (typeof token === 'string') ? token : this.parser.parseInline(token.tokens);
      const blockTags = ['Imgvmd', 'Ulvmd', 'Olvmd', 'Blockcodevmd', 'Blockmathvmd', 'Blockquotevmd', 'Infovmd', 'Warningvmd', 'Successvmd', 'Postvmd', 'Lftvmd', 'Rtvmd'];
      const blockTagPattern = blockTags.join('|');
      const blockRegex = new RegExp(`^\\s*<(${blockTagPattern})[\\s\\S]*?>`, 'i');

      if (blockRegex.test(text)) {
        return `${text}\n`;
      }
      return `<p>${text}</p>\n`;
    }
  };
}

/**
 * Configure marked with VMD extensions
 */
export function configureMarked(
  assetProcessor: AssetProcessor,
  usedImages: Array<{ originalName: string; hashName: string }>,
  generatedFiles: string[],
  currentFile: string
): void {
  const renderer = createRenderer(assetProcessor, usedImages, generatedFiles, currentFile);

  marked.use({
    renderer,
    extensions: [
      createCustomBlock('info'),
      createCustomBlock('warning'),
      createCustomBlock('success'),
      createPostBlock(assetProcessor, CONFIG.IMAGE_WEB_PREFIX, currentFile),
      smallImageExtension(assetProcessor, CONFIG.IMAGE_WEB_PREFIX, currentFile),
      boldItalicExtension,
      blockMathExtension,
      inlineMathExtension
    ]
  });
}
