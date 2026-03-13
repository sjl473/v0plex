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
import { scanDirectoryForImages, traverseDirectory } from './directory_scanner';
import { processFile } from './file_processor';
import { writeSiteData } from './site_data_writer';

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

    try {
      const stats = fs.statSync(inputPath);
      if (stats.isDirectory()) {
        scanDirectoryForImages(inputPath, this.assetProcessor, this.errorReporter);
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

  private traverseDirectory(dir: string, navContainer: NavigationNode[]): void {
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
        if (/^_(\d+)/.test(item)) {
          const folderTitle = this.cleanTitle(item, true);
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
            children: []
          };
          navContainer.push(newNavGroup);
          this.traverseDirectory(srcPath, newNavGroup.children);
        }
      } else if (stats.isFile()) {
        processFile(
          srcPath,
          navContainer,
          this.projectRoot,
          this.assetProcessor,
          this.markdownCompiler,
          this.generatedTsxFiles,
          this.errorReporter
        );
      }
    });
  }

  private writeSiteData(): void {
    writeSiteData(this.navigation, this.assetProcessor, this.projectRoot, this.errorReporter);
  }

  private cleanTitle(filename: string, isFolder: boolean = false): string {
    // Remove numeric prefix (e.g., "01_" or "_01_")
    let cleaned = filename.replace(/^_?(\d+)_/, '');

    // Remove file extension (only for files, not folders)
    if (!isFolder) {
      cleaned = cleaned.replace(/\.[^/.]+$/, '');
    }

    // Replace underscores and hyphens with spaces
    cleaned = cleaned.replace(/[_-]/g, ' ');

    // Capitalize first letter of each word
    cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());

    return cleaned;
  }

  public getErrorReporter(): ErrorReporter {
    return this.errorReporter;
  }
}
