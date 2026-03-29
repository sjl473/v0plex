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
import { AVAILABLE_LANGUAGES, DEFAULT_LOCALE } from '../../config/site.config';

/**
 * Write site data to JSON file
 */
export function writeSiteData(
  navigation: NavigationNode[],
  assetProcessor: AssetProcessor,
  projectRoot: string,
  errorReporter: ErrorReporter
): void {
  // Extract available locales from navigation
  const availableLocales = Array.from(new Set(
    navigation.map(node => node.locale).filter((locale): locale is string => !!locale)
  ));
  
  // If no locales found in navigation, use all configured languages
  const finalLocales = availableLocales.length > 0
    ? availableLocales
    : AVAILABLE_LANGUAGES.map(lang => lang.code);

  const siteData: SiteData = {
    navigation: navigation,
    images: assetProcessor.getSiteImages(),
    availableLocales: finalLocales,
    defaultLocale: DEFAULT_LOCALE
  };

  const jsonDir = path.join(projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_JSON_DIR);
  const jsonPath = path.join(jsonDir, CONFIG.SITE_DATA_JSON);

  try {
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(siteData, null, 2));
    console.log(`Generated unified ${CONFIG.SITE_DATA_JSON}`);
    console.log(`Available locales: ${finalLocales.join(', ')}`);
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot write site data: ${err instanceof Error ? err.message : String(err)}` },
      { file: jsonPath }
    );
  }
}
