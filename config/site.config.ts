export const URL_PREFIX = 'page';

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
  };
  header: {
    siteTitle: string;
    siteDescription: string;
    switchToDark: string;
    switchToLight: string;
  };
  footer: {
    version: string;
    versionLabel: string;
    lastUpdated: string;
    copyright: string;
    emailLabel: string;
    contactText: string;
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
    warningDefault: '警告：',
    successDefault: '关于：',
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
