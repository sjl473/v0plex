/**
 * VMD Compiler Tests
 * Automatically tests all markdown files in fixtures/markdown/
 * Shows unified output of which files compiled successfully and which failed
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { MarkdownCompiler } from '../compiler';
import { AssetProcessor } from '../asset_processor';
import { FrontMatterParser } from '../frontmatter';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Get all markdown files from fixtures directory
const fixturesDir = path.join(__dirname, 'fixtures', 'markdown');
const markdownFiles = fs.readdirSync(fixturesDir).filter(file => file.endsWith('.md'));

// Store compilation results for summary
const compilationResults: { file: string; success: boolean; error?: string }[] = [];

describe('VMD Compiler - All Markdown Fixtures', () => {
  let compiler: MarkdownCompiler;
  let assetProcessor: AssetProcessor;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmd-test-'));

    // Create necessary directories
    const publicDir = path.join(tempDir, 'public');
    const imageDir = path.join(publicDir, 'vmdimage');
    const codeDir = path.join(publicDir, 'vmdcode');

    fs.mkdirSync(publicDir, { recursive: true });
    fs.mkdirSync(imageDir, { recursive: true });
    fs.mkdirSync(codeDir, { recursive: true });

    assetProcessor = new AssetProcessor(tempDir);
    compiler = new MarkdownCompiler(assetProcessor, tempDir);
  });

  afterAll(() => {
    // Print unified summary
    console.log('\n' + '='.repeat(60));
    console.log('VMD COMPILATION SUMMARY');
    console.log('='.repeat(60));

    const successful = compilationResults.filter(r => r.success);
    const failed = compilationResults.filter(r => !r.success);

    console.log(`\n✅ SUCCESS (${successful.length}/${compilationResults.length}):`);
    successful.forEach(r => {
      console.log(`   ✓ ${r.file}`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ FAILED (${failed.length}/${compilationResults.length}):`);
      failed.forEach(r => {
        console.log(`   ✗ ${r.file}`);
        if (r.error) {
          console.log(`     Error: ${r.error}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  });

  // Dynamically create a test for each markdown file
  markdownFiles.forEach(filename => {
    it(`should compile ${filename}`, () => {
      let success = false;
      let error: string | undefined;

      try {
        // Read the markdown file
        const filePath = path.join(fixturesDir, filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse frontmatter and markdown
        const result = FrontMatterParser.parse(content);
        const frontMatter = result.attributes;
        const markdown = result.body;
        const frontmatterLineCount = result.frontmatterLineCount;

        // Compile the markdown
        const compiled = compiler.compile(
          markdown,
          frontMatter,
          filePath,
          frontmatterLineCount
        );

        // Basic validation - check that HTML was generated
        expect(compiled.html).toBeTruthy();
        expect(compiled.html.length).toBeGreaterThan(0);

        // Check that the HTML contains VMD tags (not raw markdown)
        expect(compiled.html).toMatch(/<[A-Z][a-z]*vmd/);

        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        throw err; // Re-throw to fail the test
      } finally {
        // Record the result
        compilationResults.push({ file: filename, success, error });
      }
    });
  });

  // Summary test to ensure all files were processed
  it('should have processed all markdown files', () => {
    expect(compilationResults.length).toBe(markdownFiles.length);
  });
});
