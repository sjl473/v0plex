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

// ============================================================================
// INTERNATIONALIZATION (i18n) CONFIGURATION
// ============================================================================

/**
 * Current locale setting
 * Change this to switch between languages
 * Supported: 'en' (English), 'zh' (Chinese)
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Supported locale types
 */
export type Locale = 'en' | 'zh';

/**
 * i18n String Structure
 * All user-facing UI strings are centralized here for easy translation
 */
export interface I18nStrings {
  // Sidebar component
  sidebar: {
    searchPlaceholder: string;
    searchResults: string;
    noResults: string;
    hits: string;
    collapse: string;
    expand: string;
    clearSearch: string;
    allPosts: string;
  };

  // Header component
  header: {
    siteTitle: string;
    siteDescription: string;
    switchToDark: string;
    switchToLight: string;
  };

  // Footer component
  footer: {
    version: string;
    versionLabel: string;
    lastUpdated: string;
    copyright: string;
    emailLabel: string;
    contactText: string;
  };

  // Page navigation
  pageNav: {
    home: string;
    previousPage: string;
    nextPage: string;
    none: string;
  };

  // Code block
  codeBlock: {
    copyCode: string;
    from: string;
  };

  // Highlight boxes (Info, Warning, Success)
  boxes: {
    infoDefault: string;
    warningDefault: string;
    successDefault: string;
  };

  // Code loading states
  code: {
    loading: string;
    error: string;
  };

  // Post modal (image viewer)
  postModal: {
    zoomBack: string;
    previousImage: string;
    nextImage: string;
    previous: string;
    next: string;
  };

  // Page metadata (author, dates)
  pageMeta: {
    created: string;
    updated: string;
    author: string;
  };
}

/**
 * English translations (default)
 */
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
  },

  header: {
    siteTitle: 'v0plex',
    siteDescription: 'Commercial Loan Platform Management Handbooks',
    switchToDark: 'switch dark',
    switchToLight: 'switch light',
  },

  footer: {
    version: 'preview test',
    versionLabel: 'Used version',
    lastUpdated: 'Last updated: {date}',
    copyright: '2026 sjl473, all rights reserved.',
    emailLabel: '@sjl473',
    contactText: 'If you have any questions, please make contact',
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
    infoDefault: 'Notice：',
    warningDefault: 'Warning',
    successDefault: 'Success',
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
    author: 'Author',
  },
};

/**
 * Chinese translations
 */
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
  },

  header: {
    siteTitle: 'v0plex',
    siteDescription: '商业贷款平台管理手册',
    switchToDark: '切换深色模式',
    switchToLight: '切换浅色模式',
  },

  footer: {
    version: '预览测试版',
    versionLabel: '当前版本',
    lastUpdated: '最后更新：{date}',
    copyright: '2026 sjl473，保留所有权利。',
    emailLabel: '@sjl473',
    contactText: '如有任何问题，请联系我们',
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
    infoDefault: '注意：',
    warningDefault: '警告',
    successDefault: '成功',
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
    author: '作者',
  },
};

/**
 * All available translations
 */
export const TRANSLATIONS: Record<Locale, I18nStrings> = {
  en: EN_STRINGS,
  zh: ZH_STRINGS,
};

/**
 * Date format configuration by locale
 */
export const DATE_FORMATS: Record<Locale, Intl.DateTimeFormatOptions> = {
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

/**
 * Get strings for the current locale
 * Usage: import { getStrings } from '@/config/site.config';
 *        const strings = getStrings();
 *        <input placeholder={strings.sidebar.searchPlaceholder} />
 */
export function getStrings(locale: Locale = DEFAULT_LOCALE): I18nStrings {
  return TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE];
}

/**
 * Format a date according to locale
 * Usage: const dateStr = formatDate(new Date(), 'zh');
 */
export function formatDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    DATE_FORMATS[locale]
  );
}

/**
 * Interpolate template string with values
 * Usage: interpolateString(strings.footer.lastUpdated, { date: '2026-01-01' })
 */
export function interpolateString(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}
