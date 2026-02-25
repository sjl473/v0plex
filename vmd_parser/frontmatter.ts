import { ParseResult, FrontMatterAttributes } from './types';

export class FrontMatterParser {
  public static parse(content: string): ParseResult {
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
    if (!match) {
      return { attributes: {}, body: content };
    }

    const frontMatterBlock = match[1];
    const body = content.substring(match[0].length);

    const attributes: FrontMatterAttributes = {};
    frontMatterBlock.split('\n').forEach(line => {
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
  }

  public static validate(attributes: FrontMatterAttributes, filePath: string): void {
    const required = ['created_at', 'last_updated_at', 'author', 'has_custom_tsx'];
    const missing = required.filter(req => !attributes[req]);

    if (missing.length > 0) {
      throw new Error(`Missing required frontmatter attributes in ${filePath}: ${missing.join(', ')}`);
    }
  }
}