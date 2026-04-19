/**
 * VMD Compiler Tests
 *
 * Automatically tests all markdown files in fixtures/markdown/
 * Tests compile markdown and validate grammar WITHOUT generating output files.
 *
 * Usage:
 *   pnpm test:run                    # Run tests with terminal output
 *   VMD_TEST_LOG=1 pnpm test:run     # Run tests with log file output
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { MarkdownCompiler } from '../state_machine';
import { VmdUtil } from '../vmd_util';
import path from 'path';
import fs from 'fs';

// Get all markdown files from fixtures directory
const fixturesDir = path.join(__dirname, 'fixtures', 'markdown');
const markdownFiles = fs.readdirSync(fixturesDir).filter(file => file.endsWith('.md'));

// Store compilation results for summary
interface CompilationResult {
  file: string;
  success: boolean;
  error?: string;
  fullContent?: string;
  errorLine?: number;
  duration: number;
}

const compilationResults: CompilationResult[] = [];

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
 * Extract line number from error message
 * Supports formats: "at line X", "At line X", "line X"
 */
function extractLineNumber(errorMessage: string): number | undefined {
  // Match various line number formats
  const patterns = [
    /(?:at line|At line|line)\s+(\d+)/i,
    /:\s*(\d+)(?::\d+)?\s*$/m,  // Matches :line or :line:column at end of line
  ];
  
  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return undefined;
}

describe('VMD Compiler - All Markdown Fixtures', () => {
  let compiler: MarkdownCompiler;
  let vmdUtil: VmdUtil;

  const projectRoot = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    vmdUtil = new VmdUtil(projectRoot);
    compiler = new MarkdownCompiler(vmdUtil, projectRoot);
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
          const firstLine = r.error.split('\n')[0];
          console.log(`     Error: ${firstLine}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Write detailed log if in log mode
    if (useLogMode && logStream) {
      writeDetailedLog(successful, failed);
    }
  });

  // Dynamically create a test for each markdown file
  markdownFiles.forEach(filename => {
    it(`should compile ${filename}`, () => {
      const startTime = Date.now();
      const filePath = path.join(fixturesDir, filename);
      let fullContent: string | undefined;

      try {
        fullContent = fs.readFileSync(filePath, 'utf-8');
        const result = vmdUtil.parseFrontmatter(fullContent, filePath);
        compiler.compile(result.body, result.attributes, filePath, result.frontmatterLineCount);

        compilationResults.push({
          file: filename,
          success: true,
          duration: Date.now() - startTime
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorLine = extractLineNumber(errorMessage);

        compilationResults.push({
          file: filename,
          success: false,
          error: errorMessage,
          fullContent,
          errorLine,
          duration: Date.now() - startTime
        });

        throw err;
      }
    });
  });

  it('should have processed all markdown files', () => {
    expect(compilationResults.length).toBe(markdownFiles.length);
  });
});

/**
 * Write detailed log to file
 */
function writeDetailedLog(successful: CompilationResult[], failed: CompilationResult[]): void {
  // Header
  log('='.repeat(70));
  log('VMD COMPILATION DETAILED LOG');
  log('='.repeat(70));
  log(`Time: ${new Date().toISOString()}`);
  log(`Total Files: ${compilationResults.length}`);
  log(`Successful: ${successful.length}`);
  log(`Failed: ${failed.length}`);
  log('');

  // Successful files
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
      const filePath = path.join(fixturesDir, r.file);
      
      log('');
      log(`File: ${r.file}`);
      log(`Duration: ${r.duration}ms`);
      if (r.errorLine) {
        log(`Line: ${r.errorLine}`);
      }
      log('-'.repeat(70));

      // File path with file:// protocol for clickable links
      log(`Source: file://${filePath}`);

      // Error message
      log('');
      log('Error:');
      const errorLines = (r.error || 'Unknown error').split('\n');
      errorLines.forEach(line => {
        log(`  ${line}`);
      });

      // Show context around error
      if (r.fullContent && r.errorLine && r.errorLine > 0) {
        log('');
        log('Context:');
        log('-'.repeat(70));

        const lines = r.fullContent.split('\n');
        const startContext = Math.max(0, r.errorLine - 3);
        const endContext = Math.min(lines.length, r.errorLine + 2);

        for (let i = startContext; i < endContext; i++) {
          const isErrorLine = i === r.errorLine - 1;
          const prefix = isErrorLine ? '>>> ' : '    ';
          const lineNum = (i + 1).toString().padStart(3);
          const lineContent = lines[i] || '';
          log(`${prefix}${lineNum} | ${lineContent}`);
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
  logStream!.end(() => {
    console.log(`Detailed log saved to: ${logFile}`);
  });
}
