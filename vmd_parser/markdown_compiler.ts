import { marked } from 'marked';
import path from 'path';
import crypto from 'crypto';
import { AssetProcessor } from './asset_processor';
import { CONFIG } from './config';
import { escapeHtml, capitalize } from './utils';
import { ProcessedMarkdown, ImageReference, FrontMatterAttributes } from './types';
import { createPostBlock, createCustomBlock, smallImgExtension, boldItalicExtension, blockMathExtension, inlineMathExtension } from './markdown_extentions';

export class MarkdownCompiler {
  private assetProcessor: AssetProcessor;
  private generatedFiles: string[] = [];
  private usedImages: ImageReference[] = [];

  constructor(assetProcessor: AssetProcessor) {
    this.assetProcessor = assetProcessor;
  }

  public compile(markdownBody: string, attributes: FrontMatterAttributes): ProcessedMarkdown {
    this.resetState();
    this.configureMarked();

    const rawHtml = marked.parse(markdownBody) as string;
    let vmdHtml = this.transformHtml(rawHtml);
    
    // Inject Metadata Component
    vmdHtml = this.injectMetaComponent(vmdHtml, attributes);

    return {
      html: vmdHtml,
      generatedFiles: [...this.generatedFiles],
      usedImages: [...this.usedImages]
    };
  }

  private resetState() {
    this.generatedFiles = [];
    this.usedImages = [];
  }

  private configureMarked() {
    const self = this; // Capture class instance for use inside renderer

    // Custom Renderer
    const renderer = {
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

        let src = href;
        // Fix: decodeURIComponent handles filenames with spaces (e.g. "pasted%20file.png" -> "pasted file.png")
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
            const itemContent = this.parser.parse(item.tokens); // Use internal parser
            body += `<Livmd>${itemContent}</Livmd>\n`;
        }
        return token.ordered ? `<Olvmd>${body}</Olvmd>\n` : `<Ulvmd>${body}</Ulvmd>\n`;
      },

      codespan(this: any, token: any) {
        const text = (typeof token === 'string') ? token : token.text;
        const hash = crypto.createHash('sha256').update(text).digest('hex');
    
        self.assetProcessor.writeCodeFile(text, hash);
        self.generatedFiles.push(`${hash}.txt`);
    
        return `<Inlinecodevmd filePath="${hash}"></Inlinecodevmd>`;
      },

      code(this: any, token: any) {
        const text = (typeof token === 'string') ? token : token.text;
        const lang = (typeof token === 'string') ? null : token.lang;
        const hash = crypto.createHash('sha256').update(text).digest('hex');

        self.assetProcessor.writeCodeFile(text, hash);
        self.generatedFiles.push(`${hash}.txt`);

        return `<Blockcodevmd language="${escapeHtml(lang || 'text')}" filePath="${hash}"></Blockcodevmd>\n`;
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

    marked.use({
      // @ts-ignore
      renderer,
      extensions: [
        createCustomBlock('info'),
        createCustomBlock('warning'),
        createCustomBlock('success'),
        createPostBlock(),
        smallImgExtension(this.assetProcessor, CONFIG.IMAGE_WEB_PREFIX),
        boldItalicExtension,
        blockMathExtension,
        inlineMathExtension
      ]
    });
  }

  private transformHtml(html: string): string {
      let vmdHtml = this.addVmdSuffix(html);
      vmdHtml = this.unwrapInvalidNesting(vmdHtml);
      return vmdHtml;
  }

  private addVmdSuffix(html: string): string {
    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const customTags = ['blockcodevmd', 'inlinecodevmd', 'blockmathvmd', 'inlinemathvmd', 'imgvmd', 'infovmd', 'warningvmd', 'successvmd', 'postvmd', 'lftvmd', 'rtvmd'];

    return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, rest) => {
        const tagLower = tagName.toLowerCase();

        if (tagLower === 'img' || tagLower === 'imgvmd') {
            rest = rest.replace(/src=(["'])(.*?)\1/, (srcMatch, quote, srcValue) => {
                const originalName = decodeURIComponent(path.basename(srcValue));
                const hashName = this.assetProcessor.getHashedImageName(originalName);
                if (hashName) {
                    this.usedImages.push({ originalName, hashName });
                    return `src=${quote}${CONFIG.IMAGE_WEB_PREFIX}${hashName}${quote}`;
                }
                return srcMatch;
            });
        }

        if (customTags.includes(tagLower)) {
            const capitalizedTag = capitalize(tagLower);
            return tagName !== capitalizedTag ? match.replace(tagName, capitalizedTag) : match;
        }

        if (tagLower.endsWith('vmd')) {
            const capitalizedTag = capitalize(tagLower);
            return tagName !== capitalizedTag ? match.replace(tagName, capitalizedTag) : match;
        }

        const newTagName = capitalize(tagLower) + 'vmd';

        if (match.startsWith('</')) {
            return `</${newTagName}>`;
        } else {
            if (voidTags.includes(tagLower)) {
                let attrs = rest;
                if (attrs.trim().endsWith('/')) {
                    attrs = attrs.substring(0, attrs.lastIndexOf('/'));
                }
                return `<${newTagName}${attrs}></${newTagName}>`;
            }
            return `<${newTagName}${rest}>`;
        }
    });
  }

  private unwrapInvalidNesting(html: string): string {
    const blockTags = ['Imgvmd', 'Ulvmd', 'Olvmd', 'Blockcodevmd', 'Blockmathvmd', 'Blockquotevmd', 'Infovmd', 'Warningvmd', 'Successvmd', 'Postvmd', 'Lftvmd', 'Rtvmd', 'Divvmd'];
    const blockPattern = blockTags.join('|');

    let processedHtml = html;
    const pvmdRegex = /<Pvmd>([\s\S]*?)<\/Pvmd>/g;

    processedHtml = processedHtml.replace(pvmdRegex, (match, content) => {
        const hasBlock = new RegExp(`<(${blockPattern})[\\s\\S]*?>`, 'i').test(content);
        if (!hasBlock) return match;

        const tagRegex = new RegExp(`(<(${blockPattern})\\b[^>]*>([\\s\\S]*?<\\/\\2>))`, 'gi');
        // Fix 1: Added explicit type ': string' for blockMatch
        const newContent = content.replace(tagRegex, (blockMatch: string) => {
            return `</Pvmd>${blockMatch}<Pvmd>`;
        });
        return `<Pvmd>${newContent}</Pvmd>`;
    });

    return processedHtml.replace(/<Pvmd>\s*<\/Pvmd>/g, '');
  }

  private injectMetaComponent(html: string, attributes: FrontMatterAttributes): string {
    if (!attributes.created_at && !attributes.last_updated_at && !attributes.author) {
        return html;
    }

    const published = attributes.created_at ? ` publishedAt="${escapeHtml(attributes.created_at)}"` : '';
    const updated = attributes.last_updated_at ? ` updatedAt="${escapeHtml(attributes.last_updated_at)}"` : '';
    const author = attributes.author ? ` author="${escapeHtml(attributes.author)}"` : '';

    const metaComponent = `<PageDates${published}${updated}${author} />\n`;

    // Fix 2: Replaced /s flag with [\s\S] pattern for ES6 compatibility
    const h1Regex = /<H1vmd[^>]*>[\s\S]*?<\/H1vmd>/;
    const match = html.match(h1Regex);

    if (match) {
        const splitIndex = match.index! + match[0].length;
        return html.slice(0, splitIndex) + '\n' + metaComponent + html.slice(splitIndex);
    } else {
        return metaComponent + html;
    }
  }
}