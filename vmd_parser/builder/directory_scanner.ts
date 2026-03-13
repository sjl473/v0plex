/**
 * Directory Scanner
 * Scans directories for markdown files and images
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { cleanTitle } from '../utils';
import { AssetProcessor } from '../asset_processor';
import { NavigationNode } from '../types';
import { VmdErrorCode, ErrorReporter } from '../errors';

/**
 * Scan directory for images and process them
 */
export function scanDirectoryForImages(
  dir: string,
  assetProcessor: AssetProcessor,
  errorReporter: ErrorReporter
): void {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    if (item.startsWith('.') || item === 'node_modules' || CONFIG.EXCLUDED_DIRS.includes(item)) return;

    const srcPath = path.join(dir, item);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      scanDirectoryForImages(srcPath, assetProcessor, errorReporter);
    } else if (stats.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
        try {
          assetProcessor.processImage(srcPath);
        } catch (err) {
          // Error already reported by asset processor
        }
      }
    }
  });
}

/**
 * Traverse directory and build navigation structure
 */
export function traverseDirectory(
  dir: string,
  navContainer: NavigationNode[],
  projectRoot: string,
  assetProcessor: AssetProcessor,
  markdownCompiler: any,
  generatedTsxFiles: Set<string>,
  errorReporter: ErrorReporter
): void {
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
          children: []
        };
        navContainer.push(newNavGroup);
        traverseDirectory(srcPath, newNavGroup.children, projectRoot, assetProcessor, markdownCompiler, generatedTsxFiles, errorReporter);
      }
    } else if (stats.isFile()) {
      processFile(srcPath, navContainer, projectRoot, assetProcessor, markdownCompiler, generatedTsxFiles, errorReporter);
    }
  });
}

/**
 * Process a single file (markdown or TSX)
 */
function processFile(
  srcPath: string,
  navContainer: NavigationNode[],
  projectRoot: string,
  assetProcessor: AssetProcessor,
  markdownCompiler: any,
  generatedTsxFiles: Set<string>,
  errorReporter: ErrorReporter
): void {
  // This is a placeholder - the actual implementation is in file_processor.ts
  // to avoid circular dependencies
}
