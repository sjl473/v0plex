import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { cleanTitle, calculatePathHash } from './utils';
import { AssetProcessor } from './asset_processor';
import { FrontMatterParser } from './frontmatter';
import { MarkdownCompiler } from './markdown_compiler';
import { NavigationNode, SiteData } from './types';

export class SiteBuilder {
  private projectRoot: string;
  private assetProcessor: AssetProcessor;
  private markdownCompiler: MarkdownCompiler;
  private generatedTsxFiles = new Set<string>();
  private navigation: NavigationNode[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.assetProcessor = new AssetProcessor(projectRoot);
    this.markdownCompiler = new MarkdownCompiler(this.assetProcessor);
  }

  public build(inputPath: string): void {
    console.log(`Building site from: ${inputPath}`);

    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
      this.scanDirectoryForImages(inputPath);
      this.traverseDirectory(inputPath, this.navigation);
    } else if (stats.isFile()) {
      this.processFile(inputPath, this.navigation);
    }

    this.writeSiteData();
    console.log("Build Complete.");
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
                 this.assetProcessor.processImage(srcPath);
             }
        }
    });
  }

  private traverseDirectory(dir: string, navContainer: NavigationNode[]): void {
    const items = fs.readdirSync(dir);
    
    // Sort items
    items.sort((a, b) => {
        const getNum = (s: string) => {
            const match = s.match(/^_(\d+)_/);
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
            if (/^_0\d/.test(item)) {
                const folderTitle = cleanTitle(item, true);
                const newNavGroup: NavigationNode = {
                    title: folderTitle,
                    type: 'folder',
                    path: "", hash: "", hasCustomTsx: false, mdPath: "", tsxPath: "",
                    codeFiles: [], images: [], children: []
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

    if (ext === '.md' || ext === '.mdx') {
        console.log(`Processing MD/MDX: ${srcPath}`);
        const mdContent = fs.readFileSync(srcPath, 'utf8');
        const hash = calculatePathHash(relativePath);
        const pageOutDir = path.join(this.projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);
        fs.mkdirSync(pageOutDir, { recursive: true });
        
        const destFile = path.join(pageOutDir, 'page.tsx');

        try {
            const { attributes, body } = FrontMatterParser.parse(mdContent);
            FrontMatterParser.validate(attributes, srcPath);

            const pageTitle = attributes.title || cleanTitle(item);
            const hasCustomTsx = attributes.has_custom_tsx === 'true' || attributes.has_custom_tsx === true;

            if (hasCustomTsx) {
                const mdBaseName = path.basename(srcPath, ext);
                const expectedTsxPath = path.join(path.dirname(srcPath), `${mdBaseName}.tsx`);

                if (!fs.existsSync(expectedTsxPath)) {
                    throw new Error(`has_custom_tsx=true but missing TSX: ${expectedTsxPath}`);
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

                // Prevent the matching TSX from also being processed in the ".tsx" branch
                this.generatedTsxFiles.add(path.basename(expectedTsxPath));
                return;
            }

            if (!body.trim().startsWith('# ')) {
                throw new Error(`File ${srcPath} is missing a markdown H1 ('# Title').`);
            }

            const { html, generatedFiles, usedImages } = this.markdownCompiler.compile(body, attributes);

            // Generate React Component
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

        } catch (err: any) {
            console.error(`Failed to convert ${srcPath}:`, err.message);
        }

    } else if (ext === '.tsx') {
        const basename = path.basename(item);
        if (!this.generatedTsxFiles.has(basename)) {
            console.log(`Processing Custom TSX: ${srcPath}`);
            const content = fs.readFileSync(srcPath, 'utf8');
            const hash = calculatePathHash(relativePath);
            const pageOutDir = path.join(this.projectRoot, CONFIG.APP_DIR, CONFIG.OUT_DIR, hash);
            fs.mkdirSync(pageOutDir, { recursive: true });
            const destFile = path.join(pageOutDir, 'page.tsx');
            fs.writeFileSync(destFile, content);

            navContainer.push({
                title: cleanTitle(item),
                type: 'page',
                path: `/${hash}`,
                hash: hash,
                hasCustomTsx: true,
                mdPath: "",
                tsxPath: path.relative(this.projectRoot, destFile),
                codeFiles: [], images: [], children: []
            });
        }
    }
  }

  private writeSiteData(): void {
    const siteData: SiteData = {
        navigation: this.navigation,
        images: this.assetProcessor.getSiteImages()
    };
    const jsonPath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_JSON_DIR, CONFIG.SITE_DATA_JSON);
    fs.writeFileSync(jsonPath, JSON.stringify(siteData, null, 2));
    console.log(`Generated unified ${CONFIG.SITE_DATA_JSON}`);
  }
}