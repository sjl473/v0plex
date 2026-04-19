export const URL_PREFIX = 'page';

/**
 * Content Source Configuration
 * ============================================================================
 *
 * USE_LOCAL_MARKDOWN:
 *   - true: Use local dev folder for markdown content
 *   - false: Pull content from a remote git repository
 *
 * When USE_LOCAL_MARKDOWN is false, the dev folder will be:
 *   1. Completely deleted before each build/dev
 *   2. Re-populated from the remote git repository (full clone)
 *   3. .git folder will be kept for git history access
 *
 * =============================================================================
 * REMOTE GIT MODE VALIDATION
 * =============================================================================
 *
 * When USE_LOCAL_MARKDOWN is false:
 *   1. REPO_URL is REQUIRED
 *   2. Full git clone is always performed (no shallow clone)
 *   3. Directory structure must follow: dev/{language}/... format
 *   4. Language folders must match AVAILABLE_LANGUAGES configuration
 *   5. @git in frontmatter will use the downloaded repository's git history
 *
 * =============================================================================
 * LOCAL MODE VALIDATION (USE_LOCAL_MARKDOWN: true)
 * =============================================================================
 *
 * When using local mode, the dev folder must satisfy:
 *   1. Must contain at least one language folder (e.g., 'en', 'zh')
 *   2. Must contain at least one file (not just folders)
 *   3. @git in frontmatter will use the v0plex project's git history
 *
 * If validation fails, the build will error with a descriptive message.
 */
export const CONTENT_SOURCE_CONFIG = {
  /**
   * Whether to use local markdown files in the dev folder
   * If false, content will be pulled from a remote git repository
   */
  USE_LOCAL_MARKDOWN: false,

  /**
   * Git repository configuration (only used when USE_LOCAL_MARKDOWN is false)
   */
  GIT_CONFIG: {
    /**
     * Git repository URL (supports GitHub, GitLab, etc.)
     * REQUIRED when USE_LOCAL_MARKDOWN is false
     * Example: 'https://github.com/username/repo.git' or 'git@gitlab.com:username/repo.git'
     */
    REPO_URL: 'https://github.com/sjl473/v0plex-markdown',

    /**
     * Branch to clone from
     * Default: 'main'
     */
    BRANCH: 'main',
  },
} as const;

export type ContentSourceConfig = typeof CONTENT_SOURCE_CONFIG;

export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 300,
  RIGHT_SIDEBAR_WIDTH: 300, // New right sidebar width
  LEFT_CONTENT_OFFSET: {
    pc: '1.25rem',      // PC layout (≥1025px)
    tablet: '1rem',     // Tablet layout (601px-1024px)
    mobile: '0.5rem'    // Mobile layout (≤600px) - matches header padding
  }
} as const;

export const SITE_CONFIG = {
  URL_PREFIX: `/${URL_PREFIX}`,
  OUT_DIR: URL_PREFIX,
  DATA_PATHS: {
    SITE_DATA: '/vmdjson/site-data.json',
    VMD_CODE: '/vmdcode/',
    VMD_IMAGE: '/vmdimage/',
    VMD_JSON: '/vmdjson/',
  },
  GITHUB_PAGES_URL: 'https://sjl473.github.io/v0plex',
  BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
} as const;

/**
 * VMD Parser Build Configuration
 * ============================================================================
 */
export const BUILD_CONFIG = {
  /** Public directory for static assets */
  PUBLIC_DIR: 'public',
  /** Next.js app directory */
  APP_DIR: 'app',
  /** Output directory for generated pages (uses URL_PREFIX) */
  OUT_DIR: URL_PREFIX,
  /** Directory for code files */
  VMD_CODE_DIR: 'vmdcode',
  /** Directory for processed images */
  VMD_IMAGE_DIR: 'vmdimage',
  /** Directory for JSON data */
  VMD_JSON_DIR: 'vmdjson',
  /** URL prefix for routing */
  URL_PREFIX: `/${URL_PREFIX}`,
  /** Directories to exclude from scanning */
  EXCLUDED_DIRS: ['node_modules', 'libs', 'vmd', 'dist', 'build', '.git', '.idea', 'assets', URL_PREFIX] as string[],
  /** Site data JSON filename */
  SITE_DATA_JSON: 'site-data.json',
  /** Component import path for generated pages */
  COMPONENT_IMPORT_PATH: '@/components/vmd/vmdimporter',
  /** Web path prefix for images */
  IMAGE_WEB_PREFIX: SITE_CONFIG.DATA_PATHS.VMD_IMAGE,
  /** GitHub repo base URL for edit links */
  GITHUB_REPO_BASE_URL: '',
} as const;

/**
 * VMD Tags Configuration
 * Allowed tags for markdown frontmatter
 */
export const TAGS_CONFIG = {
  description: 'VMD Compiler - Allowed Tags Configuration',
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

export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_STORAGE_KEY = 'v0plex-locale';

export type Locale = 'en' | 'zh';

export interface LanguageConfig {
  code: Locale;
  name: string;
  nativeName: string;
  folder: string;
}

export const AVAILABLE_LANGUAGES: LanguageConfig[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', folder: 'zh' },
  { code: 'en', name: 'English', nativeName: 'English', folder: 'en' },
];

export function getLanguageConfig(locale: Locale): LanguageConfig {
  return AVAILABLE_LANGUAGES.find(lang => lang.code === locale) || AVAILABLE_LANGUAGES[0];
}

export function isValidLocale(locale: string): locale is Locale {
  return AVAILABLE_LANGUAGES.some(lang => lang.code === locale);
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
    siteDescription: string;
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
    siteDescription: 'Commercial Loan Platform Management Handbooks',
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
    siteDescription: '商业贷款平台管理手册',
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

export const TRANSLATIONS: Partial<Record<Locale, I18nStrings>> = {
  en: EN_STRINGS,
  zh: ZH_STRINGS,
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
};

export function getStrings(locale: Locale = DEFAULT_LOCALE): I18nStrings {
  return TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE] || EN_STRINGS;
}

export function formatDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
  const formatOptions = DATE_FORMATS[locale] || DATE_FORMATS[DEFAULT_LOCALE] || { year: 'numeric', month: 'short', day: 'numeric' };
  const localeString = locale === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(localeString, formatOptions);
}

export function interpolateString(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}
