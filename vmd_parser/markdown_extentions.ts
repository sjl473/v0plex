import path from 'path';
import { escapeHtml, capitalize } from './utils';

// We use 'any' for the 'this' context here to allow access to both 
// this.lexer (in tokenizer) and this.parser (in renderer) without 
// triggering strict interface mismatches with the marked library.

export const createPostBlock = () => {
  return {
    name: 'post',
    level: 'block' as const,
    start(src: string) {
      return src.match(/^<post>/m) ? src.indexOf('<post>') : -1;
    },
    tokenizer(this: any, src: string, tokens: any[]) {
      const rule = /^<post>([\s\S]*?)<\/post>/;
      const match = rule.exec(src);
      if (match) {
        const fullContent = match[1];

        const lftRegex = /<lft>([\s\S]*?)<\/lft>/;
        const rtRegex = /<rt>([\s\S]*?)<\/rt>/;

        const lftMatch = lftRegex.exec(fullContent);
        const rtMatch = rtRegex.exec(fullContent);

        if (!lftMatch || !rtMatch) {
            throw new Error("Post block must contain both <lft> and <rt> tags.");
        }

        const lftContent = lftMatch[1].trim();
        const rtContent = rtMatch[1].trim();
        let rtTokens: any[] = [];

        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let manualMatch;
        let manualCount = 0;
        let lastIndex = 0;

        while ((manualMatch = imageRegex.exec(rtContent)) !== null) {
            const preText = rtContent.substring(lastIndex, manualMatch.index);
            if (preText.trim().length > 0) {
                throw new Error(`Post <rt> allows only images. Found text: '${preText.trim()}'`);
            }

            const altText = manualMatch[1];
            const srcUrl = manualMatch[2];

            if (!altText) {
                throw new Error("Post <rt> images must have alt text.");
            }

            let href = srcUrl;
            let title = null;
            const titleMatch = srcUrl.match(/^(\S+)\s+"(.*)"$/);
            if (titleMatch) {
                href = titleMatch[1];
                title = titleMatch[2];
            }

            rtTokens.push({
                type: 'image', raw: manualMatch[0], text: altText, href: href, title: title
            });

            manualCount++;
            lastIndex = imageRegex.lastIndex;
        }

        if (lastIndex < rtContent.length) {
            const tail = rtContent.substring(lastIndex);
            if (tail.trim().length > 0) {
                throw new Error(`Post <rt> allows only images. Found text at end: '${tail.trim()}'`);
            }
        }

        if (manualCount === 0) {
            throw new Error(`Post <rt> must contain at least one image.`);
        }

        const token = {
            type: 'post', 
            raw: match[0], 
            lftTokens: [] as any[], // Explicit cast to avoid never[] error
            rtTokens: rtTokens
        };

        this.lexer.blockTokens(lftContent, token.lftTokens);

        return token;
      }
    },
    renderer(this: any, token: any) {
        const lftHtml = this.parser.parse(token.lftTokens);
        const rtHtml = this.parser.parseInline(token.rtTokens);
        return `<Postvmd>\n<Lftvmd>\n${lftHtml}</Lftvmd>\n<Rtvmd>\n${rtHtml}</Rtvmd>\n</Postvmd>\n`;
    }
  };
};

export const createCustomBlock = (name: string) => {
    return {
        name: name,
        level: 'block' as const,
        start(src: string) {
            return src.indexOf(`<${name}>`);
        },
        tokenizer(this: any, src: string, tokens: any[]) {
            const startTag = `<${name}>`;
            const endTag = `</${name}>`;

            if (!src.startsWith(startTag)) return;

            let depth = 0;
            let startIndex = 0;
            let endIndex = -1;

            let i = 0;
            while (i < src.length) {
                if (src.startsWith(startTag, i)) {
                    depth++;
                    i += startTag.length;
                } else if (src.startsWith(endTag, i)) {
                    depth--;
                    i += endTag.length;
                    if (depth === 0) {
                        endIndex = i;
                        break;
                    }
                } else {
                    i++;
                }
            }

            if (endIndex !== -1) {
                const raw = src.substring(0, endIndex);
                const content = raw.substring(startTag.length, raw.length - endTag.length);

                const token = {
                    type: name, 
                    raw: raw, 
                    text: content.trim(), 
                    tokens: [] as any[] // Explicit cast to avoid never[] error
                };
                this.lexer.inline(token.text, token.tokens);
                return token;
            }
        },
        renderer(this: any, token: any) {
            const capitalizedName = capitalize(name);
            return `<${capitalizedName}vmd>${this.parser.parseInline(token.tokens)}</${capitalizedName}vmd>\n`;
        }
    };
};

export const smallImgExtension = (assetProcessor: any, imageWebPrefix: string) => ({
    name: 'smallImg', 
    level: 'inline' as const, 
    start(src: string) {
        return src.indexOf('<smallimg>');
    }, 
    tokenizer(src: string, tokens: any[]) {
        const rule = /^<smallimg>\s*!\[(.*?)\]\((.*?)\)\s*<\/?smallimg>/;
        const match = rule.exec(src);
        if (match) {
            return {
                type: 'smallImg', raw: match[0], alt: match[1], href: match[2]
            };
        }
    },
    renderer(token: any) {
        let src = token.href;
        let originalName = decodeURIComponent(path.basename(src));
        const hashName = assetProcessor.getHashedImageName(originalName);

        if (hashName) {
            src = `${imageWebPrefix}${hashName}`;
        }
        return `<Smallimgvmd src="${src}" alt="${escapeHtml(token.alt)}"></Smallimgvmd>`;
    }
});

export const boldItalicExtension = {
    name: 'boldItalic', 
    level: 'inline' as const, 
    start(src: string) {
        return src.match(/\*\*\*[^*]/) ? src.indexOf('***') : -1;
    }, 
    tokenizer(src: string, tokens: any[]) {
        const rule = /^\*\*\*(\S[\s\S]*?\S)\*\*\*(?!\*)/;
        const match = rule.exec(src);
        if (match) {
            return {type: 'boldItalic', raw: match[0], text: match[1]};
        }
    }, 
    renderer(token: any) {
        return `<boldit>${token.text}</boldit>`;
    }
};

export const blockMathExtension = {
    name: 'blockMath', 
    level: 'block' as const, 
    start(src: string) {
        return src.indexOf('$$');
    }, 
    tokenizer(src: string, tokens: any[]) {
        const rule = /^\$\$([\s\S]+?)\$\$/;
        const match = rule.exec(src);
        if (match) {
            return {type: 'blockMath', raw: match[0], text: match[1].trim()};
        }
    }, 
    renderer(token: any) {
        return `<Blockmathvmd formula="${escapeHtml(token.text)}"></Blockmathvmd>`;
    }
};

export const inlineMathExtension = {
    name: 'inlineMath', 
    level: 'inline' as const, 
    start(src: string) {
        return src.indexOf('$');
    }, 
    tokenizer(src: string, tokens: any[]) {
        const rule = /^\$([^$\n]+?)\$/;
        const match = rule.exec(src);
        if (match) {
            return {type: 'inlineMath', raw: match[0], text: match[1].trim()};
        }
    }, 
    renderer(token: any) {
        return `<Inlinemathvmd formula="${escapeHtml(token.text)}"></Inlinemathvmd>`;
    }
};