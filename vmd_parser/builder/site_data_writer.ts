/**
 * Site Data Writer
 * Writes site navigation and image data to JSON
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { AssetProcessor } from '../asset_processor';
import { NavigationNode, SiteData } from '../types';
import { VmdErrorCode, ErrorReporter } from '../errors';

/**
 * Write site data to JSON file
 */
export function writeSiteData(
  navigation: NavigationNode[],
  assetProcessor: AssetProcessor,
  projectRoot: string,
  errorReporter: ErrorReporter
): void {
  const siteData: SiteData = {
    navigation: navigation,
    images: assetProcessor.getSiteImages()
  };

  const jsonDir = path.join(projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_JSON_DIR);
  const jsonPath = path.join(jsonDir, CONFIG.SITE_DATA_JSON);

  try {
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(siteData, null, 2));
    console.log(`Generated unified ${CONFIG.SITE_DATA_JSON}`);
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot write site data: ${err instanceof Error ? err.message : String(err)}` },
      { file: jsonPath }
    );
  }
}
