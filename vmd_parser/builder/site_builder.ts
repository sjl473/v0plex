/**
 * Site Builder
 * Main builder class for VMD site generation
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { AssetProcessor } from '../asset_processor';
import { MarkdownCompiler } from '../compiler';
import { NavigationNode } from '../types';
import { VmdErrorCode, createVmdError, ErrorReporter, VmdError } from '../errors';
import { scanDirectoryForImages } from './directory_scanner';
import { processFile } from './file_processor';
import { writeSiteData } from './site_data_writer';
import { cleanTitle, isGitAvailable } from '../utils';
import { AVAILABLE_LANGUAGES, type Locale, DEFAULT_LOCALE } from '../../config/site.config';

/**
 * Scan markdown files to check if @git placeholder is used
 */
function scanForGitPlaceholders(inputPath: string): boolean {
  const gitPlaceholderPattern = /@git/;
  
  function scanDir(dirPath: string): boolean {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        if (scanDir(itemPath)) {
          return true;
        }
      } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.mdx'))) {
        const content = fs.readFileSync(itemPath, 'utf8');
        if (gitPlaceholderPattern.test(content)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  try {
    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
      return scanDir(inputPath);
    } else if (stats.isFile()) {
      const content = fs.readFileSync(inputPath, 'utf8');
      return gitPlaceholderPattern.test(content);
    }
  } catch {
    return false;
  }
  
  return false;
}

// Get valid language codes from config
const VALID_LOCALES = new Set(AVAILABLE_LANGUAGES.map(lang => lang.code));
const VALID_LOCALE_FOLDERS = new Set(AVAILABLE_LANGUAGES.map(lang => lang.folder));

export class SiteBuilder {
  private projectRoot: string;
  private assetProcessor: AssetProcessor;
  private markdownCompiler: MarkdownCompiler;
  private generatedTsxFiles = new Set<string>();
  private navigation: NavigationNode[] = [];
  private errorReporter: ErrorReporter;
  private currentFile: string = '';

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.assetProcessor = new AssetProcessor(projectRoot);
    this.markdownCompiler = new MarkdownCompiler(this.assetProcessor, projectRoot);
    this.errorReporter = new ErrorReporter();
  }

  public build(inputPath: string): boolean {
    console.log(`Building site from: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
      this.errorReporter.createError(
        VmdErrorCode.BUILD_INVALID_PATH,
        { path: inputPath }
      );
      this.errorReporter.printReports();
      return false;
    }

    // Check if @git placeholder is used and validate git environment
    const usesGitPlaceholder = scanForGitPlaceholders(inputPath);
    if (usesGitPlaceholder) {
      console.log('  🔍 Detected @git placeholder in frontmatter, validating git environment...');
      if (!isGitAvailable()) {
        const error = createVmdError(
          VmdErrorCode.CONFIG_ERROR,
          {
            message: 'Git environment is not available. ' +
                     'Git is required when using @git placeholder in frontmatter for created_at or last_updated_at. ' +
                     'Please install git or use explicit dates (YYYY-MM-DD format).'
          }
        );
        console.error(`\n❌ ${error.format()}\n`);
        this.errorReporter.report(error);
        this.errorReporter.printReports();
        return false;
      }
      console.log('  ✅ Git environment validated');
    }

    try {
      const stats = fs.statSync(inputPath);
      if (stats.isDirectory()) {
        // Validate language folders
        const items = fs.readdirSync(inputPath);
        const subdirs = items
          .map(item => path.join(inputPath, item))
          .filter(itemPath => fs.statSync(itemPath).isDirectory())
          .map(itemPath => path.basename(itemPath));
        
        // Check for invalid folders
        const invalidFolders = subdirs.filter(folder =>
          !VALID_LOCALE_FOLDERS.has(folder) &&
          !CONFIG.EXCLUDED_DIRS.includes(folder) &&
          !folder.startsWith('.')
        );
        
        if (invalidFolders.length > 0) {
          const error = createVmdError(
            VmdErrorCode.CONFIG_ERROR,
            {
              message: `Invalid folder(s) found in ${inputPath}: ${invalidFolders.join(', ')}. ` +
                       `Folders must match configured languages: ${Array.from(VALID_LOCALE_FOLDERS).join(', ')}. ` +
                       `Please move content to appropriate language folders or update AVAILABLE_LANGUAGES in config/site.config.ts`
            }
          );
          console.error(`\n❌ ${error.format()}\n`);
          this.errorReporter.report(error);
          this.errorReporter.printReports();
          return false;
        }
        
        scanDirectoryForImages(inputPath, this.assetProcessor, this.errorReporter);
        // Explicitly scan assets folder for images (excluded from folder validation)
        const assetsPath = path.join(inputPath, 'assets');
        if (fs.existsSync(assetsPath)) {
          scanDirectoryForImages(assetsPath, this.assetProcessor, this.errorReporter);
        }
        this.traverseDirectory(inputPath, this.navigation);
      } else if (stats.isFile()) {
        processFile(
          inputPath,
          this.navigation,
          this.projectRoot,
          this.assetProcessor,
          this.markdownCompiler,
          this.generatedTsxFiles,
          this.errorReporter
        );
      }

      // Build cross-language links after all pages are processed
      this.buildCrossLanguageLinks();

      this.writeSiteData();

      this.errorReporter.printReports();
      const summary = this.errorReporter.getSummary();

      if (summary.errors > 0) {
        console.error(`Build failed with ${summary.errors} error(s) and ${summary.warnings} warning(s)`);
        return false;
      } else if (summary.warnings > 0) {
        console.warn(`Build completed with ${summary.warnings} warning(s)`);
      } else {
        console.log('Build completed successfully');
      }

      return true;
    } catch (err) {
      if (err instanceof VmdError) {
        this.errorReporter.report(err);
      } else {
        this.errorReporter.createError(
          VmdErrorCode.BUILD_ERROR,
          { details: err instanceof Error ? err.message : String(err) },
          { file: inputPath }
        );
      }
      this.errorReporter.printReports();
      return false;
    }
  }

  private traverseDirectory(dir: string, navContainer: NavigationNode[], locale?: string): void {
    const items = fs.readdirSync(dir);

    items.sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/^(\d+)_/);
        return match ? parseInt(match[1], 10) : null;
      };
      const numA = getNum(a);
      const numB = getNum(b);
      if (numA !== null && numB !== null) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    items.forEach(item => {
      if (item.startsWith('.') || CONFIG.EXCLUDED_DIRS.includes(item)) return;

      const srcPath = path.join(dir, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        // Check if this is a language folder (direct child of input path)
        if (!locale && VALID_LOCALE_FOLDERS.has(item)) {
          // This is a language folder, process its contents with the locale
          this.traverseDirectory(srcPath, navContainer, item);
        } else if (/^_(\d+)/.test(item)) {
          const folderTitle = cleanTitle(item, true);
          const newNavGroup: NavigationNode = {
            title: folderTitle,
            type: 'folder',
            path: "",
            hash: "",
            hasCustomTsx: false,
            mdPath: "",
            tsxPath: "",
            codeFiles: [],
            images: [],
            tags: [],
            locale: locale,
            children: []
          };
          navContainer.push(newNavGroup);
          this.traverseDirectory(srcPath, newNavGroup.children, locale);
        }
      } else if (stats.isFile()) {
        processFile(
          srcPath,
          navContainer,
          this.projectRoot,
          this.assetProcessor,
          this.markdownCompiler,
          this.generatedTsxFiles,
          this.errorReporter,
          locale
        );
      }
    });
  }

  /**
   * Extract prefix ID from file/folder name (e.g., "_01_intro.md" -> "01")
   */
  private extractPrefixId(name: string): string | null {
    const match = name.match(/^_?(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Build a prefix identifier from the navigation hierarchy.
   * Uses both FOLDER and FILE prefixes to match pages across languages.
   * Format: "folderPrefix_filePrefix" for nested structure, or just "filePrefix" for root level.
   * Example: "_01_Docs/_00_intro.md" in EN and "_01_文档/_00_简介.md" in ZH
   *          both get prefix "01_00" and are matched as the same article.
   */
  private buildPrefixPath(node: NavigationNode): string {
    const mdPath = node.mdPath || '';
    if (!mdPath) return '';
    
    // Extract all folder prefixes from the path + file prefix
    // This ensures consistent prefixIds even when folder names differ across languages
    const parts: string[] = [];
    
    // Split path and extract folder prefixes
    const pathParts = mdPath.split(path.sep);
    for (const part of pathParts) {
      const folderPrefix = this.extractPrefixId(part);
      if (folderPrefix) {
        parts.push(folderPrefix);
      }
    }
    
    // Also extract file prefix from basename
    const baseName = path.basename(mdPath);
    const filePrefix = this.extractPrefixId(baseName);
    if (!filePrefix) return '';
    
    // Replace the last folder prefix with the file prefix (if there are folder prefixes)
    // Or just use file prefix for root-level files
    if (parts.length > 0 && pathParts.length > 0) {
      // Check if the last part was a folder or the file itself
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart === baseName) {
        // The last extracted prefix was from the file itself, so it's already correct
      } else {
        // Need to add the file prefix
        parts.push(filePrefix);
      }
    }
    
    return parts.join('_');
  }

  /**
   * Collect all pages from navigation tree with their prefix paths.
   * Tracks folder name prefixes (not folder positions) to match pages across languages.
   * Pages are matched based on their numeric prefixes (e.g., "_01_Docs/_00_file.md" matches
   * "_01_Documentation/_00_page.md" because both have "01" folder prefix and "00" file prefix).
   */
  private collectPages(nodes: NavigationNode[]): Array<{ node: NavigationNode; prefixPath: string; locale: string }> {
    const pages: Array<{ node: NavigationNode; prefixPath: string; locale: string }> = [];
    
    for (const node of nodes) {
      if (node.type === 'page') {
        const prefixPath = this.buildPrefixPath(node);
        if (prefixPath) {
          pages.push({ node, prefixPath, locale: node.locale || '' });
        }
      }
      
      if (node.children && node.children.length > 0) {
        // Recurse into children
        pages.push(...this.collectPages(node.children));
      }
    }
    
    return pages;
  }

  /**
   * Build cross-language links for all pages
   */
  private buildCrossLanguageLinks(): void {
    const allPages = this.collectPages(this.navigation);
    
    // Group pages by prefix path
    const pagesByPrefix = new Map<string, Array<{ node: NavigationNode; locale: string }>>();
    
    for (const page of allPages) {
      if (!pagesByPrefix.has(page.prefixPath)) {
        pagesByPrefix.set(page.prefixPath, []);
      }
      pagesByPrefix.get(page.prefixPath)!.push({ node: page.node, locale: page.locale });
    }
    
    // Build languageLinks for each page
    for (const [prefixPath, pages] of pagesByPrefix) {
      if (pages.length <= 1) continue; // Skip if only one language
      
      // Create locale -> path mapping
      const languageLinks: Record<string, string> = {};
      for (const { node, locale } of pages) {
        if (locale && node.path) {
          languageLinks[locale] = node.path;
        }
      }
      
      // Assign to each page
      for (const { node } of pages) {
        node.languageLinks = { ...languageLinks };
        node.prefixId = prefixPath;
      }
    }
    
    // Validate: report prefix paths that don't have all configured languages
    const configuredLocales = new Set(AVAILABLE_LANGUAGES.map(l => l.code));
    let hasPrefixMismatch = false;
    
    for (const [prefixPath, pages] of pagesByPrefix) {
      const pageLocales = new Set(pages.map(p => p.locale).filter(Boolean));
      const missingLocales = [...configuredLocales].filter(l => !pageLocales.has(l));
      
      if (missingLocales.length > 0 && pages.length > 0) {
        hasPrefixMismatch = true;
        const examplePage = pages[0].node.mdPath || prefixPath;
        const error = createVmdError(
          VmdErrorCode.CONFIG_ERROR,
          {
            message: `i18n prefix mismatch: Page "${prefixPath}" exists in [${[...pageLocales].join(', ')}] but missing in [${missingLocales.join(', ')}]. ` +
                     `Each prefix must exist in ALL configured languages: ${[...configuredLocales].join(', ')}. ` +
                     `Location: ${examplePage}`
          }
        );
        this.errorReporter.report(error);
      }
    }
    
    if (hasPrefixMismatch) {
      console.error('\n❌ Build failed: i18n prefix mismatch detected.');
      console.error('   Ensure all content folders and files have matching numeric prefixes across all language directories.');
    }
  }

  private writeSiteData(): void {
    writeSiteData(this.navigation, this.assetProcessor, this.projectRoot, this.errorReporter);
  }

  public getErrorReporter(): ErrorReporter {
    return this.errorReporter;
  }
}
