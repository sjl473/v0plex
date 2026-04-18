/**
 * File Processor
 * Processes markdown and TSX files
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { cleanTitle, calculatePathHash, resolveDate, resolveAuthor, validateGitEnvironment } from '../utils';
import { AssetProcessor } from '../asset_processor';
import { FrontMatterParser } from '../frontmatter';
import { NavigationNode } from '../types';
import { VmdErrorCode, createVmdError, ErrorReporter, VmdError } from '../errors';

/**
 * Parse tags from frontmatter string format "[tag1, tag2, tag3]"
 */
function parseTags(tagsValue: string | undefined): string[] {
  if (!tagsValue) {
    return [];
  }

  const match = tagsValue.match(/^\[([^\]]*)\]$/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Process a single file (markdown or TSX)
 */
export function processFile(
  srcPath: string,
  navContainer: NavigationNode[],
  projectRoot: string,
  assetProcessor: AssetProcessor,
  markdownCompiler: any,
  generatedTsxFiles: Set<string>,
  errorReporter: ErrorReporter,
  locale?: string
): void {
  const ext = path.extname(srcPath).toLowerCase();
  const relativePath = path.relative(projectRoot, srcPath);
  const item = path.basename(srcPath);
  const location = { file: relativePath };

  if (ext === '.md' || ext === '.mdx') {
    processMarkdownFile(srcPath, navContainer, projectRoot, assetProcessor, markdownCompiler, generatedTsxFiles, errorReporter, locale);
  } else if (ext === '.tsx') {
    processTsxFile(srcPath, navContainer, projectRoot, generatedTsxFiles, errorReporter, locale);
  }
}

/**
 * Process a markdown file
 */
function processMarkdownFile(
  srcPath: string,
  navContainer: NavigationNode[],
  projectRoot: string,
  assetProcessor: AssetProcessor,
  markdownCompiler: any,
  generatedTsxFiles: Set<string>,
  errorReporter: ErrorReporter,
  locale?: string
): void {
  const ext = path.extname(srcPath).toLowerCase();
  const relativePath = path.relative(projectRoot, srcPath);
  const item = path.basename(srcPath);
  const location = { file: relativePath };

  console.log(`Processing MD/MDX: ${srcPath}`);

  let mdContent: string;
  try {
    mdContent = fs.readFileSync(srcPath, 'utf8');
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot read file: ${err instanceof Error ? err.message : String(err)}` },
      location
    );
    return;
  }

  const hash = calculatePathHash(relativePath);
  const pageOutDir = path.join(projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);

  try {
    fs.mkdirSync(pageOutDir, { recursive: true });
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot create directory: ${err instanceof Error ? err.message : String(err)}` },
      location
    );
    return;
  }

  const destFile = path.join(pageOutDir, 'page.tsx');

  try {
    const { attributes, body, frontmatterLineCount } = FrontMatterParser.parse(mdContent, relativePath);
    FrontMatterParser.validate(attributes, relativePath);

    const pageTitle = cleanTitle(item);
    const hasCustomTsx = FrontMatterParser.hasCustomTsx(attributes);
    const tags = parseTags(attributes.tags as string);

    // Resolve @git dates to actual dates and @git author
    const createdAt = resolveDate(attributes.created_at as string, srcPath, 'earliest');
    const lastUpdatedAt = resolveDate(attributes.last_updated_at as string, srcPath, 'latest');
    const resolvedAuthor = resolveAuthor(attributes.author as string);

    if (hasCustomTsx) {
      const mdBaseName = path.basename(srcPath, ext);
      const expectedTsxPath = path.join(path.dirname(srcPath), `${mdBaseName}.tsx`);

      if (!fs.existsSync(expectedTsxPath)) {
        throw createVmdError(
          VmdErrorCode.BUILD_MISSING_CUSTOM_TSX,
          { expectedPath: expectedTsxPath },
          location
        );
      }

      const tsxContent = fs.readFileSync(expectedTsxPath, 'utf8');
      fs.writeFileSync(destFile, tsxContent);

      navContainer.push({
        title: pageTitle,
        type: 'page',
        path: `/${hash}`,
        hash: hash,
        hasCustomTsx: true,
        mdPath: relativePath,
        tsxPath: path.relative(projectRoot, destFile),
        codeFiles: [],
        images: [],
        tags: tags,
        locale: locale,
        children: []
      });

      generatedTsxFiles.add(path.basename(expectedTsxPath));
      return;
    }

    if (!body.trim().startsWith('# ')) {
      throw createVmdError(
        VmdErrorCode.BUILD_MISSING_H1,
        {},
        location
      );
    }

    const { html, generatedFiles, usedImages } = markdownCompiler.compile(body, attributes, relativePath, frontmatterLineCount);

    const reactSafeHtml = html.replace(/class="/g, 'className="');
    const editUrl = `${CONFIG.GITHUB_REPO_BASE_URL}${CONFIG.URL_PREFIX}/${hash}`;

    const tsxContent = generatePageComponent(reactSafeHtml, editUrl, createdAt, lastUpdatedAt, resolvedAuthor);
    fs.writeFileSync(destFile, tsxContent.trim());

    navContainer.push({
      title: pageTitle,
      type: 'page',
      path: `/${hash}`,
      hash: hash,
      hasCustomTsx: hasCustomTsx,
      mdPath: relativePath,
      tsxPath: path.relative(projectRoot, destFile),
      codeFiles: generatedFiles.map((f: string) => ({ originalPath: "", hashPath: path.join(CONFIG.VMD_CODE_DIR, f) })),
      images: usedImages.map((img: any) => ({ originalName: img.originalName, hashPath: path.join(CONFIG.VMD_IMAGE_DIR, img.hashName) })),
      tags: tags,
      locale: locale,
      children: []
    });

    generatedTsxFiles.add(path.basename(srcPath, ext) + '.tsx');

  } catch (err) {
    if (err instanceof VmdError) {
      errorReporter.report(err);
    } else {
      errorReporter.createError(
        VmdErrorCode.BUILD_ERROR,
        { details: err instanceof Error ? err.message : String(err) },
        location
      );
    }
  }
}

/**
 * Process a custom TSX file
 */
function processTsxFile(
  srcPath: string,
  navContainer: NavigationNode[],
  projectRoot: string,
  generatedTsxFiles: Set<string>,
  errorReporter: ErrorReporter,
  locale?: string
): void {
  const relativePath = path.relative(projectRoot, srcPath);
  const item = path.basename(srcPath);
  const location = { file: relativePath };
  const basename = path.basename(item);

  if (generatedTsxFiles.has(basename)) {
    return; // Skip already processed files
  }

  console.log(`Processing Custom TSX: ${srcPath}`);

  let content: string;
  try {
    content = fs.readFileSync(srcPath, 'utf8');
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot read TSX file: ${err instanceof Error ? err.message : String(err)}` },
      location
    );
    return;
  }

  const hash = calculatePathHash(relativePath);
  const pageOutDir = path.join(projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);

  try {
    fs.mkdirSync(pageOutDir, { recursive: true });
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot create directory: ${err instanceof Error ? err.message : String(err)}` },
      location
    );
    return;
  }

  const destFile = path.join(pageOutDir, 'page.tsx');

  try {
    fs.writeFileSync(destFile, content);
  } catch (err) {
    errorReporter.createError(
      VmdErrorCode.FILE_SYSTEM_ERROR,
      { message: `Cannot write TSX file: ${err instanceof Error ? err.message : String(err)}` },
      location
    );
    return;
  }

  navContainer.push({
    title: cleanTitle(item),
    type: 'page',
    path: `/${hash}`,
    hash: hash,
    hasCustomTsx: true,
    mdPath: "",
    tsxPath: path.relative(projectRoot, destFile),
    codeFiles: [],
    images: [],
    tags: [],
    locale: locale,
    children: []
  });
}

/**
 * Generate page component TSX content
 */
function generatePageComponent(reactSafeHtml: string, editUrl: string, createdAt: string, lastUpdatedAt: string, author: string): string {
  // Inject PageDates right after the H1 heading in the content
  const pageDatesComponent = `<PageDates publishedAt="${createdAt}" updatedAt="${lastUpdatedAt}" author="${author}" />`;
  
  // Find the first H1vmd tag and inject PageDates after it
  const h1Regex = /(<H1vmd[^>]*>[\s\S]*?<\/H1vmd>)/;
  let contentWithMeta = reactSafeHtml;
  if (h1Regex.test(reactSafeHtml)) {
    contentWithMeta = reactSafeHtml.replace(h1Regex, `$1\n${pageDatesComponent}`);
  } else {
    // If no H1, prepend PageDates at the beginning
    contentWithMeta = pageDatesComponent + '\n' + reactSafeHtml;
  }
  
  return `
"use client"

import React from 'react';
import {
  H1vmd, H2vmd, H3vmd, H4vmd, H5vmd, H6vmd,
  Pvmd,
  Boldvmd, Italicvmd, Bolditvmd, Strikevmd, Brvmd,
  Ulvmd, Livmd,
  Avmd, Imgvmd, Smallimgvmd,
  Inlinecodevmd, Blockcodevmd,
  Inlinemathvmd, Blockmathvmd,
  Blockquotevmd,
  Infovmd, Warningvmd, Successvmd, Titlevmd, Contentvmd,
  Postvmd, Lftvmd, Rtvmd,
  Olvmd,
  Tablevmd, Tableheadvmd, Tablebodyvmd, Tablerowvmd, Tablecellvmd
} from '${CONFIG.COMPONENT_IMPORT_PATH}';
import { VmdThemeProvider } from '@/components/vmd/vmd-theme-context';
import PageDates from '@/components/common/last-updated-at';
import EditThisPage from '@/components/common/edit-this-page';

export default function GeneratedPage() {
  return (
    <VmdThemeProvider>
      <div className="v0plex-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="page-typography-content" style={{ flex: 1 }}>
${contentWithMeta}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <EditThisPage url="${editUrl}" />
        </div>
      </div>
    </VmdThemeProvider>
  );
}
`;
}
