import { ParseResult, FrontMatterAttributes } from './types';
import { VmdErrorCode, createVmdError, ErrorLocation } from './errors';

export class FrontMatterParser {
  public static parse(content: string, filePath?: string): ParseResult {
    const location: ErrorLocation = filePath ? { file: filePath } : {};

    try {
      const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
      if (!match) {
        return { attributes: {}, body: content, frontmatterLineCount: 0 };
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

      // Calculate frontmatter line count: the entire frontmatter block including both --- lines
      const frontmatterLineCount = match[0].split('\n').length;

      return { attributes, body, frontmatterLineCount };
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
    // Check for exactly 6 required attributes: title, created_at, last_updated_at, author, has_custom_tsx, tags
    const requiredAttributes = ['title', 'created_at', 'last_updated_at', 'author', 'has_custom_tsx', 'tags'];
    
    // Check for missing required attributes
    const missing = requiredAttributes.filter(req => !attributes[req]);
    if (missing.length > 0) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_MISSING_REQUIRED,
        { fields: missing },
        { file: filePath }
      );
    }

    // Check for extra attributes beyond the required 6
    const allowedAttributes = new Set(requiredAttributes);
    const extraAttributes = Object.keys(attributes).filter(key => !allowedAttributes.has(key));
    if (extraAttributes.length > 0) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_FORMAT,
        { message: `Unexpected attributes found: ${extraAttributes.join(', ')}. Only 6 attributes allowed: title, created_at, last_updated_at, author, has_custom_tsx, tags` },
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

    // Validate date format: YYYY-MM-DD or @git
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const gitPlaceholder = /^@git$/;
    const createdAt = attributes.created_at as string;
    const lastUpdatedAt = attributes.last_updated_at as string;
    
    if (!dateRegex.test(createdAt) && !gitPlaceholder.test(createdAt)) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'created_at', value: createdAt, expected: 'YYYY-MM-DD format or @git' },
        { file: filePath }
      );
    }

    if (!dateRegex.test(lastUpdatedAt) && !gitPlaceholder.test(lastUpdatedAt)) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_VALUE,
        { field: 'last_updated_at', value: lastUpdatedAt, expected: 'YYYY-MM-DD format or @git' },
        { file: filePath }
      );
    }

    // Validate author format: pipe-separated list of "name" or "name->email", or @git
    const author = attributes.author as string;
    this.validateAuthorFormat(author, filePath);
  }

  private static validateAuthorFormat(author: string, filePath: string): void {
    if (!author) return;

    // Allow @git as a special placeholder (entire field is just @git)
    if (author === '@git') {
      return;
    }

    const authors = author.split('|').map(a => a.trim()).filter(Boolean);
    
    if (authors.length === 0) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
        { message: 'Author list is empty' },
        { file: filePath }
      );
    }

    // Count @git occurrences - only allowed once in a list with other authors
    const gitCount = authors.filter(a => a === '@git').length;
    if (gitCount > 1) {
      throw createVmdError(
        VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
        { message: 'Only one @git placeholder is allowed in author field' },
        { file: filePath }
      );
    }

    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // URL regex pattern (basic validation for http/https URLs)
    const urlRegex = /^https?:\/\/.+/;

    for (const authorEntry of authors) {
      // Allow @git as a special placeholder in individual entries (max 1, already checked above)
      if (authorEntry === '@git') {
        continue;
      }
      
      // Check for arrow format
      if (authorEntry.includes('->')) {
        const parts = authorEntry.split('->').map(p => p.trim());
        
        // Must have at least name and one more part (2 or 3 parts total)
        if (parts.length < 2 || parts.length > 3) {
          throw createVmdError(
            VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
            { message: `Invalid format in "${authorEntry}". Use "Name", "Name->email@example.com", "Name->https://example.com", or with both` },
            { file: filePath }
          );
        }

        const name = parts[0];
        const part2 = parts[1];
        const part3 = parts[2]; // may be undefined
        
        if (!name) {
          throw createVmdError(
            VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
            { message: `Name is empty in "${authorEntry}"` },
            { file: filePath }
          );
        }

        // Flexible validation: part2 and part3 can be either email or URL
        const values = [part2, part3].filter(Boolean);
        let hasEmail = false;
        let hasUrl = false;

        for (const value of values) {
          if (emailRegex.test(value)) {
            if (hasEmail) {
              throw createVmdError(
                VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
                { message: `Duplicate email in "${authorEntry}"` },
                { file: filePath }
              );
            }
            hasEmail = true;
          } else if (urlRegex.test(value)) {
            if (hasUrl) {
              throw createVmdError(
                VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
                { message: `Duplicate URL in "${authorEntry}"` },
                { file: filePath }
              );
            }
            hasUrl = true;
          } else {
            throw createVmdError(
              VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
              { message: `"${value}" is not a valid email or URL in "${authorEntry}"` },
              { file: filePath }
            );
          }
        }
      } else {
        // Just a name - must be non-empty
        if (!authorEntry.trim()) {
          throw createVmdError(
            VmdErrorCode.FRONTMATTER_INVALID_AUTHOR_FORMAT,
            { message: `Empty author entry found` },
            { file: filePath }
          );
        }
      }
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
