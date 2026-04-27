# User Guide: Directory and Configuration Structure

## Directory Structure

The directory structure of v0plex is as follows:

```
.
├── LICENSE
├── README.md
├── app
│   ├── client-layout.module.css
│   ├── client-layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page // rendered react tsx pages
│   │   ├── 1aa8abad
│   │   │   └── page.tsx
│   │   ├── 3984af33
│   │   │   └── page.tsx
│   │   ├── 406e1cb8
│   │   │   └── page.tsx
│   .......
│   ├── page.module.css
│   └── page.tsx // first page
├── components
│   ├── common
│   ....... common react component
│   └── vmd
│   ......... vmd extension
├── config
│   └── site.config.ts
├── dev
│   ├── assets
│   │   └── images
│   │       └── pasted_file.png
│   ├── en
│   │   ├── _01_foo bar foo
│   │   │   ├── _00_bar bar bar.md
│   │   │   ├── _01_foo foo foo.md
│   ........................................
│   └── zh
│       ├── _01_符符符
│       │   ├── _00_吧 吧 吧.md
│       │   ├── _01_吧 吧 符.md
│       .......................................
├── gh-page-output
........... static deployment files
├── next-env.d.ts
├── next.config.mjs
├── node_modules
............... node modules
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── mathjax-fonts
│   │   ├── MathJax_AMS-Regular.woff
│   │   ├── MathJax_Calligraphic-Bold.woff
│   │   ├── MathJax_Calligraphic-Regular.woff
│   │   ├── MathJax_Fraktur-Bold.woff
│   │   ├── MathJax_Main-Italic.woff
│   │   ├── MathJax_Main-Regular.woff
│   │   ├── MathJax_Math-BoldItalic.woff
│   │   ├── MathJax_Math-Italic.woff
│   │   ├── MathJax_SansSerif-Bold.woff
│   │   ├── MathJax_SansSerif-Italic.woff
│   │   ├── MathJax_SansSerif-Regular.woff
│   │   ├── MathJax_Script-Regular.woff
│   │   ├── MathJax_Size1-Regular.woff
│   │   ├── MathJax_Size2-Regular.woff
│   │   ├── MathJax_Size3-Regular.woff
│   │   ├── MathJax_Size4-Regular.woff
│   │   ├── MathJax_Typewriter-Regular.woff
│   │   ├── MathJax_Vector-Bold.woff
│   │   ├── MathJax_Vector-Regular.woff
│   │   └── MathJax_Zero.woff
│   ├── tex-chtml-full-speech.js
│   ├── v0plex_avatar.svg
│   ├── vmdcode
│   │   ├── 0012a3fa000c5dc26ee658c3c58e12cecd58d6455cec3d5621f0c787675b38aa.txt
│   │   ├── 005d0b7e5c261dcc5e2f8568e69a0b30e889a3275b55b18ec20a7deef0081e90.txt
│   ................... static code file after rendering
│   ├── vmdimage
│   │   ├── 0008d9e3ab277968c79f72cf5319d7e5102094d6cbbede57ce7f6b1b2e1d2a4e.png
│   │   ├── 06094bb49c11ae3e6adc907eefa06c9ae72cdace3382405b3b05352d8b7ee40d.png
│   .................. static code file after rendering
│   └── vmdjson
│       └── site-data.json
├── scripts
│   └── search-script
│       ├── english_words.txt
│       ├── ignore_files.txt
│       ├── lex.py
│       ├── stopwords.txt
│       └── user_dict.txt
├── tsconfig.json
├── types
│   ├── css.d.ts
│   └── react-syntax-highlighter.d.ts
├── vitest.config.ts
├── vmd_parser
│   ├── __tests__
│   │   ├── compiler.test.ts
│   │   └── fixtures
│   │       └── markdown
│   │           ├── invalid_example.md
│   │           └── valid_example.md
│   ├── convert_to_vmd.ts
│   ├── extensions.ts
│   ├── main.ts
│   ├── state_machine.ts
│   ├── syntax_validator.ts
│   ├── types.ts
│   └── vmd_util.ts
└── wiki
....... wiki for this project
```

The site configuration file is located at `config/site.config.ts`. This file controls the basic configuration of v0plex.

## Configuring the Markdown Repository

`CONTENT_SOURCE_CONFIG` determines where v0plex reads Markdown from. It is recommended to use a remote Github / Gitlab repository as the Markdown source. For example:

```typescript
export const CONTENT_SOURCE_CONFIG = {
  USE_LOCAL_MARKDOWN: false,
  GIT_CONFIG: {
    REPO_URL: 'https://github.com/sjl473/v0plex-markdown',
    BRANCH: 'main',
  },
} as const;
```

This configuration means v0plex will pull Markdown from the `main` branch of `https://github.com/sjl473/v0plex-markdown` as the documentation source for this project. When `USE_LOCAL_MARKDOWN: true`, v0plex will not pull Markdown from the remote source but will use the local `dev/` folder as the documentation source.

```typescript
export const CONTENT_SOURCE_CONFIG: {
  USE_LOCAL_MARKDOWN: true,
}
```

In local mode, users need to create content files in the project's `dev/` directory. The directory structure must be organized by language; currently supported language codes include:

```typescript
// export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt'];
export const ENABLED_LANGUAGES: Locale[] = ['en', 'zh'];
```

In remote mode (`USE_LOCAL_MARKDOWN: false`), v0plex will by default delete the local `dev/` directory and then clone the configured repository each time the build or dev command is run. This means that if you use remote mode, local modifications to the `dev/` directory will be lost on the next build.

v0plex retains the local mode `USE_LOCAL_MARKDOWN: false` but does not recommend using it. It is suggested to set `USE_LOCAL_MARKDOWN: true`, separating Markdown text content and TSX code content into two different repositories.

### Handling the `@git` Placeholder in Markdown Frontmatter

The two modes handle the `@git` placeholder differently. In local mode, `@git` uses the git history of the v0plex project itself. In remote mode, `@git` uses the git history of the content repository.

- `created_at: @git` — Uses the date of the file's first git commit (earliest commit).
- `last_updated_at: @git` — Uses the date of the file's most recent git modification (latest commit).
- `author: @git` — Retrieves **all committers** of the file in git history, sorted by commit time from oldest to newest, and automatically deduplicates (using email as the unique identifier). If the file has no git commit history, it falls back to the current git configuration's `user.name` and `user.email`.

If users want to use `@git` to auto-fill dates and authors, they need to ensure that the corresponding git repository has the expected commit history.

## Language Support

Each language has its own folder. For example, `dev/zh/` stores Chinese content, and `dev/en/` stores English content. If the user only wants to enable two languages (Chinese or English), simply refer to the configuration above.

Each language folder in the v0plex Markdown repository must contain at least one Markdown file. The language folder name must match the `folder` field configured in `AVAILABLE_LANGUAGES`. For example, if the user wants to use Korean, the folder should be named `ko`.

`DEFAULT_LOCALE` sets the site's default language. When a user first visits the site, if no language preference is saved in the browser, content in this language will be displayed. The example below sets Chinese as the preferred language. The default language should be one of the languages configured in `AVAILABLE_LANGUAGES`.

```typescript
DEFAULT_LOCALE: 'zh'
```

### Metadata

The following configuration changes the website title in the browser and the site logo.

```typescript
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
    icon: '/v0plex_avatar.svg', // Icon under the default public path
  },
} as const;
```


## Frontmatter Tags (Not Fully Implemented)

`TAGS_CONFIG` defines the tags that can be used in frontmatter. Users must ensure that tags appearing in Markdown articles do not exceed the scope defined by this variable.

```typescript
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
```
