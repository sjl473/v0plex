/**
 * ============================================================================
 * site.config.ts - v0plex Site Configuration
 * ============================================================================
 *
 * Central configuration file defining all site-wide constants, build settings,
 * content source options, internationalization, and localization strings.
 * This is the single source of truth for site behavior across the application.
 *
 * THE BIG PICTURE
 * ----------------------------------------------------------------------------
 *
 * Configuration is organized into functional domains:
 *
 *   1. URL & PATH CONSTANTS .... Routing prefixes and directory naming
 *   2. CONTENT SOURCE .......... Local vs remote git repository mode
 *   3. LAYOUT SETTINGS ......... UI dimensions and responsive breakpoints
 *   4. SITE METADATA ........... URLs, build info, data paths
 *   5. BUILD CONFIG ............ VMD parser output directories and exclusions
 *   6. TAGS .................... Allowed frontmatter tag values
 *   7. I18N .................... Language configs, translations, date formats
 *
 * MODULE COMPOSITION
 * ----------------------------------------------------------------------------
 *
 * BASE CONSTANTS
 *   URL_PREFIX ................. Base route prefix for generated pages ('page')
 *   URL_PREFIX_PATH ............ URL_PREFIX with leading slash
 *   VMD_CODE_DIR_NAME .......... Directory name for code assets ('vmdcode')
 *   VMD_IMAGE_DIR_NAME ......... Directory name for processed images ('vmdimage')
 *   VMD_JSON_DIR_NAME .......... Directory name for JSON data ('vmdjson')
 *   VMD_CODE_PATH .............. Web path for code assets ('/vmdcode/')
 *   VMD_IMAGE_PATH ............. Web path for images ('/vmdimage/')
 *   VMD_JSON_PATH .............. Web path for JSON ('/vmdjson/')
 *   SITE_DATA_FILENAME ......... Navigation data file ('site-data.json')
 *
 * CONTENT_SOURCE_CONFIG
 *   USE_LOCAL_MARKDOWN ......... Toggle between local dev folder (true) or
 *                                remote git clone (false)
 *   GIT_CONFIG ................. Repository settings when remote mode:
 *     - REPO_URL ............... Git repository URL (required in remote mode)
 *     - BRANCH ................. Target branch to clone (default: 'main')
 *
 *   Remote Mode Behavior:
 *     - dev folder deleted before each build
 *     - Full git clone performed (preserves .git for history)
 *     - Structure validated: dev/{language}/ required
 *     - Language folders must match AVAILABLE_LANGUAGES
 *     - @git placeholders use cloned repo's git history
 *
 *   Local Mode Behavior:
 *     - Uses existing dev/ folder content
 *     - Requires at least one language folder
 *     - Requires at least one file in content tree
 *     - @git placeholders use v0plex project's git history
 *
 * LAYOUT_CONFIG
 *   SIDEBAR_WIDTH .............. Left sidebar width in pixels (300)
 *   RIGHT_SIDEBAR_WIDTH ........ Right sidebar width in pixels (300)
 *   LEFT_CONTENT_OFFSET ........ Responsive left margins:
 *     - pc: '1.25rem' .......... Desktop (≥1025px)
 *     - tablet: '1rem' ......... Tablet (601px-1024px)
 *     - mobile: '0.5rem' ....... Mobile (≤600px)
 *
 * SITE_CONFIG
 *   Aggregated site metadata object:
 *   - URL_PREFIX ............... Routing base path
 *   - OUT_DIR .................. Output directory name
 *   - DATA_PATHS ............... Constructed paths to vmd assets
 *   - GITHUB_PAGES_URL ......... Deployment URL for edit links
 *   - BUILD_DATE ............... Build timestamp
 *
 * BUILD_CONFIG
 *   VMD parser build settings:
 *   - PUBLIC_DIR ............... Static assets directory ('public')
 *   - APP_DIR .................. Next.js app directory ('app')
 *   - OUT_DIR .................. Page output directory
 *   - VMD_*_DIR ................ Asset subdirectory names
 *   - URL_PREFIX ............... Routing prefix
 *   - EXCLUDED_DIRS ............ Paths to skip during scanning
 *   - SITE_DATA_JSON ........... Navigation filename
 *   - COMPONENT_IMPORT_PATH .... VMD components import path
 *   - IMAGE_WEB_PREFIX ......... Web URL prefix for images
 *   - GITHUB_REPO_BASE_URL ..... Base URL for edit links
 *
 * TAGS_CONFIG
 *   tags ....................... Array of allowed frontmatter tag strings
 *                              (welcome, tutorial, api, guide, etc.)
 *
 * INTERNATIONALIZATION
 *   DEFAULT_LOCALE ............. Fallback language code ('zh')
 *   LOCALE_STORAGE_KEY ......... localStorage key for user preference
 *   Locale ..................... Type union of supported locales
 *                                ('en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'pt')
 *
 *   LanguageConfig ............. Interface for language metadata:
 *     - code ................... Locale identifier
 *     - name ................... English language name
 *     - nativeName ............. Localized language name
 *     - folder ................. Content folder name
 *
 *   AVAILABLE_LANGUAGES ........ Array of configured LanguageConfig objects:
 *     - Chinese:    code='zh', folder='zh', nativeName='中文'
 *     - English:    code='en', folder='en', nativeName='English'
 *     - Spanish:    code='es', folder='es', nativeName='Español'
 *     - French:     code='fr', folder='fr', nativeName='Français'
 *     - German:     code='de', folder='de', nativeName='Deutsch'
 *     - Japanese:   code='ja', folder='ja', nativeName='日本語'
 *     - Korean:     code='ko', folder='ko', nativeName='한국어'
 *     - Russian:    code='ru', folder='ru', nativeName='Русский'
 *     - Portuguese: code='pt', folder='pt', nativeName='Português'
 *
 *   getLanguageConfig(locale) .. Lookup function for language metadata
 *   isValidLocale(string) ...... Type guard for locale validation
 *
 *   I18nStrings ................ Interface defining all translatable UI text:
 *     - sidebar ................ Search, catalog, navigation labels
 *     - header ................. Site title, theme toggle labels
 *     - footer ................. Copyright, version info
 *     - pageNav ................ Previous/next navigation
 *     - codeBlock .............. Copy code, source attribution
 *     - boxes .................. Info/warning/success/error defaults
 *     - code ................... Loading states
 *     - postModal .............. Image gallery navigation
 *     - pageMeta ............... Created/updated/author labels
 *     - editThisPage ........... Edit link label
 *     - tablePagination ........ Table navigation labels
 *
 *   EN_STRINGS / ZH_STRINGS .... Complete translation objects for each locale
 *   TRANSLATIONS ............... Map of locale to translation object
 *   DATE_FORMATS ............... Intl.DateTimeFormatOptions per locale
 *
 *   getStrings(locale) ......... Retrieve translation object for locale
 *   formatDate(date, locale) ... Format date according to locale conventions
 *   interpolateString(template, values) ... Replace {placeholders} in strings
 *
 * USAGE
 * ----------------------------------------------------------------------------
 *
 * Import specific configs:
 *
 *   import { BUILD_CONFIG, SITE_CONFIG } from '@/config/site.config';
 *   import { getStrings, DEFAULT_LOCALE } from '@/config/site.config';
 *
 * Check content source mode:
 *
 *   if (CONTENT_SOURCE_CONFIG.USE_LOCAL_MARKDOWN) {
 *     // Use local dev/ folder
 *   } else {
 *     // Clone from CONTENT_SOURCE_CONFIG.GIT_CONFIG.REPO_URL
 *   }
 *
 * Get localized strings:
 *
 *   const strings = getStrings('zh');
 *   console.log(strings.sidebar.searchPlaceholder); // '搜索内容...'
 *
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BASE CONSTANTS - URL prefixes and directory naming
// ----------------------------------------------------------------------------
export const URL_PREFIX = 'page';
export const URL_PREFIX_PATH = `/${URL_PREFIX}`;

// VMD Directory names (without slashes)
export const VMD_CODE_DIR_NAME = 'vmdcode';
export const VMD_IMAGE_DIR_NAME = 'vmdimage';
export const VMD_JSON_DIR_NAME = 'vmdjson';

// VMD Web paths (with slashes)
export const VMD_CODE_PATH = `/${VMD_CODE_DIR_NAME}/`;
export const VMD_IMAGE_PATH = `/${VMD_IMAGE_DIR_NAME}/`;
export const VMD_JSON_PATH = `/${VMD_JSON_DIR_NAME}/`;

// Site data filename
export const SITE_DATA_FILENAME = 'site-data.json';

// ----------------------------------------------------------------------------
// CONTENT SOURCE CONFIGURATION
// ----------------------------------------------------------------------------
export const CONTENT_SOURCE_CONFIG = {
  USE_LOCAL_MARKDOWN: false,
  GIT_CONFIG: {
    REPO_URL: 'https://github.com/sjl473/v0plex-markdown',
    BRANCH: 'main',
  },
} as const;

export type ContentSourceConfig = typeof CONTENT_SOURCE_CONFIG;

export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 416,
  RIGHT_SIDEBAR_WIDTH: 400,
LEFT_CONTENT_OFFSET: {
  pc: '1.25rem',      // PC layout (≥1025px)
  tablet: '1rem',     // Tablet layout (601px-1024px)
  mobile: '1rem'      // Mobile layout (≤600px) - aligned with hamburger button
}
} as const;

export const SITE_CONFIG = {
  URL_PREFIX: URL_PREFIX_PATH,
  OUT_DIR: URL_PREFIX,
  DATA_PATHS: {
    SITE_DATA: `${VMD_JSON_PATH}${SITE_DATA_FILENAME}`,
    VMD_CODE: VMD_CODE_PATH,
    VMD_IMAGE: VMD_IMAGE_PATH,
    VMD_JSON: VMD_JSON_PATH,
  },
  BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
} as const;


/**
 * VMD Parser Build Configuration
 * ============================================================================
 */
export const BUILD_CONFIG = {
  PUBLIC_DIR: 'public',
  APP_DIR: 'app',
  OUT_DIR: URL_PREFIX,
  VMD_CODE_DIR: VMD_CODE_DIR_NAME,
  VMD_IMAGE_DIR: VMD_IMAGE_DIR_NAME,
  VMD_JSON_DIR: VMD_JSON_DIR_NAME,
  URL_PREFIX: URL_PREFIX_PATH,
  EXCLUDED_DIRS: ['node_modules', 'libs', 'vmd', 'dist', 'build', '.git', '.idea', 'assets', URL_PREFIX] as string[],
  SITE_DATA_JSON: SITE_DATA_FILENAME,
  COMPONENT_IMPORT_PATH: '@/components/vmd/vmdimporter',
  IMAGE_WEB_PREFIX: VMD_IMAGE_PATH,
} as const;

// ----------------------------------------------------------------------------
// TAGS CONFIGURATION - Allowed frontmatter tag values
// ----------------------------------------------------------------------------
export const TAGS_CONFIG = {
  tags: [
    'welcome',
    'tutorial',
    'test',
    'combo',
    'final',
    'guide',
    'reference',
    'api',
    'getting-started',
    'advanced',
    'troubleshooting',
    'release-notes',
    'changelog'
  ] as string[],
} as const;

/**
 * ‼️ DEFAULT_LOCALE - Default language when none is selected
 * Must be one of the ENABLED_LANGUAGES
 */
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'v0plex-locale';

export type Locale = 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'pt';

export interface LanguageConfig {
  code: Locale;
  name: string;
  nativeName: string;
  folder: string;
}

// ----------------------------------------------------------------------------
// LANGUAGE CONFIGURATION
// ----------------------------------------------------------------------------

/**
 * ENABLED_LANGUAGES - Explicitly enable/disable languages
 *
 * ‼️ Edit Language Options Goes Here
 * Only languages listed here will be available in the site.
 * This array is validated against:
 *   1. AVAILABLE_LANGUAGES_SUPPORT (must be a supported language)
 *   2. Dev folder structure (must have content if USE_LOCAL_MARKDOWN is true)
 *
 * To disable a language, remove it from this array.
 * To add a new language, first add to AVAILABLE_LANGUAGES_SUPPORT, then enable here.
 */
// export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt'];
export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh'];

/**
 * AVAILABLE_LANGUAGES_SUPPORT - All languages supported by the system
 *
 * This defines the complete set of languages that CAN be enabled.
 * To add a new language:
 *   1. Add entry here with code, name, nativeName, folder
 *   2. Add translations to TRANSLATIONS
 *   3. Add date format to DATE_FORMATS
 *   4. Add to ENABLED_LANGUAGES to activate
 */
export const AVAILABLE_LANGUAGES_SUPPORT: LanguageConfig[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', folder: 'zh' },
  { code: 'en', name: 'English', nativeName: 'English', folder: 'en' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', folder: 'es' },
  { code: 'fr', name: 'French', nativeName: 'Français', folder: 'fr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', folder: 'de' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', folder: 'ja' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', folder: 'ko' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', folder: 'ru' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', folder: 'pt' },
];

/**
 * Computed AVAILABLE_LANGUAGES - filters support list by enabled languages
 * This is the array used throughout the application
 */
export const AVAILABLE_LANGUAGES: LanguageConfig[] = AVAILABLE_LANGUAGES_SUPPORT.filter(
  lang => ENABLED_LANGUAGES.includes(lang.code)
);

/**
 * Validate that all enabled languages are supported
 * Throws error if ENABLED_LANGUAGES contains invalid codes
 */
function validateEnabledLanguages(): void {
  const supportedCodes = AVAILABLE_LANGUAGES_SUPPORT.map(l => l.code);
  const invalidLanguages = ENABLED_LANGUAGES.filter(code => !supportedCodes.includes(code));
  
  if (invalidLanguages.length > 0) {
    throw new Error(
      `[Language Config Error] The following languages in ENABLED_LANGUAGES are not supported: ${invalidLanguages.join(', ')}
      \nSupported languages: ${supportedCodes.join(', ')}
      \nPlease add the language to AVAILABLE_LANGUAGES_SUPPORT first, or remove from ENABLED_LANGUAGES.`
    );
  }
}

// Run validation on module load
validateEnabledLanguages();

/**
 * Validate that DEFAULT_LOCALE is in ENABLED_LANGUAGES
 */
function validateDefaultLocale(): void {
  if (!ENABLED_LANGUAGES.includes(DEFAULT_LOCALE)) {
    throw new Error(
      `[Language Config Error] DEFAULT_LOCALE '${DEFAULT_LOCALE}' is not in ENABLED_LANGUAGES. ` +
      `Please set DEFAULT_LOCALE to one of: ${ENABLED_LANGUAGES.join(', ')}`
    );
  }
}

validateDefaultLocale();

/**
 * Check if a language is enabled
 */
export function isLanguageEnabled(locale: Locale): boolean {
  return ENABLED_LANGUAGES.includes(locale);
}

export function getLanguageConfig(locale: Locale): LanguageConfig {
  const config = AVAILABLE_LANGUAGES.find(lang => lang.code === locale);
  if (!config) {
    // Return the first enabled language as fallback instead of throwing
    // This handles cases where localStorage has a disabled language
    return AVAILABLE_LANGUAGES[0];
  }
  return config;
}

export function isValidLocale(locale: string): locale is Locale {
  return AVAILABLE_LANGUAGES.some(lang => lang.code === locale);
}

/**
 * Get all supported language codes (including disabled)
 * For validation purposes
 */
export function getSupportedLocales(): Locale[] {
  return AVAILABLE_LANGUAGES_SUPPORT.map(lang => lang.code);
}

/**
 * Get all enabled language codes
 */
export function getEnabledLocales(): Locale[] {
  return [...ENABLED_LANGUAGES];
}

export interface I18nStrings {
  sidebar: {
    searchPlaceholder: string;
    searchResults: string;
    noResults: string;
    hits: string;
    collapse: string;
    expand: string;
    clearSearch: string;
    allPosts: string;
    catalog: string;
  };
  header: {
    siteTitle: string;
    switchToDark: string;
    switchToLight: string;
  };
  footer: {
    siteName: string;
    version: string;
    versionLabel: string;
    lastUpdated: string;
    copyright: string;
    copyrightSymbol: string;
  };
  pageNav: {
    home: string;
    previousPage: string;
    nextPage: string;
    none: string;
  };
  codeBlock: {
    copyCode: string;
    from: string;
  };
  boxes: {
    infoDefault: string;
    warningDefault: string;
    successDefault: string;
    errorDefault: string;
  };
  code: {
    loading: string;
    error: string;
  };
  postModal: {
    zoomBack: string;
    previousImage: string;
    nextImage: string;
    previous: string;
    next: string;
  };
  pageMeta: {
    created: string;
    updated: string;
    author: string;
    timeLabel: string;
  };
  editThisPage: {
    label: string;
  };
  tablePagination: {
    itemsPerPage: string;
    previous: string;
    next: string;
  };
}

export const EN_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Search Contents...',
    searchResults: 'Searched Results',
    noResults: 'No Searched Result',
    hits: 'hits',
    collapse: 'Collapse',
    expand: 'Expand',
    clearSearch: 'Clear search',
    allPosts: 'All Posts',
    catalog: 'Catalog',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'switch dark',
    switchToLight: 'switch light',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Version',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Home',
    previousPage: 'Previous Page',
    nextPage: 'Next Page',
    none: 'None',
  },
  codeBlock: {
    copyCode: 'Copy Code',
    from: 'from',
  },
  boxes: {
    infoDefault: 'Notice: ',
    warningDefault: 'Warning: ',
    successDefault: 'Success: ',
    errorDefault: 'Error: ',
  },
  code: {
    loading: 'Loading code...',
    error: 'Error loading code',
  },
  postModal: {
    zoomBack: 'Zoom back',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    previous: 'Previous',
    next: 'Next',
  },
  pageMeta: {
    created: 'Created',
    updated: 'Updated',
    author: 'Author:',
    timeLabel: 'Time:',
  },
  editThisPage: {
    label: 'Edit Page on Github / Gitlab ↵',
  },
  tablePagination: {
    itemsPerPage: 'items',
    previous: 'Previous',
    next: 'Next',
  },
};

export const ZH_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: '搜索内容...',
    searchResults: '搜索结果',
    noResults: '无搜索结果',
    hits: '次匹配',
    collapse: '收起',
    expand: '展开',
    clearSearch: '清除搜索',
    allPosts: '所有文章',
    catalog: '目录',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: '切换深色模式',
    switchToLight: '切换浅色模式',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: '版本',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: '首页',
    previousPage: '上一页',
    nextPage: '下一页',
    none: '无',
  },
  codeBlock: {
    copyCode: '复制代码',
    from: '来源',
  },
  boxes: {
    infoDefault: '注意: ',
    warningDefault: '警告: ',
    successDefault: '关于: ',
    errorDefault: '错误',
  },
  code: {
    loading: '加载代码中...',
    error: '加载代码失败',
  },
  postModal: {
    zoomBack: '缩小返回',
    previousImage: '上一张图片',
    nextImage: '下一张图片',
    previous: '上一张',
    next: '下一张',
  },
  pageMeta: {
    created: '创建时间',
    updated: '更新时间',
    author: '作者: ',
    timeLabel: '时间: ',
  },
  editThisPage: {
    label: '在 Github / Gitlab 上编辑 ↵',
  },
  tablePagination: {
    itemsPerPage: '条数',
    previous: '上一页',
    next: '下一页',
  },
};

export const ES_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Buscar contenido...',
    searchResults: 'Resultados de búsqueda',
    noResults: 'No hay resultados',
    hits: 'coincidencias',
    collapse: 'Contraer',
    expand: 'Expandir',
    clearSearch: 'Limpiar búsqueda',
    allPosts: 'Todas las publicaciones',
    catalog: 'Catálogo',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'cambiar a oscuro',
    switchToLight: 'cambiar a claro',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Versión',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Inicio',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    none: 'Ninguna',
  },
  codeBlock: {
    copyCode: 'Copiar código',
    from: 'de',
  },
  boxes: {
    infoDefault: 'Aviso: ',
    warningDefault: 'Advertencia: ',
    successDefault: 'Éxito: ',
    errorDefault: 'Error: ',
  },
  code: {
    loading: 'Cargando código...',
    error: 'Error al cargar código',
  },
  postModal: {
    zoomBack: 'Restablecer zoom',
    previousImage: 'Imagen anterior',
    nextImage: 'Imagen siguiente',
    previous: 'Anterior',
    next: 'Siguiente',
  },
  pageMeta: {
    created: 'Creado',
    updated: 'Actualizado',
    author: 'Autor:',
    timeLabel: 'Hora:',
  },
  editThisPage: {
    label: 'Editar página en Github / Gitlab ↵',
  },
  tablePagination: {
    itemsPerPage: 'elementos',
    previous: 'Anterior',
    next: 'Siguiente',
  },
};

export const FR_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Rechercher...',
    searchResults: 'Résultats de recherche',
    noResults: 'Aucun résultat',
    hits: 'résultats',
    collapse: 'Réduire',
    expand: 'Développer',
    clearSearch: 'Effacer la recherche',
    allPosts: 'Tous les articles',
    catalog: 'Catalogue',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'passer au sombre',
    switchToLight: 'passer au clair',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Version',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Accueil',
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    none: 'Aucun',
  },
  codeBlock: {
    copyCode: 'Copier le code',
    from: 'de',
  },
  boxes: {
    infoDefault: 'Info: ',
    warningDefault: 'Avertissement: ',
    successDefault: 'Succès: ',
    errorDefault: 'Erreur: ',
  },
  code: {
    loading: 'Chargement du code...',
    error: 'Erreur de chargement',
  },
  postModal: {
    zoomBack: 'Zoom arrière',
    previousImage: 'Image précédente',
    nextImage: 'Image suivante',
    previous: 'Précédent',
    next: 'Suivant',
  },
  pageMeta: {
    created: 'Créé',
    updated: 'Mis à jour',
    author: 'Auteur :',
    timeLabel: 'Heure :',
  },
  editThisPage: {
    label: 'Éditer sur Github / Gitlab ↵',
  },
  tablePagination: {
    itemsPerPage: 'éléments',
    previous: 'Précédent',
    next: 'Suivant',
  },
};

export const DE_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Inhalt suchen...',
    searchResults: 'Suchergebnisse',
    noResults: 'Keine Ergebnisse',
    hits: 'Treffer',
    collapse: 'Einklappen',
    expand: 'Aufklappen',
    clearSearch: 'Suche löschen',
    allPosts: 'Alle Beiträge',
    catalog: 'Katalog',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'zu dunkel wechseln',
    switchToLight: 'zu hell wechseln',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Version',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Startseite',
    previousPage: 'Vorherige Seite',
    nextPage: 'Nächste Seite',
    none: 'Keine',
  },
  codeBlock: {
    copyCode: 'Code kopieren',
    from: 'von',
  },
  boxes: {
    infoDefault: 'Hinweis: ',
    warningDefault: 'Warnung: ',
    successDefault: 'Erfolg: ',
    errorDefault: 'Fehler: ',
  },
  code: {
    loading: 'Code wird geladen...',
    error: 'Fehler beim Laden',
  },
  postModal: {
    zoomBack: 'Zoom zurück',
    previousImage: 'Vorheriges Bild',
    nextImage: 'Nächstes Bild',
    previous: 'Vorheriges',
    next: 'Nächstes',
  },
  pageMeta: {
    created: 'Erstellt',
    updated: 'Aktualisiert',
    author: 'Autor:',
    timeLabel: 'Zeit:',
  },
  editThisPage: {
    label: 'Auf Github / Gitlab bearbeiten ↵',
  },
  tablePagination: {
    itemsPerPage: 'Einträge',
    previous: 'Vorherige',
    next: 'Nächste',
  },
};

export const JA_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'コンテンツを検索...',
    searchResults: '検索結果',
    noResults: '検索結果なし',
    hits: '件',
    collapse: '折りたたむ',
    expand: '展開する',
    clearSearch: '検索をクリア',
    allPosts: 'すべての記事',
    catalog: 'カタログ',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'ダークモードに切り替え',
    switchToLight: 'ライトモードに切り替え',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'バージョン',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'ホーム',
    previousPage: '前のページ',
    nextPage: '次のページ',
    none: 'なし',
  },
  codeBlock: {
    copyCode: 'コードをコピー',
    from: '出典',
  },
  boxes: {
    infoDefault: '通知: ',
    warningDefault: '警告: ',
    successDefault: '成功: ',
    errorDefault: 'エラー: ',
  },
  code: {
    loading: 'コードを読み込み中...',
    error: 'コードの読み込みエラー',
  },
  postModal: {
    zoomBack: 'ズーム戻る',
    previousImage: '前の画像',
    nextImage: '次の画像',
    previous: '前へ',
    next: '次へ',
  },
  pageMeta: {
    created: '作成日',
    updated: '更新日',
    author: '作成者:',
    timeLabel: '時間:',
  },
  editThisPage: {
    label: 'Github / Gitlab で編集 ↵',
  },
  tablePagination: {
    itemsPerPage: '件',
    previous: '前へ',
    next: '次へ',
  },
};

export const KO_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: '콘텐츠 검색...',
    searchResults: '검색 결과',
    noResults: '검색 결과 없음',
    hits: '개 일치',
    collapse: '접기',
    expand: '펼치기',
    clearSearch: '검색 지우기',
    allPosts: '모든 게시물',
    catalog: '목차',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: '다크 모드로 전환',
    switchToLight: '라이트 모드로 전환',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: '버전',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: '홈',
    previousPage: '이전 페이지',
    nextPage: '다음 페이지',
    none: '없음',
  },
  codeBlock: {
    copyCode: '코드 복사',
    from: '출처',
  },
  boxes: {
    infoDefault: '알림: ',
    warningDefault: '경고: ',
    successDefault: '성공: ',
    errorDefault: '오류: ',
  },
  code: {
    loading: '코드 로딩 중...',
    error: '코드 로딩 오류',
  },
  postModal: {
    zoomBack: '확대 축소',
    previousImage: '이전 이미지',
    nextImage: '다음 이미지',
    previous: '이전',
    next: '다음',
  },
  pageMeta: {
    created: '생성일',
    updated: '수정일',
    author: '작성자:',
    timeLabel: '시간:',
  },
  editThisPage: {
    label: 'Github / Gitlab에서 편집 ↵',
  },
  tablePagination: {
    itemsPerPage: '개',
    previous: '이전',
    next: '다음',
  },
};

export const RU_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Поиск содержимого...',
    searchResults: 'Результаты поиска',
    noResults: 'Нет результатов',
    hits: 'совпадений',
    collapse: 'Свернуть',
    expand: 'Развернуть',
    clearSearch: 'Очистить поиск',
    allPosts: 'Все записи',
    catalog: 'Каталог',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'переключить на тёмную',
    switchToLight: 'переключить на светлую',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Версия',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Главная',
    previousPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
    none: 'Нет',
  },
  codeBlock: {
    copyCode: 'Копировать код',
    from: 'из',
  },
  boxes: {
    infoDefault: 'Примечание: ',
    warningDefault: 'Предупреждение: ',
    successDefault: 'Успех: ',
    errorDefault: 'Ошибка: ',
  },
  code: {
    loading: 'Загрузка кода...',
    error: 'Ошибка загрузки кода',
  },
  postModal: {
    zoomBack: 'Уменьшить',
    previousImage: 'Предыдущее изображение',
    nextImage: 'Следующее изображение',
    previous: 'Предыдущий',
    next: 'Следующий',
  },
  pageMeta: {
    created: 'Создано',
    updated: 'Обновлено',
    author: 'Автор:',
    timeLabel: 'Время:',
  },
  editThisPage: {
    label: 'Редактировать на Github / Gitlab ↵',
  },
  tablePagination: {
    itemsPerPage: 'записей',
    previous: 'Предыдущая',
    next: 'Следующая',
  },
};

export const PT_STRINGS: I18nStrings = {
  sidebar: {
    searchPlaceholder: 'Pesquisar conteúdo...',
    searchResults: 'Resultados da pesquisa',
    noResults: 'Nenhum resultado',
    hits: 'ocorrências',
    collapse: 'Recolher',
    expand: 'Expandir',
    clearSearch: 'Limpar pesquisa',
    allPosts: 'Todas as publicações',
    catalog: 'Catálogo',
  },
  header: {
    siteTitle: 'v0plex',
    switchToDark: 'mudar para escuro',
    switchToLight: 'mudar para claro',
  },
  footer: {
    siteName: 'v0plex',
    version: '1.0.0',
    versionLabel: 'Versão',
    lastUpdated: '{date}',
    copyright: '2026 sjl473',
    copyrightSymbol: '©',
  },
  pageNav: {
    home: 'Início',
    previousPage: 'Página anterior',
    nextPage: 'Página seguinte',
    none: 'Nenhuma',
  },
  codeBlock: {
    copyCode: 'Copiar código',
    from: 'de',
  },
  boxes: {
    infoDefault: 'Informação: ',
    warningDefault: 'Aviso: ',
    successDefault: 'Sucesso: ',
    errorDefault: 'Erro: ',
  },
  code: {
    loading: 'Carregando código...',
    error: 'Erro ao carregar código',
  },
  postModal: {
    zoomBack: 'Reduzir zoom',
    previousImage: 'Imagem anterior',
    nextImage: 'Imagem seguinte',
    previous: 'Anterior',
    next: 'Seguinte',
  },
  pageMeta: {
    created: 'Criado',
    updated: 'Atualizado',
    author: 'Autor:',
    timeLabel: 'Hora:',
  },
  editThisPage: {
    label: 'Editar no Github / Gitlab ↵',
  },
  tablePagination: {
    itemsPerPage: 'itens',
    previous: 'Anterior',
    next: 'Seguinte',
  },
};

export const TRANSLATIONS: Partial<Record<Locale, I18nStrings>> = {
  en: EN_STRINGS,
  zh: ZH_STRINGS,
  es: ES_STRINGS,
  fr: FR_STRINGS,
  de: DE_STRINGS,
  ja: JA_STRINGS,
  ko: KO_STRINGS,
  ru: RU_STRINGS,
  pt: PT_STRINGS,
};

export const DATE_FORMATS: Partial<Record<Locale, Intl.DateTimeFormatOptions>> = {
  en: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  zh: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  es: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  fr: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  de: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  ja: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  ko: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  ru: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  pt: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
};

const LOCALE_STRING_MAP: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
  pt: 'pt-BR',
};

export function getStrings(locale: Locale = DEFAULT_LOCALE): I18nStrings {
  return TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE] || EN_STRINGS;
}

export function formatDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
  const formatOptions = DATE_FORMATS[locale] || DATE_FORMATS[DEFAULT_LOCALE] || { year: 'numeric', month: 'short', day: 'numeric' };
  const localeString = LOCALE_STRING_MAP[locale] || LOCALE_STRING_MAP[DEFAULT_LOCALE] || 'en-US';
  return date.toLocaleDateString(localeString, formatOptions);
}

export function interpolateString(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}

// ----------------------------------------------------------------------------
// ‼️ EDIT THIS PAGE URL
// ----------------------------------------------------------------------------
export const EDIT_THIS_PAGE_URL = 'https://github.com/sjl473/v0plex-markdown';

// ----------------------------------------------------------------------------
// ‼️ SITE TITLE
// ----------------------------------------------------------------------------
export const SITE_TITLE_BASE = 'v0plex';

export function getPageTitle(articleTitle?: string): string {
  return articleTitle ? `${articleTitle} | ${SITE_TITLE_BASE}` : SITE_TITLE_BASE;
}

// ----------------------------------------------------------------------------
// ‼️ SITE METADATA - Avatar
// ----------------------------------------------------------------------------

export const SITE_METADATA = {
  title: SITE_TITLE_BASE,
  icons: {
    icon: '/v0plex_avatar.svg',
  },
} as const;
