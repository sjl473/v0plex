/**
 * HTML Transformers
 * Transform raw HTML to VMD-compatible format
 */

import path from 'path';
import { capitalize } from '../utils';
import { CONFIG } from '../config';
import { AssetProcessor } from '../asset_processor';

/**
 * Transform HTML by adding VMD suffixes to all tags
 */
export function addVmdSuffix(
  html: string,
  assetProcessor: AssetProcessor,
  usedImages: Array<{ originalName: string; hashName: string }>
): string {
  const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const customTags = ['blockcodevmd', 'inlinecodevmd', 'blockmathvmd', 'inlinemathvmd', 'imgvmd', 'infovmd', 'warningvmd', 'successvmd', 'postvmd', 'lftvmd', 'rtvmd'];

  return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, rest) => {
    const tagLower = tagName.toLowerCase();

    if (tagLower === 'img' || tagLower === 'imgvmd') {
      rest = rest.replace(/src=(["'])(.*?)\1/, (srcMatch: string, quote: string, srcValue: string) => {
        const originalName = decodeURIComponent(path.basename(srcValue));
        const hashName = assetProcessor.getHashedImageName(originalName);
        if (hashName) {
          usedImages.push({ originalName, hashName });
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

/**
 * Fix the order of linked images
 * When Markdown has [![alt](img)](url), marked produces <a><img></a>
 * After addVmdSuffix, this becomes <Avmd><Imgvmd></Imgvmd></Avmd>
 * But the parsing order can be wrong, so we need to fix it
 */
export function fixLinkedImages(html: string): string {
  // Pattern to match incorrectly ordered tags: <Pvmd></Avmd><Imgvmd>...</Imgvmd><Pvmd><Avmd...>
  // This happens when the link renderer splits the content incorrectly
  const brokenPattern = /<Pvmd><\/Avmd><Imgvmd([^>]*)><\/Imgvmd><\/Pvmd><Pvmd><Avmd([^>]*)>/g;

  html = html.replace(brokenPattern, (match, imgAttrs, linkAttrs) => {
    return `<Avmd${linkAttrs}><Imgvmd${imgAttrs}></Imgvmd></Avmd>`;
  });

  // Also fix cases where Imgvmd appears outside of Avmd when it should be inside
  // Pattern: <Avmd...></Avmd>...<Imgvmd...></Imgvmd> (when they should be nested)
  const imgPattern = /<Imgvmd([^>]*)><\/Imgvmd>/g;
  const imgMatches: Array<{ full: string; attrs: string; index: number }> = [];
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    imgMatches.push({ full: imgMatch[0], attrs: imgMatch[1], index: imgMatch.index });
  }

  // Check each image to see if it should be inside a preceding link
  for (const img of imgMatches.reverse()) { // Process from end to avoid index shifting
    // Look backwards for a link that might contain this image
    const beforeImg = html.substring(0, img.index);
    const afterImg = html.substring(img.index + img.full.length);

    // Pattern to find <Avmd...></Avmd> immediately before the image
    const linkPattern = /<Avmd([^>]*)><\/Avmd>\s*$/;
    const linkMatch = beforeImg.match(linkPattern);

    if (linkMatch) {
      // The image should be inside this link
      const linkAttrs = linkMatch[1];
      const beforeLink = beforeImg.substring(0, beforeImg.length - linkMatch[0].length);
      html = beforeLink + `<Avmd${linkAttrs}>${img.full}</Avmd>` + afterImg;
    }
  }

  return html;
}

/**
 * Unwrap invalid nesting of block elements inside paragraphs
 */
export function unwrapInvalidNesting(html: string): string {
  const blockTags = ['Imgvmd', 'Ulvmd', 'Olvmd', 'Blockcodevmd', 'Blockmathvmd', 'Blockquotevmd', 'Infovmd', 'Warningvmd', 'Successvmd', 'Postvmd', 'Lftvmd', 'Rtvmd', 'Divvmd'];
  const blockPattern = blockTags.join('|');

  let processedHtml = html;
  const pvmdRegex = /<Pvmd>([\s\S]*?)<\/Pvmd>/g;

  processedHtml = processedHtml.replace(pvmdRegex, (match, content) => {
    const hasBlock = new RegExp(`<(${blockPattern})[\\s\\S]*?>`, 'i').test(content);
    if (!hasBlock) return match;

    const tagRegex = new RegExp(`(<(${blockPattern})\\b[^>]*>([\\s\\S]*?<\\/\\2>))`, 'gi');
    const newContent = content.replace(tagRegex, (blockMatch: string) => {
      return `</Pvmd>${blockMatch}<Pvmd>`;
    });
    return `<Pvmd>${newContent}</Pvmd>`;
  });

  return processedHtml.replace(/<Pvmd>\s*<\/Pvmd>/g, '');
}

/**
 * Inject meta component for page dates
 */
export function injectMetaComponent(
  html: string,
  attributes: {
    created_at?: string;
    last_updated_at?: string;
    author?: string;
  }
): string {
  if (!attributes.created_at && !attributes.last_updated_at && !attributes.author) {
    return html;
  }

  const published = attributes.created_at ? ` publishedAt="${escapeHtml(attributes.created_at)}"` : '';
  const updated = attributes.last_updated_at ? ` updatedAt="${escapeHtml(attributes.last_updated_at)}"` : '';
  const author = attributes.author ? ` author="${escapeHtml(attributes.author)}"` : '';

  const metaComponent = `<PageDates${published}${updated}${author} />\n`;

  const h1Regex = /<H1vmd[^>]*>[\s\S]*?<\/H1vmd>/;
  const match = html.match(h1Regex);

  if (match) {
    const splitIndex = match.index! + match[0].length;
    return html.slice(0, splitIndex) + '\n' + metaComponent + html.slice(splitIndex);
  } else {
    return metaComponent + html;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;');
}
