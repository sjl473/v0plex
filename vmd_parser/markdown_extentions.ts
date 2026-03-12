import path from 'path';
import { escapeHtml, capitalize } from './utils';
import { VmdErrorCode, createVmdError, ErrorLocation } from './errors';

// Global store for full source per file
const fullSourceStore: Map<string, string> = new Map();

export function setFullSource(filePath: string, source: string): void {
  fullSourceStore.set(filePath, source);
}

export function clearFullSource(filePath: string): void {
  fullSourceStore.delete(filePath);
}

function getFileLocation(context: any): ErrorLocation {
  const location: ErrorLocation = {};
  if (context && context.lexer) {
    if (context.lexer.filePath) {
      location.file = context.lexer.filePath;
    }
  }
  return location;
}

/**
 * Code region detector
 * Returns true if the given position is inside any code context:
 * - Fenced code block (```...```)
 * - Inline code (`...`)
 */
function isPositionInCode(source: string, position: number): boolean {
  // First, identify all fenced code block regions
  const fencedBlocks: Array<[number, number]> = [];
  const lines = source.split('\n');
  let charPos = 0;
  let fencedStart: number | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (/^```+/.test(trimmedLine)) {
      if (fencedStart === null) {
        fencedStart = charPos;
      } else {
        fencedBlocks.push([fencedStart, charPos + line.length + 1]); // +1 for newline
        fencedStart = null;
      }
    }
    charPos += line.length + 1; // +1 for newline
  }
  
  // Check if position is in a fenced block
  for (const [start, end] of fencedBlocks) {
    if (position >= start && position < end) {
      return true;
    }
  }
  
  // If not in fenced block, check for inline code
  // Find all inline code regions (not inside fenced blocks)
  const inlineCodeRegex = /`[^`]*`/g;
  let match;
  while ((match = inlineCodeRegex.exec(source)) !== null) {
    // Skip if this inline code is inside a fenced block
    let inFenced = false;
    for (const [start, end] of fencedBlocks) {
      if (match.index >= start && match.index < end) {
        inFenced = true;
        break;
      }
    }
    if (!inFenced) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      if (position > matchStart && position < matchEnd) {
        return true;
      }
    }
  }
  
  return false;
}

// Tags that are protected and cannot be nested inside other custom blocks
const PROTECTED_TAGS = ['post', 'lft', 'rt'];

// Tags that can only appear inside <post>
const POST_ONLY_TAGS = ['lft', 'rt'];

// Container tags that cannot contain protected tags
const CONTAINER_TAGS = ['info', 'warning', 'success', 'smallimg'];

// Calculate line number by counting newlines in text before a position
function getLineAtPosition(fullSource: string, position: number): number {
  const textBefore = fullSource.substring(0, position);
  return (textBefore.match(/\n/g) || []).length + 1;
}

/**
 * Check if content contains protected tags that would be invalid nesting
 * Returns the first invalid tag found, or null if valid
 * This checks direct nesting - protected tags cannot be inside container tags
 */
function checkInvalidNesting(content: string, parentTag: string): { tag: string; line: number } | null {
  const lines = content.split('\n');
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for code block boundaries - skip content inside code blocks
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }
    
    // Skip content inside code blocks (```...```)
    if (inCodeBlock) {
      continue;
    }
    
    // Check for opening of protected tags
    // Use word boundary to ensure we match complete tag names
    for (const tag of PROTECTED_TAGS) {
      // Match tag at the start of line (possibly with whitespace), not just anywhere in the line
      const openRegex = new RegExp(`^\\s*<${tag}\\b[^>]*>`, 'i');
      if (openRegex.test(trimmedLine)) {
        // Check if parent is a container tag (which cannot contain protected tags)
        if (CONTAINER_TAGS.includes(parentTag.toLowerCase())) {
          return { tag, line: i + 1 };
        }
        
        // Check if it's lft or rt outside of post
        if (POST_ONLY_TAGS.includes(tag) && parentTag.toLowerCase() !== 'post') {
          return { tag, line: i + 1 };
        }
      }
    }
  }
  
  return null;
}

/**
 * Check if content contains single backtick at line start (invalid for VMD)
 * Inside code blocks (```...```) is allowed
 * Note: single ` for inline code is allowed, but not as a code block delimiter
 */
function checkSingleBacktickInContent(content: string): number | null {
  const lines = content.split('\n');
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for code block boundaries
    const codeBlockMatch = line.match(/^(```+)(\w*)/);
    if (codeBlockMatch) {
      const ticks = codeBlockMatch[1].length;
      if (ticks >= 3) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
    }
    
    // Skip content inside code blocks
    if (inCodeBlock) {
      continue;
    }
    
    // Check for single backtick at start of line followed by content
    // This indicates someone trying to use ` as a code block delimiter
    // Pattern: line starts with ` followed by non-whitespace, non-backtick content
    if (/^`[^\s`]/.test(trimmedLine)) {
      return i + 1;
    }
  }
  
  return null;
}

/**
 * Validate that inline code (single `) does not contain protected tags
 */
function validateInlineCode(content: string, location: ErrorLocation): void {
  for (const tag of PROTECTED_TAGS) {
    const tagRegex = new RegExp(`</?${tag}\\b[^>]*>`, 'i');
    if (tagRegex.test(content)) {
      throw createVmdError(
        VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING,
        {
          outerTag: 'inline code (`...`)',
          innerTag: tag,
          line: location.line || 1
        },
        location
      );
    }
  }
}

// Find position of a substring within full source, starting from a given offset
function findPosition(fullSource: string, searchText: string, startOffset: number = 0): number {
  return fullSource.indexOf(searchText, startOffset);
}

export const createPostBlock = (assetProcessor?: any, imageWebPrefix?: string, filePath?: string) => {
  return {
    name: 'post',
    level: 'block' as const,
    start(src: string) {
      // Check if this potential match is inside a code block
      // by using the proper code block detection function
      let pos = src.indexOf('<post>');
      while (pos !== -1) {
        if (!isPositionInCode(src, pos)) {
          return pos;
        }
        // Inside code block, look for next occurrence
        const nextPos = src.indexOf('<post>', pos + 1);
        if (nextPos === pos) break;
        pos = nextPos;
      }
      return -1;
    },
    tokenizer(this: any, src: string, tokens: any[]) {
      // Set filePath on lexer if provided
      if (filePath && this.lexer && !this.lexer.filePath) {
        this.lexer.filePath = filePath;
      }
      const rule = /^<post>([\s\S]*?)<\/post>/;
      const match = rule.exec(src);
      if (match) {
      // Check if this match is inside a code block
      // Get the position of this match in the full source
      const location: ErrorLocation = getFileLocation(this);
      let isInCodeBlock = false;
      
      // First check using the full source if available
      if (location.file) {
        const fullSource = fullSourceStore.get(location.file);
        if (fullSource) {
          // Find position of this match in full source
          const matchText = match[0];
          const pos = fullSource.indexOf(matchText);
          if (pos !== -1) {
            isInCodeBlock = isPositionInCode(fullSource, pos);
          }
        }
      }
      
      // Also check the src parameter (which might be a substring of full source)
      if (!isInCodeBlock) {
        const postPos = src.indexOf('<post>');
        if (postPos !== -1) {
          isInCodeBlock = isPositionInCode(src, postPos);
        }
      }
      
      if (isInCodeBlock) {
        return undefined;
      }
        const fullContent = match[1];
        // location already defined above
        
        // Calculate base position of this post block in the full source
        let postBlockStartPos = 0;
        if (location.file) {
          const fullSource = fullSourceStore.get(location.file);
          if (fullSource) {
            // Find where this specific match starts in the full source
            // We need to search for the exact match text
            const matchText = match[0];
            postBlockStartPos = fullSource.indexOf(matchText);
            if (postBlockStartPos !== -1) {
              location.line = getLineAtPosition(fullSource, postBlockStartPos);
            }
          }
        }

        const lftRegex = /<lft>([\s\S]*?)<\/lft>/;
        const rtRegex = /<rt>([\s\S]*?)<\/rt>/;

        const lftMatch = lftRegex.exec(fullContent);
        const rtMatch = rtRegex.exec(fullContent);

        if (!lftMatch || !rtMatch) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_MISSING_TAGS,
            {},
            location
          );
        }

        // Validate spacing: exactly one space between post and lft
        const beforeLft = fullContent.substring(0, fullContent.indexOf('<lft>'));
        if (beforeLft !== ' ' && beforeLft !== '\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_INVALID_FORMAT,
            { message: 'Must have exactly one space or newline between <post> and <lft>' },
            location
          );
        }

        // Validate spacing: exactly one space between </lft> and <rt>
        const afterLft = fullContent.substring(
          fullContent.indexOf('</lft>') + 6,
          fullContent.indexOf('<rt>')
        );
        if (afterLft !== ' ' && afterLft !== '\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_INVALID_FORMAT,
            { message: 'Must have exactly one space or newline between </lft> and <rt>' },
            location
          );
        }

        // Validate spacing: exactly one space between </rt> and </post>
        const afterRt = fullContent.substring(fullContent.indexOf('</rt>') + 5);
        if (afterRt !== ' ' && afterRt !== '\n' && afterRt !== '') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_INVALID_FORMAT,
            { message: 'Must have exactly one space or newline between </rt> and </post>' },
            location
          );
        }

        const lftContent = lftMatch[1];
        const rtContent = rtMatch[1];

        // Calculate line number for lft content
        let lftLineNumber = location.line || 1;
        if (location.file && postBlockStartPos !== -1) {
          const fullSource = fullSourceStore.get(location.file);
          if (fullSource) {
            const lftRelativePos = match[0].indexOf('<lft>');
            if (lftRelativePos !== -1) {
              const lftAbsolutePos = postBlockStartPos + lftRelativePos;
              lftLineNumber = getLineAtPosition(fullSource, lftAbsolutePos);
            }
          }
        }
        const lftLocation: ErrorLocation = { ...location, line: lftLineNumber };

        // Validate lft content:
        // 1. Check for code blocks (```)
        const codeBlockRegex = /```[\s\S]*?```/g;
        if (codeBlockRegex.test(lftContent)) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_CODE_BLOCK,
            { line: lftLineNumber },
            lftLocation
          );
        }

        // 2. Check for block math ($$...$$)
        const blockMathRegex = /\$\$[\s\S]*?\$\$/g;
        if (blockMathRegex.test(lftContent)) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_BLOCK_MATH,
            { line: lftLineNumber },
            lftLocation
          );
        }

        // 3. Check for images (![...](...))
        const lftImageRegex = /!\[.*?\]\(.*?\)/g;
        if (lftImageRegex.test(lftContent)) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_IMAGE,
            { line: lftLineNumber },
            lftLocation
          );
        }

        // 4. Check for blockquotes (> ...)
        const blockquoteRegex = /^[ \t]*>/m;
        if (blockquoteRegex.test(lftContent)) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_BLOCKQUOTE,
            { line: lftLineNumber },
            lftLocation
          );
        }

        // 5. Check for disallowed HTML tags (post, lft, rt, info, warning, success)
        const disallowedTags = ['post', 'lft', 'rt', 'info', 'warning', 'success', 'smallimg'];
        const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        let tagMatch;
        while ((tagMatch = tagRegex.exec(lftContent)) !== null) {
          const tagName = tagMatch[2].toLowerCase();
          if (disallowedTags.includes(tagName)) {
            throw createVmdError(
              VmdErrorCode.EXTENSION_POST_LFT_DISALLOWED_TAG,
              { tag: tagName },
              lftLocation
            );
          }
        }

        // Validate lft content spacing: exactly two newlines after <lft> and before </lft>
        const lftTrimmedStart = lftContent.match(/^(\s*)/)?.[0] || '';
        const lftTrimmedEnd = lftContent.match(/(\s*)$/)?.[0] || '';
        
        // Check there's exactly two newlines (one empty line) after <lft>
        if (lftTrimmedStart !== '\n\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING,
            { message: 'Must have exactly one empty line after <lft>', line: lftLineNumber },
            lftLocation
          );
        }
        
        // Check there's exactly two newlines (one empty line) before </lft>
        if (lftTrimmedEnd !== '\n\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING,
            { message: 'Must have exactly one empty line before </lft>', line: lftLineNumber },
            lftLocation
          );
        }

        // Calculate exact line number for <rt> tag
        let rtLineNumber = location.line || 1;
        if (location.file && postBlockStartPos !== -1) {
          const fullSource = fullSourceStore.get(location.file);
          if (fullSource) {
            // Find position of <rt> within the post block
            const rtRelativePos = match[0].indexOf('<rt>');
            if (rtRelativePos !== -1) {
              const rtAbsolutePos = postBlockStartPos + rtRelativePos;
              rtLineNumber = getLineAtPosition(fullSource, rtAbsolutePos);
            }
          }
        }
        const rtLocation: ErrorLocation = { ...location, line: rtLineNumber };

        let rtTokens: any[] = [];

        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let manualMatch;
        let manualCount = 0;
        let lastIndex = 0;

        // First pass: count images before validating spacing
        // This ensures we report "no images" error before spacing errors
        const tempImageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let hasAnyImage = false;
        while (tempImageRegex.exec(rtContent) !== null) {
          hasAnyImage = true;
          break;
        }
        
        if (!hasAnyImage) {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_RT_INVALID_SPACING,
            { message: 'No images found in <rt> section' },
            rtLocation
          );
        }

        // Validate rt content spacing: exactly two newlines after <rt> and before </rt>
        const rtTrimmedStart = rtContent.match(/^(\s*)/)?.[0] || '';
        const rtTrimmedEnd = rtContent.match(/(\s*)$/)?.[0] || '';
        
        // Check there's exactly two newlines (one empty line) after <rt>
        if (rtTrimmedStart !== '\n\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_RT_INVALID_SPACING,
            { message: 'Must have exactly one empty line after <rt>' },
            rtLocation
          );
        }
        
        // Check there's exactly two newlines (one empty line) before </rt>
        if (rtTrimmedEnd !== '\n\n') {
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_RT_INVALID_SPACING,
            { message: 'Must have exactly one empty line before </rt>' },
            rtLocation
          );
        }

        while ((manualMatch = imageRegex.exec(rtContent)) !== null) {
          const preText = rtContent.substring(lastIndex, manualMatch.index);
          // Check that content before image is only whitespace (newlines and spaces/tabs)
          // No other text content is allowed in <rt> except images
          const preTextTrimmedEnd = preText.replace(/[ \t]+$/gm, '');
          
          if (manualCount === 0) {
            // First image: preText should only contain the opening newlines (\n\n)
            // and optionally some spaces/tabs for indentation
            if (!/^[ \t\n]*$/.test(preText)) {
              throw createVmdError(
                VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
                { message: '<rt> can only contain images, no other text allowed', content: preText.trim() },
                rtLocation
              );
            }
          } else {
            // For subsequent images (not the first one), must end with at least one newline
            // and should not contain any other non-whitespace text
            if (!/\n$/.test(preTextTrimmedEnd)) {
              throw createVmdError(
                VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
                { message: 'Each image in <rt> must be on its own line (separated by newline)' },
                rtLocation
              );
            }
            // Check that there's no extra text between images (only whitespace allowed)
            const textBetweenImages = preTextTrimmedEnd.replace(/\n/g, '').trim();
            if (textBetweenImages) {
              throw createVmdError(
                VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
                { message: '<rt> can only contain images, no other text allowed between images', content: textBetweenImages },
                rtLocation
              );
            }
          }

          const altText = manualMatch[1];
          const srcUrl = manualMatch[2];

          if (!altText) {
            throw createVmdError(
              VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
              { message: 'Image missing alt text', src: srcUrl },
              rtLocation
            );
          }

          if (assetProcessor) {
            try {
              assetProcessor.validateImageExists(srcUrl, rtLocation);
            } catch (err) {
              throw err;
            }
          }

          rtTokens.push({
            type: 'postImage',
            alt: altText,
            src: srcUrl,
            raw: manualMatch[0]
          });

          manualCount++;
          lastIndex = manualMatch.index + manualMatch[0].length;
        }

        const remainingText = rtContent.substring(lastIndex);
        // Remaining content after last image must only be whitespace (optionally with trailing spaces/tabs)
        if (!/^[ \t\n]*$/.test(remainingText)) {
          const trimmedRemaining = remainingText.trim();
          // Check if it's text on the same line or new line
          const hasNewlineBefore = remainingText.match(/^[^\n]*/)?.[0]?.length === 0 || remainingText.startsWith('\n');
          if (hasNewlineBefore) {
            throw createVmdError(
              VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
              { message: '<rt> can only contain images, no other text allowed', content: trimmedRemaining },
              rtLocation
            );
          } else {
            throw createVmdError(
              VmdErrorCode.EXTENSION_POST_INVALID_CONTENT,
              { message: '<rt> can only contain images, text found after image on same line', content: trimmedRemaining },
              rtLocation
            );
          }
        }

        // Parse lft content into tokens for renderer
        const lftTokens = this.lexer.blockTokens(lftContent.trim());
        
        return {
          type: 'post',
          raw: match[0],
          lft: lftTokens,
          rt: rtTokens,
          text: match[0]
        };
      }
      return undefined;
    },
    renderer(this: any, token: any) {
      // token.lft is already tokens array from tokenizer
      const lftParsed = this.parser.parse(token.lft);
      const rtImages = token.rt
        .map((img: any) => {
          // Convert image src to hash path if available
          let src = img.src;
          if (assetProcessor && imageWebPrefix) {
            const originalName = decodeURIComponent(path.basename(img.src));
            const hashName = assetProcessor.getHashedImageName(originalName);
            if (hashName) {
              src = `${imageWebPrefix}${hashName}`;
            }
          }
          return `<Imgvmd src="${src}" alt="${img.alt}"></Imgvmd>`;
        })
        .join('\n');

      return `<Postvmd>\n<Lftvmd>\n${lftParsed}</Lftvmd>\n<Rtvmd>\n${rtImages}\n</Rtvmd>\n</Postvmd>\n`;
    }
  };
};

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
          fullSource = fullSourceStore.get(location.file);
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
          // Calculate line number from the match position
          let line = location.line || 1;
          if (fullSource && matchPos !== -1) {
            line = getLineAtPosition(fullSource, matchPos);
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
