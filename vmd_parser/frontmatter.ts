import { ParseResult, FrontMatterAttributes } from './types';
import { VmdErrorCode, createVmdError, ErrorLocation } from './errors';

export class FrontMatterParser {
  public static parse(content: string, filePath?: string): ParseResult {
    const location: ErrorLocation = filePath ? { file: filePath } : {};

    try {
      const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
      if (!match) {
        return { attributes: {}, body: content };
      }

      const frontMatterBlock = match[1];
      const body = content.substring(match[0].length);

      const attributes: FrontMatterAttributes = {};
      const lines = frontMatterBlock.split('\n');

      lines.forEach((line, index) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key) {
            attributes[key] = value;
          }
        }
      });

      return { attributes, body };
    } catch (err) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_PARSE_ERROR,
        { details: err instanceof Error ? err.message : String(err) },
        location,
        undefined,
        err instanceof Error ? err : undefined
      );
    }
  }

  public static validate(attributes: FrontMatterAttributes, filePath: string): void {
    // Check for exactly 5 required attributes: title, created_at, last_updated_at, author, has_custom_tsx
    const requiredAttributes = ['title', 'created_at', 'last_updated_at', 'author', 'has_custom_tsx'];
    
    // Check for missing required attributes
    const missing = requiredAttributes.filter(req => !attributes[req]);
    if (missing.length > 0) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_MISSING_REQUIRED,
        { fields: missing },
        { file: filePath }
      );
    }

    // Check for extra attributes beyond the required 5
    const allowedAttributes = new Set(requiredAttributes);
    const extraAttributes = Object.keys(attributes).filter(key => !allowedAttributes.has(key));
    if (extraAttributes.length > 0) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_FORMAT,
        { message: `Unexpected attributes found: ${extraAttributes.join(', ')}. Only 5 attributes allowed: title, created_at, last_updated_at, author, has_custom_tsx` },
        { file: filePath }
      );
    }

    // Strict validation for has_custom_tsx - must be exactly 'true' or 'false'
    const hasCustomTsx = attributes.has_custom_tsx;
    if (hasCustomTsx !== 'true' && hasCustomTsx !== 'false') {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'has_custom_tsx', value: hasCustomTsx, expected: 'true or false' },
        { file: filePath }
      );
    }

    // Validate date format: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const createdAt = attributes.created_at as string;
    const lastUpdatedAt = attributes.last_updated_at as string;
    
    if (!dateRegex.test(createdAt)) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'created_at', value: createdAt, expected: 'YYYY-MM-DD format' },
        { file: filePath }
      );
    }

    if (!dateRegex.test(lastUpdatedAt)) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'last_updated_at', value: lastUpdatedAt, expected: 'YYYY-MM-DD format' },
        { file: filePath }
      );
    }
  }

  public static getAttribute<T>(
    attributes: FrontMatterAttributes,
    key: string,
    defaultValue?: T
  ): T | undefined {
    const value = attributes[key];
    if (value === undefined) {
      return defaultValue;
    }
    return value as T;
  }

  public static hasCustomTsx(attributes: FrontMatterAttributes): boolean {
    return attributes.has_custom_tsx === 'true' || attributes.has_custom_tsx === true;
  }
}