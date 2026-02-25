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
  children: NavigationNode[];
}

export interface SiteData {
  navigation: NavigationNode[];
  images: { originalPath: string; hashPath: string }[];
}

export interface ProcessedMarkdown {
  html: string;
  generatedFiles: string[];
  usedImages: ImageReference[];
}