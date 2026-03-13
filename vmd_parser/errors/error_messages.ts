/**
 * VMD Error Messages
 * Message templates for all error codes
 */

import { VmdErrorCode } from './error_codes';

/**
 * Error Message Templates
 */
export const ErrorMessages: Record<VmdErrorCode, (details?: Record<string, any>) => string> = {
  [VmdErrorCode.UNKNOWN_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Unknown error${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.CONFIG_ERROR]: (d) => `Configuration error: ${d?.message || 'Invalid configuration'}`,
  [VmdErrorCode.FILE_SYSTEM_ERROR]: (d) => `File system error: ${d?.message || 'Cannot access file'}`,

  [VmdErrorCode.FRONTMATTER_PARSE_ERROR]: (d) => `Frontmatter parse failed`,
  [VmdErrorCode.FRONTMATTER_MISSING_REQUIRED]: (d) =>
    `Missing required frontmatter attributes: ${d?.fields?.join(', ') || 'unknown fields'}`,
  [VmdErrorCode.FRONTMATTER_INVALID_VALUE]: (d) =>
    `Invalid value for frontmatter attribute '${d?.field}': ${d?.value}`,
  [VmdErrorCode.FRONTMATTER_INVALID_FORMAT]: (d) =>
    `Invalid frontmatter format: ${d?.message}`,

  [VmdErrorCode.MARKDOWN_COMPILE_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Markdown compilation failed${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.MARKDOWN_SYNTAX_ERROR]: (d) => {
    let details = d?.details || '';
    // Remove marked's "report to" message and replace with v0plex's
    details = details.replace(
      /please report this to https:\/\/github\.com\/markedjs\/marked\.?/gi,
      'If you have questions, please report to https://github.com/sjl473/v0plex'
    );
    return `Markdown syntax error${details ? `: ${details}` : ''}`;
  },
  [VmdErrorCode.MARKDOWN_NESTED_CODE_BLOCK]: (d) =>
    `Nested code block detected at line ${d?.line}. Code blocks cannot be nested within other code blocks.`,
  [VmdErrorCode.MARKDOWN_XSS_DETECTED]: (d) =>
    `XSS attack pattern '${d?.pattern}' detected in math formula: ${d?.formula || ''}`,
  [VmdErrorCode.MARKDOWN_EMPTY_MARKUP]: (d) =>
    `Empty ${d?.type} element detected (${d?.count || 1} occurrence${d?.count > 1 ? 's' : ''})`,
  [VmdErrorCode.MARKDOWN_SINGLE_BACKTICK_CODEBLOCK]: (d) =>
    `Single backtick code block is not allowed for VMD compiler. Use triple backticks (\`\`\`) for code blocks at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.MARKDOWN_INVALID_TAG_NESTING]: (d) =>
    `Invalid tag nesting: <${d?.outerTag}> cannot contain <${d?.innerTag}> at line ${d?.line || 'unknown'}`,

  [VmdErrorCode.EXTENSION_POST_MISSING_TAGS]: (d) =>
    `Post block must contain both <lft> and <rt> tags`,
  [VmdErrorCode.EXTENSION_POST_INVALID_CONTENT]: (d) =>
    `Post <rt> only allows images, found content: '${d?.content}'`,
  [VmdErrorCode.EXTENSION_POST_MISSING_IMAGE]: (d) =>
    `Post <rt> must contain at least one image`,
  [VmdErrorCode.EXTENSION_POST_MISSING_ALT]: (d) =>
    `Images in Post <rt> must have alt text`,
  [VmdErrorCode.EXTENSION_CUSTOM_BLOCK_ERROR]: (d) =>
    `Custom block <${d?.blockName}> processing failed`,
  [VmdErrorCode.EXTENSION_POST_INVALID_FORMAT]: (d) =>
    `Post block format error: ${d?.message}`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_TAG]: (d) =>
    `Post <lft> contains invalid HTML tag '${d?.tag}'. Only inline code, smallimg, and inline formula are allowed`,
  [VmdErrorCode.EXTENSION_POST_RT_INVALID_SPACING]: (d) =>
    `Post <rt> image spacing error: ${d?.message}`,
  [VmdErrorCode.EXTENSION_POST_LFT_CODE_BLOCK]: (d) =>
    `Post <lft> cannot contain code blocks (\`\`\`). Use inline code (\`...\`) instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_DISALLOWED_TAG]: (d) =>
    `Post <lft> cannot contain <${d?.tag}> tag. <lft> only allows inline content: inline code, inline math ($...$), plain text, links, bold, italic, strike`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCK_MATH]: (d) =>
    `Post <lft> cannot contain block math ($$...$$). Use inline math ($...$) instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_IMAGE]: (d) =>
    `Post <lft> cannot contain images (![...](...)). Images are only allowed in <rt> at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_BLOCKQUOTE]: (d) =>
    `Post <lft> cannot contain blockquotes (> ...). Use plain text or inline formatting instead at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_POST_LFT_INVALID_SPACING]: (d) =>
    `Post <lft> spacing error: ${d?.message} at line ${d?.line || 'unknown'}`,
  [VmdErrorCode.EXTENSION_EMPTY_CUSTOM_BLOCK]: (d) =>
    `Empty <${d?.blockName || 'custom'}> block detected at line ${d?.line || 'unknown'}. Custom blocks cannot be empty.`,

  [VmdErrorCode.ASSET_PROCESS_ERROR]: (d) => `Asset processing failed: ${d?.asset || 'unknown asset'}`,
  [VmdErrorCode.IMAGE_NOT_FOUND]: (d) => `Image not found: ${d?.imageName || 'unknown image'}`,
  [VmdErrorCode.IMAGE_PROCESS_FAILED]: (d) => `Image processing failed: ${d?.imagePath || 'unknown path'}`,
  [VmdErrorCode.CODE_FILE_WRITE_ERROR]: (d) => `Code file write failed: ${d?.filePath || 'unknown path'}`,

  [VmdErrorCode.BUILD_ERROR]: (d) => `Build failed`,
  [VmdErrorCode.BUILD_MISSING_H1]: (d) => `File missing Markdown H1 heading (# Title)`,
  [VmdErrorCode.BUILD_MISSING_CUSTOM_TSX]: (d) =>
    `has_custom_tsx=true but corresponding TSX file not found: ${d?.expectedPath || ''}`,
  [VmdErrorCode.BUILD_INVALID_PATH]: (d) => `Invalid path: ${d?.path || ''}`,
};
