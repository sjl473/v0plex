export interface FrontMatterAttributes {
  title?: string;
  created_at?: string;
  last_updated_at?: string;
  author?: string;
  has_custom_tsx?: boolean | string;
  [key: string]: any;
}

export interface ParseResult {
  attributes: FrontMatterAttributes;
  body: string;
  frontmatterLineCount: number;
}

export interface ImageReference {
  originalName: string;
  hashName: string;
}

export interface NavigationNode {
  title: string;
  type: 'page' | 'folder';
  path: string; // The web path /hash
  hash: string;
  hasCustomTsx: boolean;
  mdPath: string; // Relative path to source
  tsxPath: string; // Relative path to generated TSX
  codeFiles: { originalPath: string; hashPath: string }[];
  images: { originalName: string; hashPath: string }[];
  tags: string[]; // Tags from frontmatter
  locale?: string; // Language code (zh, en, fr, etc.) - optional for backward compatibility
  children: NavigationNode[];
  // Cross-language links: locale -> path mapping for same content in different languages
  // Only populated for 'page' type nodes
  languageLinks?: Record<string, string>;
  // Prefix identifier for matching pages across languages (e.g., "01_", "02_01_")
  prefixId?: string;
}

export interface SiteData {
  navigation: NavigationNode[];
  images: { originalPath: string; hashPath: string }[];
  availableLocales?: string[]; // List of available language codes
  defaultLocale?: string; // Default language code
}

export interface ProcessedMarkdown {
  html: string;
  generatedFiles: string[];
  usedImages: ImageReference[];
}
