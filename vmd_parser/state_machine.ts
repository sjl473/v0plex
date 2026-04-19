/**
 * VMD Compiler State Machine
 * Main compiler class and compilation orchestration
 */

import { marked } from 'marked';
import crypto from 'crypto';
import { VmdUtil, VmdErrorCode, createVmdError, ErrorLocation, VmdError } from './vmd_util';
import { ProcessedMarkdown, ImageReference, FrontMatterAttributes } from './types';
import { BUILD_CONFIG } from '../config/site.config';
import {
  setCompilationContext,
  clearCompilationContext,
  clearLineTracker,
  scanVmdBlocks,
  resetBlockIndices,
  setTableExtensionContext,
  clearTableExtensionContext,
  tableExtension,
  blockMathExtension,
  inlineMathExtension,
  strikethroughExtension,
  createCustomBlock,
  createPostBlock,
  smallImageExtension,
  boldItalicExtension
} from './extensions';
import { createRenderer, transformHtml } from './convert_to_vmd.ts';
import {
  detectNestedCodeBlocks,
  detectSingleBacktickCodeBlocks,
  detectInvalidTagNesting,
  detectEmptyMarkup
} from './syntax_validator.ts';

export class MarkdownCompiler {
  private util: VmdUtil;
  private projectRoot: string;
  private generatedFiles: string[] = [];
  private usedImages: ImageReference[] = [];
  private currentFile: string = '';
  private currentMarkdownBody: string = '';
  private frontmatterLineOffset: number = 0;

  constructor(util: VmdUtil, projectRoot: string) {
    this.util = util;
    this.projectRoot = projectRoot;
  }

  /**
   * Get the actual line number in the full markdown file (including frontmatter)
   */
  private getActualLineNumber(bodyLineNumber: number): number {
    return bodyLineNumber + this.frontmatterLineOffset;
  }

  public compile(markdownBody: string, attributes: FrontMatterAttributes, filePath?: string, frontmatterLineCount?: number): ProcessedMarkdown {
    this.currentFile = filePath || '';
    this.currentMarkdownBody = markdownBody;
    this.frontmatterLineOffset = frontmatterLineCount || 0;
    this.resetState();

    const location: ErrorLocation = filePath ? { file: filePath } : {};

    try {
      // Pre-validation: check for nested code blocks
      this.runValidation(detectNestedCodeBlocks, markdownBody);

      // Pre-validation: check for single backtick code blocks
      this.runValidation(detectSingleBacktickCodeBlocks, markdownBody);

      // Pre-validation: check for invalid tag nesting in custom blocks
      this.runValidation(detectInvalidTagNesting, markdownBody);

      // Store compilation context for extensions to calculate line numbers
      if (filePath) {
        setCompilationContext(filePath, markdownBody, this.frontmatterLineOffset);
      }

      // Initialize line tracker and pre-scan all VMD blocks for accurate line numbers
      clearLineTracker(filePath || '');
      resetBlockIndices();
      scanVmdBlocks(markdownBody, this.frontmatterLineOffset);

      // Set up table extension context for inline code processing
      setTableExtensionContext(this.util, this.generatedFiles);

      this.configureMarked();

      const rawHtml = marked.parse(markdownBody) as string;
      let vmdHtml = transformHtml(rawHtml, this.util, this.usedImages);

      // Post-validation: check for empty markup elements
      detectEmptyMarkup(vmdHtml);

      // Clean up contexts
      if (filePath) {
        clearCompilationContext(filePath);
      }
      clearTableExtensionContext();

      return {
        html: vmdHtml,
        generatedFiles: [...this.generatedFiles],
        usedImages: [...this.usedImages]
      };
    } catch (err) {
      // Clean up contexts on error too
      if (filePath) {
        clearCompilationContext(filePath);
      }
      clearTableExtensionContext();

      if (err instanceof VmdError) {
        throw err;
      }

      let errorMessage = err instanceof Error ? err.message : String(err);

      throw createVmdError(
        VmdErrorCode.MARKDOWN_COMPILE_ERROR,
        { details: errorMessage },
        location,
        err instanceof Error ? err : undefined
      );
    }
  }

  private resetState() {
    this.generatedFiles = [];
    this.usedImages = [];
  }

  private getLocation(): ErrorLocation {
    return this.currentFile ? { file: this.currentFile } : {};
  }

  private runValidation(
    validator: (
      body: string,
      getActualLineNumber: (line: number) => number,
      getLocation: () => ErrorLocation
    ) => void,
    body: string
  ): void {
    validator(
      body,
      (line) => this.getActualLineNumber(line),
      () => this.getLocation()
    );
  }

  private configureMarked() {
    const renderer = createRenderer(this.util, this.usedImages, this.generatedFiles, this.currentFile);

    marked.use({
      renderer,
      gfm: false
    });

    // Register custom block extensions (info, warning, success)
    marked.use({
      extensions: [
        createCustomBlock('info'),
        createCustomBlock('warning'),
        createCustomBlock('success'),
        createPostBlock(this.util, BUILD_CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
        smallImageExtension(this.util, BUILD_CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
        boldItalicExtension
      ]
    });

    // Register math extensions
    marked.use({
      extensions: [blockMathExtension, inlineMathExtension, strikethroughExtension]
    });

    // Register table extension with renderer
    marked.use({
      extensions: [{
        name: 'vmd_table',
        level: 'block' as const,
        start(src: string) {
          const pattern = /\n<table>\n\n/;
          const match = src.match(pattern);
          if (match && match.index !== undefined) {
            return match.index;
          }
          return -1;
        },
        tokenizer(this: any, src: string, tokens: any[]) {
          const tablePattern = /^<table>\n\n([\s\S]*?)\n\n<\/table>/;
          const match = src.match(tablePattern);
          if (!match) return undefined;

          const tableContent = match[1];
          const lines = tableContent.split('\n').filter(line => line.trim().length > 0);
          if (lines.length < 2) return undefined;

          const parseTableRow = (row: string): string[] => {
            return row.split('|').slice(1, -1).map(cell => cell.trim());
          };

          const isSeparatorRow = (row: string): boolean => {
            return /^\s*\|?(\s*:?-+:?\s*\|)*\s*:?-+:?\s*\|?\s*$/.test(row);
          };

          const headers = parseTableRow(lines[0]);
          if (!isSeparatorRow(lines[1])) return undefined;

          const alignments = parseTableRow(lines[1]).map(cell => {
            const trimmed = cell.trim();
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
            if (trimmed.endsWith(':')) return 'right';
            if (trimmed.startsWith(':')) return 'left';
            return null;
          });

          const rows: string[][] = [];
          for (let i = 2; i < lines.length; i++) {
            const rowCells = parseTableRow(lines[i]);
            while (rowCells.length < headers.length) rowCells.push('');
            rows.push(rowCells.slice(0, headers.length));
          }

          return {
            type: 'vmd_table',
            raw: match[0],
            text: tableContent,
            headers,
            alignments,
            rows,
            line: 0
          };
        },
        renderer: (token: any) => {
          const { headers, alignments, rows } = token;
          const util = this.util;
          const generatedFiles = this.generatedFiles;

          const processInlineCode = (code: string): string => {
            try {
              const hash = crypto.createHash('sha256').update(code).digest('hex');
              util.writeCodeFile(code, hash);
              generatedFiles.push(`${hash}.txt`);
              return `<Inlinecodevmd filePath="${hash}"></Inlinecodevmd>`;
            } catch (err) {
              return `<code>${code}</code>`;
            }
          };

          const parseInline = (text: string): string => {
            let result = text
              .replace(/\*\*\*(.+?)\*\*\*/g, '<bold><italic>$1</italic></bold>')
              .replace(/\*\*(.+?)\*\*/g, '<bold>$1</bold>')
              .replace(/\*(.+?)\*/g, '<italic>$1</italic>')
              .replace(/~~(.+?)~~/g, '<strike>$1</strike>')
              .replace(/`([^`]+)`/g, (match: string, code: string) => processInlineCode(code))
              .replace(/\$([^$]+)\$/g, '<Inlinemathvmd formula="$1"></Inlinemathvmd>');
            return result;
          };

          let headerHtml = '<Tableheadvmd><Tablerowvmd>';
          for (let i = 0; i < headers.length; i++) {
            const align = alignments[i] ? ` align="${alignments[i]}"` : '';
            const headerContent = parseInline(headers[i]);
            headerHtml += `<Tablecellvmd header="true"${align}>${headerContent}</Tablecellvmd>`;
          }
          headerHtml += '</Tablerowvmd></Tableheadvmd>';

          let bodyHtml = '<Tablebodyvmd>';
          for (const row of rows) {
            bodyHtml += '<Tablerowvmd>';
            for (let i = 0; i < row.length; i++) {
              const align = alignments[i] ? ` align="${alignments[i]}"` : '';
              const cellContent = parseInline(row[i]);
              bodyHtml += `<Tablecellvmd${align}>${cellContent}</Tablecellvmd>`;
            }
            bodyHtml += '</Tablerowvmd>';
          }
          bodyHtml += '</Tablebodyvmd>';

          return `<Tablevmd>\n${headerHtml}\n${bodyHtml}\n</Tablevmd>\n`;
        }
      }]
    } as any);
  }
}
