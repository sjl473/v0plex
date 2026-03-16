/**
 * Post block extension for VMD
 * Handles <post><lft>...</lft><rt>...</rt></post> syntax
 */

import path from 'path';
import { escapeHtml } from '../utils';
import { VmdErrorCode, createVmdError, ErrorLocation } from '../errors';
import { getMarkdownSource, getFrontmatterLineCount } from './compilation_context';
import { getFileLocation, getLineAtPosition, isPositionInCode } from './validation_helpers';

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
          const fullSource = getMarkdownSource(location.file);
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
          const fullSource = getMarkdownSource(location.file);
          if (fullSource) {
            // Find where this specific match starts in the full source
            // We need to search for the exact match text
            const matchText = match[0];
            postBlockStartPos = fullSource.indexOf(matchText);
            if (postBlockStartPos !== -1) {
              location.line = getLineAtPosition(fullSource, postBlockStartPos, location.file);
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
          const fullSource = getMarkdownSource(location.file);
          if (fullSource) {
            const lftRelativePos = match[0].indexOf('<lft>');
            if (lftRelativePos !== -1) {
              const lftAbsolutePos = postBlockStartPos + lftRelativePos;
              lftLineNumber = getLineAtPosition(fullSource, lftAbsolutePos, location.file);
            }
          }
        }
        const lftLocation: ErrorLocation = { ...location, line: lftLineNumber };

        // Validate lft content:
        // 1. Check for code blocks (```)
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlockMatch = codeBlockRegex.exec(lftContent);
        if (codeBlockMatch) {
          // Calculate the line number of the code block within lftContent
          const codeBlockStartInLft = codeBlockMatch.index;
          const linesBeforeCodeBlock = (lftContent.substring(0, codeBlockStartInLft).match(/\n/g) || []).length;
          const actualCodeBlockLine = lftLineNumber + linesBeforeCodeBlock;
          const codeBlockLocation: ErrorLocation = { ...location, line: actualCodeBlockLine };
          throw createVmdError(
            VmdErrorCode.EXTENSION_POST_LFT_CODE_BLOCK,
            { line: actualCodeBlockLine },
            codeBlockLocation
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
          const fullSource = getMarkdownSource(location.file);
          if (fullSource) {
            // Find position of <rt> within the post block
            const rtRelativePos = match[0].indexOf('<rt>');
            if (rtRelativePos !== -1) {
              const rtAbsolutePos = postBlockStartPos + rtRelativePos;
              rtLineNumber = getLineAtPosition(fullSource, rtAbsolutePos, location.file);
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
