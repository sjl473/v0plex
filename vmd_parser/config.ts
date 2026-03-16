import path from 'path';
import { SITE_CONFIG } from '../config/site.config';

export const CONFIG = {
  PUBLIC_DIR: 'public',
  APP_DIR: 'app',
  OUT_DIR: SITE_CONFIG.OUT_DIR,
  VMD_CODE_DIR: 'vmdcode',
  VMD_IMAGE_DIR: 'vmdimage',
  VMD_JSON_DIR: 'vmdjson',
  VMD_TOKEN_DIR: 'vmdtoken',

  // URL Configuration (imported from shared config)
  URL_PREFIX: SITE_CONFIG.URL_PREFIX,

  // Feature flags
  ENABLE_TOKEN_GENERATION: process.env.VMD_ENABLE_TOKENS === 'true',

  EXCLUDED_DIRS: ['node_modules', 'libs', 'vmd', 'dist', 'build', '.git', '.idea', SITE_CONFIG.OUT_DIR],

  SITE_DATA_JSON: 'site-data.json',

  COMPONENT_IMPORT_PATH: '@/components/vmd/vmdimporter',
  IMAGE_WEB_PREFIX: '/vmdimage/',

  GITHUB_REPO_BASE_URL: "",
};
