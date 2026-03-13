import { marked } from 'marked';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AssetProcessor } from './asset_processor';
import { CONFIG } from './config';
import { escapeHtml, capitalize } from './utils';
import { ProcessedMarkdown, ImageReference, FrontMatterAttributes } from './types';
import { createPostBlock, createCustomBlock, smallImgExtension, boldItalicExtension, blockMathExtension, inlineMathExtension, setFullSource, clearFullSource } from './markdown_extentions';
import { VmdErrorCode, createVmdError, ErrorLocation, VmdError } from './errors';

export class MarkdownCompiler {
    private assetProcessor: AssetProcessor;
    private projectRoot: string;
    private generatedFiles: string[] = [];
    private usedImages: ImageReference[] = [];
    private currentFile: string = '';
    private currentMarkdownBody: string = '';
    private frontmatterLineOffset: number = 0;

    constructor(assetProcessor: AssetProcessor, projectRoot: string) {
        this.assetProcessor = assetProcessor;
        this.projectRoot = projectRoot;
    }

    private getLineNumberByContent(content: string): number {
        if (!this.currentMarkdownBody) return 1 + this.frontmatterLineOffset;
        const index = this.currentMarkdownBody.indexOf(content);
        if (index === -1) return 1 + this.frontmatterLineOffset;
        const textBefore = this.currentMarkdownBody.substring(0, index);
        return (textBefore.match(/\n/g) || []).length + 1 + this.frontmatterLineOffset;
    }

    /**
     * Get the actual line number in the full markdown file (including frontmatter)
     */
    private getActualLineNumber(bodyLineNumber: number): number {
        return bodyLineNumber + this.frontmatterLineOffset;
    }

    public compile(markdownBody: string, attributes: FrontMatterAttributes, filePath?: string, frontmatterLineCount?: number): ProcessedMarkdown {
        this.currentFile = filePath || '';
        this.currentMarkdownBody = markdownBody;
        // Calculate frontmatter line offset: frontmatter lines + 1 (for the closing --- line)
        // The body starts after the frontmatter block
        this.frontmatterLineOffset = frontmatterLineCount || 0;
        this.resetState();

        const location: ErrorLocation = filePath ? { file: filePath } : {};

        try {
            // Pre-validation: check for nested code blocks
            this.detectNestedCodeBlocks(markdownBody);
            
            // Pre-validation: check for single backtick code blocks (only inside other blocks)
            this.detectSingleBacktickCodeBlocks(markdownBody);
            
            // Pre-validation: check for invalid tag nesting in custom blocks
            this.detectInvalidTagNesting(markdownBody);

            // Store full source for extensions to calculate line numbers
            // Pass the full source with frontmatter for accurate line number calculation
            if (filePath) {
                setFullSource(filePath, markdownBody, this.frontmatterLineOffset);
            }

            // Save tokens for debugging (before any processing that might fail)
            this.saveTokens(markdownBody, filePath);

            this.configureMarked();

            const rawHtml = marked.parse(markdownBody) as string;
            let vmdHtml = this.transformHtml(rawHtml);
            
            // Post-validation: check for empty markup elements
            this.detectEmptyMarkup(vmdHtml);
            
            vmdHtml = this.injectMetaComponent(vmdHtml, attributes);

            // Clean up full source storage
            if (filePath) {
                clearFullSource(filePath);
            }

            return {
                html: vmdHtml,
                generatedFiles: [...this.generatedFiles],
                usedImages: [...this.usedImages]
            };
        } catch (err) {
            // Clean up full source storage on error too
            if (filePath) {
                clearFullSource(filePath);
            }
            
            if (err instanceof VmdError) {
                throw err;
            }
            
            // Sanitize error message - remove marked's "report to" text and replace with v0plex's
            let errorMessage = err instanceof Error ? err.message : String(err);
            errorMessage = errorMessage.replace(
                /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
                'If you have questions, please report to https://github.com/sjl473/v0plex'
            );
            
            throw createVmdError(
                VmdErrorCode.MARKDOWN_COMPILE_ERROR,
                { details: errorMessage },
                location,
                undefined,
                err instanceof Error ? err : undefined
            );
        }
    }

    private resetState() {
        this.generatedFiles = [];
        this.usedImages = [];
    }

    /**
     * Save marked lexer tokens to public/vmdtoken for debugging
     * Only enabled when CONFIG.ENABLE_TOKEN_GENERATION is true
     * Adds line numbers to each token based on frontmatter offset
     */
    private saveTokens(markdownBody: string, filePath?: string): void {
        if (!filePath || !CONFIG.ENABLE_TOKEN_GENERATION) return;
        
        try {
            // Get tokens from marked lexer
            const tokens = marked.lexer(markdownBody);
            
            // Add line numbers to tokens
            const tokensWithLineNumbers = this.addLineNumbersToTokens(tokens, markdownBody);
            
            // Create vmdtoken directory
            const tokenDir = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_TOKEN_DIR);
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
    private addLineNumbersToTokens(tokens: any[], source: string): any[] {
        let currentPos = 0;
        
        return tokens.map(token => {
            // Find the position of this token's raw text in the source
            const tokenStartPos = source.indexOf(token.raw, currentPos);
            if (tokenStartPos !== -1) {
                currentPos = tokenStartPos + token.raw.length;
                
                // Calculate line number
                const textBefore = source.substring(0, tokenStartPos);
                const bodyLineNumber = (textBefore.match(/\n/g) || []).length + 1;
                const actualLineNumber = bodyLineNumber + this.frontmatterLineOffset;
                
                // Create enhanced token with line number
                const enhancedToken = {
                    ...token,
                    lineNumber: actualLineNumber,
                    bodyLineNumber: bodyLineNumber
                };
                
                // Recursively add line numbers to nested tokens
                if (token.tokens && Array.isArray(token.tokens)) {
                    enhancedToken.tokens = this.addLineNumbersToTokens(token.tokens, source);
                }
                if (token.items && Array.isArray(token.items)) {
                    enhancedToken.items = token.items.map((item: any) => {
                        if (item.tokens && Array.isArray(item.tokens)) {
                            return {
                                ...item,
                                tokens: this.addLineNumbersToTokens(item.tokens, source)
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

    private getLocation(): ErrorLocation {
        return this.currentFile ? { file: this.currentFile } : {};
    }

    private configureMarked() {
        const self = this;

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

                // Validate image exists
                self.assetProcessor.validateImageExists(href, self.getLocation());

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
                    throw createVmdError(
                        VmdErrorCode.CODE_FILE_WRITE_ERROR,
                        { details: err instanceof Error ? err.message : String(err) },
                        self.getLocation()
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
                    throw createVmdError(
                        VmdErrorCode.CODE_FILE_WRITE_ERROR,
                        { details: err instanceof Error ? err.message : String(err) },
                        self.getLocation()
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

        marked.use({
            renderer,
            extensions: [
                createCustomBlock('info'),
                createCustomBlock('warning'),
                createCustomBlock('success'),
                createPostBlock(this.assetProcessor, CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
                smallImgExtension(this.assetProcessor, CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
                boldItalicExtension,
                blockMathExtension,
                inlineMathExtension
            ]
        });
    }

    private transformHtml(html: string): string {
        let vmdHtml = this.addVmdSuffix(html);
        vmdHtml = this.fixLinkedImages(vmdHtml);
        vmdHtml = this.unwrapInvalidNesting(vmdHtml);
        return vmdHtml;
    }

    /**
     * Fix the order of linked images
     * When Markdown has [![alt](img)](url), marked produces <a><img></a>
     * After addVmdSuffix, this becomes <Avmd><Imgvmd></Imgvmd></Avmd>
     * But the parsing order can be wrong, so we need to fix it
     */
    private fixLinkedImages(html: string): string {
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

    private addVmdSuffix(html: string): string {
        const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        const customTags = ['blockcodevmd', 'inlinecodevmd', 'blockmathvmd', 'inlinemathvmd', 'imgvmd', 'infovmd', 'warningvmd', 'successvmd', 'postvmd', 'lftvmd', 'rtvmd'];

        return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, rest) => {
            const tagLower = tagName.toLowerCase();

            if (tagLower === 'img' || tagLower === 'imgvmd') {
                rest = rest.replace(/src=(["'])(.*?)\1/, (srcMatch: string, quote: string, srcValue: string) => {
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

        const h1Regex = /<H1vmd[^>]*>[\s\S]*?<\/H1vmd>/;
        const match = html.match(h1Regex);

        if (match) {
            const splitIndex = match.index! + match[0].length;
            return html.slice(0, splitIndex) + '\n' + metaComponent + html.slice(splitIndex);
        } else {
            return metaComponent + html;
        }
    }

    private detectNestedCodeBlocks(body: string): void {
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
                    const actualLine = this.getActualLineNumber(i + 1);
                    throw createVmdError(
                        VmdErrorCode.MARKDOWN_NESTED_CODE_BLOCK,
                        { line: actualLine, expected: backtickCount, found: ticks },
                        { ...this.getLocation(), line: actualLine }
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
    private detectSingleBacktickCodeBlocks(body: string): void {
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
                const actualLine = this.getActualLineNumber(i + 1);
                throw createVmdError(
                    VmdErrorCode.MARKDOWN_SINGLE_BACKTICK_CODEBLOCK,
                    { line: actualLine },
                    { ...this.getLocation(), line: actualLine }
                );
            }
        }
    }

    /**
     * Detect invalid tag nesting: <post>, <lft>, <rt> cannot be nested inside other custom blocks
     * Also checks that these tags are not nested inside each other incorrectly
     */
    private detectInvalidTagNesting(body: string): void {
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
                            const actualLine = this.getActualLineNumber(i + 1);
                            throw createVmdError(
                                VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING,
                                {
                                    outerTag: block.tag,
                                    innerTag: tagName,
                                    line: actualLine
                                },
                                { ...this.getLocation(), line: actualLine }
                            );
                        }
                    }
                    
                    // lft and rt can only be inside post
                    if (postOnlyTags.includes(tagName)) {
                        const isInsidePost = blockStack.some(b => b.tag === 'post');
                        if (!isInsidePost) {
                            const actualLine = this.getActualLineNumber(i + 1);
                            throw createVmdError(
                                VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING,
                                {
                                    outerTag: 'none (root level)',
                                    innerTag: tagName,
                                    line: actualLine
                                },
                                { ...this.getLocation(), line: actualLine }
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

    private detectEmptyMarkup(html: string): void {
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
}
