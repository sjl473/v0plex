/**
 * Site Configuration
 *
 * IMPORTANT: This configuration is shared between frontend and backend.
 * Change URL_PREFIX in one place to update all URLs throughout the application.
 */

// ============================================================================
// GLOBAL URL PREFIX CONFIGURATION
// Change this value to update all URLs throughout the application
// ============================================================================
export const URL_PREFIX = 'page'; // Change to 'out' or any other path as needed

export const SITE_CONFIG = {
  /**
   * URL prefix for all markdown pages
   * Example: '/page' means pages will be at /page/article-name
   * Change URL_PREFIX above to update this throughout the app
   */
  URL_PREFIX: `/${URL_PREFIX}`,

  /**
   * Directory name where generated pages are stored
   */
  OUT_DIR: URL_PREFIX,
} as const;
