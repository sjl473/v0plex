/**
 * Markdown Compiler
 * Main compiler class for VMD markdown processing
 */

import { marked } from 'marked';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AssetProcessor } from '../asset_processor';
import { CONFIG } from '../config';
import { escapeHtml, capitalize } from '../utils';
import { ProcessedMarkdown, ImageReference, FrontMatterAttributes } from '../types';
import {
  createPostBlock,
  createCustomBlock,
  smallImageExtension,
  boldItalicExtension,
  blockMathExtension,
  inlineMathExtension,
  setCompilationContext,
  clearCompilationContext,
  clearLineTracker,
  scanVmdBlocks,
  resetBlockIndices
} from '../extensions';
import { VmdErrorCode, createVmdError, ErrorLocation, VmdError } from '../errors';
import { createRenderer } from './renderer';
import { addVmdSuffix, fixLinkedImages, unwrapInvalidNesting, injectMetaComponent } from './transformers';
import { detectNestedCodeBlocks, detectSingleBacktickCodeBlocks, detectInvalidTagNesting, detectEmptyMarkup } from './validators';

export class MarkdownCompiler {
  private assetProcessor: AssetProcessor;
  private projectRoot: string;
  private generatedFiles: string[] = [];
  private usedImages: ImageReference[] = [];
  private currentFile: string = '';
  private currentMarkdownBody: string = '';
  private frontmatterLineOffset: number = 0;

  constructor(assetProcessor: AssetProcessor, projectRoot: string) {
    this.assetProcessor = assetProcessor;
    this.projectRoot = projectRoot;
  }

  private getLineNumberByContent(content: string): number {
    if (!this.currentMarkdownBody) return 1 + this.frontmatterLineOffset;
    const index = this.currentMarkdownBody.indexOf(content);
    if (index === -1) return 1 + this.frontmatterLineOffset;
    const textBefore = this.currentMarkdownBody.substring(0, index);
    return (textBefore.match(/\n/g) || []).length + 1 + this.frontmatterLineOffset;
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
    // Calculate frontmatter line offset: frontmatter lines + 1 (for the closing --- line)
    // The body starts after the frontmatter block
    this.frontmatterLineOffset = frontmatterLineCount || 0;
    this.resetState();

    const location: ErrorLocation = filePath ? { file: filePath } : {};

    try {
      // Pre-validation: check for nested code blocks
      this.detectNestedCodeBlocks(markdownBody);

      // Pre-validation: check for single backtick code blocks (only inside other blocks)
      this.detectSingleBacktickCodeBlocks(markdownBody);

      // Pre-validation: check for invalid tag nesting in custom blocks
      this.detectInvalidTagNesting(markdownBody);

      // Store compilation context for extensions to calculate line numbers
      // Pass the markdown source and frontmatter offset for accurate line number calculation
      if (filePath) {
        setCompilationContext(filePath, markdownBody, this.frontmatterLineOffset);
      }

      // Initialize line tracker and pre-scan all VMD blocks for accurate line numbers
      clearLineTracker(filePath || '');
      resetBlockIndices();
      scanVmdBlocks(markdownBody, this.frontmatterLineOffset);


      this.configureMarked();

      const rawHtml = marked.parse(markdownBody) as string;
      let vmdHtml = this.transformHtml(rawHtml);

      // Post-validation: check for empty markup elements
      this.detectEmptyMarkup(vmdHtml);

      vmdHtml = this.injectMetaComponent(vmdHtml, attributes);

      // Clean up full source storage
      if (filePath) {
        clearCompilationContext(filePath);
      }

      return {
        html: vmdHtml,
        generatedFiles: [...this.generatedFiles],
        usedImages: [...this.usedImages]
      };
    } catch (err) {
      // Clean up full source storage on error too
      if (filePath) {
        clearCompilationContext(filePath);
      }

      if (err instanceof VmdError) {
        throw err;
      }

      let errorMessage = err instanceof Error ? err.message : String(err);

      throw createVmdError(
        VmdErrorCode.MARKDOWN_COMPILE_ERROR,
        { details: errorMessage },
        location,
        undefined,
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

  private configureMarked() {
    const self = this;

    const renderer = createRenderer(this.assetProcessor, this.usedImages, this.generatedFiles, this.currentFile);

    marked.use({
      renderer,
      extensions: [
        createCustomBlock('info'),
        createCustomBlock('warning'),
        createCustomBlock('success'),
        createPostBlock(this.assetProcessor, CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
        smallImageExtension(this.assetProcessor, CONFIG.IMAGE_WEB_PREFIX, this.currentFile),
        boldItalicExtension,
        blockMathExtension,
        inlineMathExtension
      ]
    });
  }

  private transformHtml(html: string): string {
    let vmdHtml = addVmdSuffix(html, this.assetProcessor, this.usedImages);
    vmdHtml = fixLinkedImages(vmdHtml);
    vmdHtml = unwrapInvalidNesting(vmdHtml);
    return vmdHtml;
  }

  private injectMetaComponent(html: string, attributes: FrontMatterAttributes): string {
    return injectMetaComponent(html, attributes);
  }

  private detectNestedCodeBlocks(body: string): void {
    detectNestedCodeBlocks(
      body,
      (line) => this.getActualLineNumber(line),
      () => this.getLocation()
    );
  }

  private detectSingleBacktickCodeBlocks(body: string): void {
    detectSingleBacktickCodeBlocks(
      body,
      (line) => this.getActualLineNumber(line),
      () => this.getLocation()
    );
  }

  private detectInvalidTagNesting(body: string): void {
    detectInvalidTagNesting(
      body,
      (line) => this.getActualLineNumber(line),
      () => this.getLocation()
    );
  }

  private detectEmptyMarkup(html: string): void {
    detectEmptyMarkup(html);
  }
}
