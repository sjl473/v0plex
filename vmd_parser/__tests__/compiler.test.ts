/**
 * VMD Compiler Tests
 *
 * Automatically tests all markdown files in fixtures/markdown/
 * Tests compile markdown and validate grammar WITHOUT generating output files.
 * Uses MockAssetProcessor to skip all file I/O operations.
 *
 * Supports two output modes:
 * 1. Terminal output (default) - shown after all tests complete
 * 2. Log file output - write to vmd_compile_log_<timestamp>.log
 *
 * Usage:
 *   pnpm test:run                    # Run tests with terminal output
 *   VMD_TEST_LOG=1 pnpm test:run     # Run tests with log file output
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { MarkdownCompiler } from '../compiler';
import { FrontMatterParser } from '../frontmatter';
import path from 'path';
import fs from 'fs';

/**
 * Mock AssetProcessor for testing
 * Does NOT write any files - only validates and returns success
 */
class MockAssetProcessor {
  private imageMap: Record<string, string> = {};
  private siteImages: { originalPath: string; hashPath: string }[] = [];

  public processImage(srcPath: string): string | null {
    // Just validate the path exists, don't write anything
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Image not found: ${srcPath}`);
    }

    // Generate mock hash
    const mockHash = 'test_' + path.basename(srcPath, path.extname(srcPath));
    const basename = path.basename(srcPath);
    this.imageMap[basename] = `${mockHash}${path.extname(srcPath)}`;

    return mockHash;
  }

  public getHashedImageName(originalName: string): string | null {
    return this.imageMap[originalName] || null;
  }

  public hasImage(originalName: string): boolean {
    return originalName in this.imageMap;
  }

  public validateImageExists(imagePath: string): void {
    const isRemoteUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://');

    if (isRemoteUrl) {
      try {
        new URL(imagePath);
      } catch {
        throw new Error(`Invalid URL format: ${imagePath}`);
      }
      return;
    }

    // Just check if it was processed
    const basename = path.basename(decodeURIComponent(imagePath));
    if (this.hasImage(basename)) {
      return;
    }

    // Don't throw error for missing images in test mode - just skip
  }

  public getSiteImages() {
    return [...this.siteImages];
  }

  public getImageMap() {
    return { ...this.imageMap };
  }

  public writeCodeFile(content: string, hash: string): void {
    // Do nothing - no file output in tests
  }

  public reset(): void {
    this.imageMap = {};
    this.siteImages = [];
  }
}

// Get all markdown files from fixtures directory
const fixturesDir = path.join(__dirname, 'fixtures', 'markdown');
const markdownFiles = fs.readdirSync(fixturesDir).filter(file => file.endsWith('.md'));

// Store compilation results for summary
const compilationResults: {
  file: string;
  success: boolean;
  error?: string;
  markdown?: string;
  fullContent?: string;  // Store full file content for accurate context display
  errorLine?: number;
  duration: number;
}[] = [];

// Check if log mode is enabled
const useLogMode = process.env.VMD_TEST_LOG === '1' || process.env.VMD_TEST_LOG === 'true';
let logFile: string | null = null;
let logStream: fs.WriteStream | null = null;

// Setup log file if needed - save to __tests__/logs folder
if (useLogMode) {
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  logFile = path.join(logsDir, `vmd_compile_log_${timestamp}.log`);
  logStream = fs.createWriteStream(logFile, { flags: 'w' });
}

function log(line: string = ''): void {
  if (useLogMode && logStream) {
    logStream.write(line + '\n');
  }
}

/**
 * Create a file URL for a given path
 */
function toFileUrl(filePath: string): string {
  return 'file://' + filePath;
}

describe('VMD Compiler - All Markdown Fixtures', () => {
  let compiler: MarkdownCompiler;
  let assetProcessor: MockAssetProcessor;

  // Use the actual fixtures directory as project root
  const projectRoot = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    // No directory creation needed - using mock processor
    assetProcessor = new MockAssetProcessor();
    compiler = new MarkdownCompiler(assetProcessor as any, projectRoot);
  });

  afterAll(() => {
    // Print unified summary to console
    console.log('\n' + '='.repeat(60));
    console.log('VMD COMPILATION SUMMARY');
    console.log('='.repeat(60));

    const successful = compilationResults.filter(r => r.success);
    const failed = compilationResults.filter(r => !r.success);

    console.log(`\n✅ SUCCESS (${successful.length}/${compilationResults.length}):`);
    successful.forEach(r => {
      console.log(`   ✓ ${r.file} (${r.duration}ms)`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ FAILED (${failed.length}/${compilationResults.length}):`);
      failed.forEach(r => {
        console.log(`   ✗ ${r.file} (${r.duration}ms)`);
        if (r.error) {
          console.log(`     Error: ${r.error.split('\n')[0]}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Write detailed log if in log mode
    if (useLogMode && logStream) {
      // Header
      log('='.repeat(70));
      log('VMD COMPILATION DETAILED LOG');
      log('='.repeat(70));
      log(`Time: ${new Date().toISOString()}`);
      log(`Total Files: ${compilationResults.length}`);
      log(`Successful: ${successful.length}`);
      log(`Failed: ${failed.length}`);
      log('');

      // Successful files - simple list
      if (successful.length > 0) {
        log('='.repeat(70));
        log('SUCCESSFUL COMPILATIONS');
        log('='.repeat(70));
        successful.forEach(r => {
          log(`  ✓ ${r.file} (${r.duration}ms)`);
        });
        log('');
      }

      // Failed files with details
      if (failed.length > 0) {
        log('');
        log('='.repeat(70));
        log('FAILED COMPILATIONS - DETAILED ERROR REPORT');
        log('='.repeat(70));

        failed.forEach(r => {
          log('');
          log(`File: ${r.file}`);
          log(`Duration: ${r.duration}ms`);
          log('-'.repeat(70));

          // Links to source files
          const mdFilePath = path.join(fixturesDir, r.file);
          log(`Markdown Source: ${toFileUrl(mdFilePath)}`);

          // Extract error line number from error message
          const lineMatch = r.error?.match(/at line (\d+)/i);
          const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : r.errorLine;

          if (errorLine && errorLine > 0) {
            log(`Error Location: Line ${errorLine}`);
          }

          log('');
          log(`Error Message:`);
          log(`  ${r.error?.replace(/\n/g, '\n  ') || 'Unknown error'}`);

          // Show markdown context around error (use fullContent for accurate line numbers)
          if (r.fullContent && errorLine && errorLine > 0) {
            log('');
            log('Markdown Context:');
            log('-'.repeat(70));

            const lines = r.fullContent.split('\n');
            const startContext = Math.max(0, errorLine - 4);
            const endContext = Math.min(lines.length, errorLine + 3);

            for (let i = startContext; i < endContext; i++) {
              const isErrorLine = i === errorLine - 1;
              const prefix = isErrorLine ? '>>> ' : '    ';
              const lineNum = (i + 1).toString().padStart(3);
              log(`${prefix}${lineNum} | ${lines[i]}`);
            }

            if (endContext < lines.length) {
              log(`    ... (${lines.length - endContext} more lines)`);
            }
          }

          log('');
          log('='.repeat(70));
        });
      }

      log('');
      log('END OF LOG');
      log('='.repeat(70));

      // Close log stream
      logStream.end(() => {
        console.log(`Detailed log saved to: ${logFile}`);
      });
    }
  });

  // Dynamically create a test for each markdown file
  markdownFiles.forEach(filename => {
    it(`should compile ${filename}`, () => {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;
      let markdown: string | undefined;
      let fullContent: string | undefined;
      let errorLine: number | undefined;

      try {
        const filePath = path.join(fixturesDir, filename);
        fullContent = fs.readFileSync(filePath, 'utf-8');

        const result = FrontMatterParser.parse(fullContent);
        markdown = result.body;

        compiler.compile(markdown, result.attributes, filePath, result.frontmatterLineCount);

        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);

        // Extract line number from error
        const lineMatch = error.match(/at line (\d+)/i);
        if (lineMatch) {
          errorLine = parseInt(lineMatch[1], 10);
        }

        throw err;
      } finally {
        compilationResults.push({
          file: filename,
          success,
          error,
          markdown,
          fullContent,
          errorLine,
          duration: Date.now() - startTime
        });
      }
    });
  });

  it('should have processed all markdown files', () => {
    expect(compilationResults.length).toBe(markdownFiles.length);
  });
});
