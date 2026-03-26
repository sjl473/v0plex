/**
 * Directory Scanner
 * Scans directories for images
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config';
import { AssetProcessor } from '../asset_processor';
import { ErrorReporter } from '../errors';

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
