import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { cleanTitle, calculatePathHash } from './utils';
import { AssetProcessor } from './asset_processor';
import { FrontMatterParser } from './frontmatter';
import { MarkdownCompiler } from './markdown_compiler';
import { NavigationNode, SiteData } from './types';
import {
  VmdErrorCode,
  createVmdError,
  ErrorLocation,
  VmdError,
  VmdErrorSeverity,
  ErrorReporter
} from './errors';

export class SiteBuilder {
  private projectRoot: string;
  private assetProcessor: AssetProcessor;
  private markdownCompiler: MarkdownCompiler;
  private generatedTsxFiles = new Set<string>();
  private navigation: NavigationNode[] = [];
  private errorReporter: ErrorReporter;
  private currentFile: string = '';

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.assetProcessor = new AssetProcessor(projectRoot);
    this.markdownCompiler = new MarkdownCompiler(this.assetProcessor, projectRoot);
    this.errorReporter = new ErrorReporter();
  }

  public build(inputPath: string): boolean {
    console.log(`Building site from: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
      this.errorReporter.createError(
        VmdErrorCode.BUILD_INVALID_PATH,
        { path: inputPath }
      );
      this.errorReporter.printReports();
      return false;
    }

    try {
      const stats = fs.statSync(inputPath);
      if (stats.isDirectory()) {
        this.scanDirectoryForImages(inputPath);
        this.traverseDirectory(inputPath, this.navigation);
      } else if (stats.isFile()) {
        this.processFile(inputPath, this.navigation);
      }

      this.writeSiteData();

      this.errorReporter.printReports();
      const summary = this.errorReporter.getSummary();

      if (summary.errors > 0) {
        console.error(`Build failed with ${summary.errors} error(s) and ${summary.warnings} warning(s)`);
        return false;
      } else if (summary.warnings > 0) {
        console.warn(`Build completed with ${summary.warnings} warning(s)`);
      } else {
        console.log('Build completed successfully');
      }

      return true;
    } catch (err) {
      if (err instanceof VmdError) {
        this.errorReporter.report(err);
      } else {
        this.errorReporter.createError(
          VmdErrorCode.BUILD_ERROR,
          { details: err instanceof Error ? err.message : String(err) },
          { file: inputPath }
        );
      }
      this.errorReporter.printReports();
      return false;
    }
  }

  private scanDirectoryForImages(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    items.forEach(item => {
      if (item.startsWith('.') || item === 'node_modules' || CONFIG.EXCLUDED_DIRS.includes(item)) return;

      const srcPath = path.join(dir, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        this.scanDirectoryForImages(srcPath);
      } else if (stats.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
          try {
            this.assetProcessor.processImage(srcPath);
          } catch (err) {
            if (err instanceof VmdError) {
              this.errorReporter.report(err);
            }
          }
        }
      }
    });
  }

  private traverseDirectory(dir: string, navContainer: NavigationNode[]): void {
    const items = fs.readdirSync(dir);

    items.sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/^(\d+)_/);
        return match ? parseInt(match[1], 10) : null;
      };
      const numA = getNum(a);
      const numB = getNum(b);
      if (numA !== null && numB !== null) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    items.forEach(item => {
      if (item.startsWith('.') || CONFIG.EXCLUDED_DIRS.includes(item)) return;

      const srcPath = path.join(dir, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        if (/^_(\d+)/.test(item)) {
          const folderTitle = cleanTitle(item, true);
          const newNavGroup: NavigationNode = {
            title: folderTitle,
            type: 'folder',
            path: "",
            hash: "",
            hasCustomTsx: false,
            mdPath: "",
            tsxPath: "",
            codeFiles: [],
            images: [],
            children: []
          };
          navContainer.push(newNavGroup);
          this.traverseDirectory(srcPath, newNavGroup.children);
        }
      } else if (stats.isFile()) {
        this.processFile(srcPath, navContainer);
      }
    });
  }

  private processFile(srcPath: string, navContainer: NavigationNode[]): void {
    const ext = path.extname(srcPath).toLowerCase();
    const relativePath = path.relative(this.projectRoot, srcPath);
    const item = path.basename(srcPath);
    const location: ErrorLocation = { file: relativePath };

    this.currentFile = relativePath;

    if (ext === '.md' || ext === '.mdx') {
      console.log(`Processing MD/MDX: ${srcPath}`);

      let mdContent: string;
      try {
        mdContent = fs.readFileSync(srcPath, 'utf8');
      } catch (err) {
        this.errorReporter.createError(
          VmdErrorCode.FILE_SYSTEM_ERROR,
          { message: `Cannot read file: ${err instanceof Error ? err.message : String(err)}` },
          location
        );
        return;
      }

      const hash = calculatePathHash(relativePath);
      const pageOutDir = path.join(this.projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);

      try {
        fs.mkdirSync(pageOutDir, { recursive: true });
      } catch (err) {
        this.errorReporter.createError(
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

        const pageTitle = attributes.title || cleanTitle(item);
        const hasCustomTsx = FrontMatterParser.hasCustomTsx(attributes);

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
            tsxPath: path.relative(this.projectRoot, destFile),
            codeFiles: [],
            images: [],
            children: []
          });

          this.generatedTsxFiles.add(path.basename(expectedTsxPath));
          return;
        }

        if (!body.trim().startsWith('# ')) {
          throw createVmdError(
            VmdErrorCode.BUILD_MISSING_H1,
            {},
            location
          );
        }

        const { html, generatedFiles, usedImages } = this.markdownCompiler.compile(body, attributes, relativePath, frontmatterLineCount);

        const reactSafeHtml = html.replace(/class="/g, 'className="');
        const editUrl = `${CONFIG.GITHUB_REPO_BASE_URL}/out/${hash}`;

        const tsxContent = `
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
  Olvmd
} from '${CONFIG.COMPONENT_IMPORT_PATH}';
import { VmdThemeProvider } from '@/components/vmd/vmd-theme-context';
import PageDates from '@/components/common/last-updated-at';
import EditThisPage from '@/components/common/edit-this-page';

export default function GeneratedPage() {
  return (
    <VmdThemeProvider>
      <div className="v0plex-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="page-typography-content" style={{ flex: 1 }}>
${reactSafeHtml}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <EditThisPage url="${editUrl}" />
        </div>
      </div>
    </VmdThemeProvider>
  );
}
`;
        fs.writeFileSync(destFile, tsxContent.trim());

        navContainer.push({
          title: pageTitle,
          type: 'page',
          path: `/${hash}`,
          hash: hash,
          hasCustomTsx: hasCustomTsx,
          mdPath: relativePath,
          tsxPath: path.relative(this.projectRoot, destFile),
          codeFiles: generatedFiles.map(f => ({ originalPath: "", hashPath: path.join(CONFIG.VMD_CODE_DIR, f) })),
          images: usedImages.map(img => ({ originalName: img.originalName, hashPath: path.join(CONFIG.VMD_IMAGE_DIR, img.hashName) })),
          children: []
        });

        this.generatedTsxFiles.add(path.basename(srcPath, ext) + '.tsx');

      } catch (err) {
        if (err instanceof VmdError) {
          this.errorReporter.report(err);
        } else {
          this.errorReporter.createError(
            VmdErrorCode.BUILD_ERROR,
            { details: err instanceof Error ? err.message : String(err) },
            location
          );
        }
      }

    } else if (ext === '.tsx') {
      const basename = path.basename(item);
      if (!this.generatedTsxFiles.has(basename)) {
        console.log(`Processing Custom TSX: ${srcPath}`);

        let content: string;
        try {
          content = fs.readFileSync(srcPath, 'utf8');
        } catch (err) {
          this.errorReporter.createError(
            VmdErrorCode.FILE_SYSTEM_ERROR,
            { message: `Cannot read TSX file: ${err instanceof Error ? err.message : String(err)}` },
            location
          );
          return;
        }

        const hash = calculatePathHash(relativePath);
        const pageOutDir = path.join(this.projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);

        try {
          fs.mkdirSync(pageOutDir, { recursive: true });
        } catch (err) {
          this.errorReporter.createError(
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
          this.errorReporter.createError(
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
          tsxPath: path.relative(this.projectRoot, destFile),
          codeFiles: [],
          images: [],
          children: []
        });
      }
    }
  }

  private writeSiteData(): void {
    const siteData: SiteData = {
      navigation: this.navigation,
      images: this.assetProcessor.getSiteImages()
    };

    const jsonDir = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_JSON_DIR);
    const jsonPath = path.join(jsonDir, CONFIG.SITE_DATA_JSON);

    try {
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }
      fs.writeFileSync(jsonPath, JSON.stringify(siteData, null, 2));
      console.log(`Generated unified ${CONFIG.SITE_DATA_JSON}`);
    } catch (err) {
      this.errorReporter.createError(
        VmdErrorCode.FILE_SYSTEM_ERROR,
        { message: `Cannot write site data: ${err instanceof Error ? err.message : String(err)}` },
        { file: jsonPath }
      );
    }
  }

  public getErrorReporter(): ErrorReporter {
    return this.errorReporter;
  }
}
