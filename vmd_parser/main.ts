import path from 'path';
import fs from 'fs';
import { SiteBuilder } from './builder';
import { Cleaner } from './cleaner';
import { VmdErrorCode, createVmdError, ErrorReporter, VmdErrorSeverity, VmdError } from './errors';

function printUsage(): void {
  console.log('Usage: ts-node vmd_parser/main.ts <input_path>');
  console.log('   Input path can be a file (.md) or a directory.');
  console.log('');
  console.log('Examples:');
  console.log('   ts-node vmd_parser/main.ts ./dev');
  console.log('   ts-node vmd_parser/main.ts ./dev/_01_example.md');
}

function main(): void {
  const errorReporter = new ErrorReporter();

  try {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('Error: Missing input path argument\n');
      printUsage();
      process.exit(1);
    }

    const inputPath = path.resolve(args[0]);
    const projectRoot = path.resolve(__dirname, '..');

    if (!fs.existsSync(inputPath)) {
      const err = createVmdError(
        VmdErrorCode.BUILD_INVALID_PATH,
        { path: inputPath }
      );
      console.error(`\n${err.format()}`);
      process.exit(1);
    }

    console.log('VMD Parser Starting...');
    console.log(`Project Root: ${projectRoot}`);
    console.log(`Input Path: ${inputPath}`);
    console.log('');

    console.log('Cleaning previous build...');
    try {
      const cleaner = new Cleaner(projectRoot);
      cleaner.clean();
      console.log('Clean complete\n');
    } catch (err) {
      if (err instanceof Error) {
        const vmdErr = createVmdError(
          VmdErrorCode.FILE_SYSTEM_ERROR,
          { message: `Clean failed: ${err.message}` },
          undefined,
          VmdErrorSeverity.WARNING
        );
        console.warn(`${vmdErr.format()}\n`);
      }
    }

    console.log('Building site...');
    const builder = new SiteBuilder(projectRoot);
    const success = builder.build(inputPath);

    const summary = builder.getErrorReporter().getSummary();

    console.log('');
    console.log('='.repeat(50));

    if (success && summary.errors === 0) {
      console.log('Build completed successfully');
      if (summary.warnings > 0) {
        console.log(`${summary.warnings} warning(s) occurred`);
      }
      process.exit(0);
    } else {
      console.error(`Build failed with ${summary.errors} error(s)`);
      process.exit(1);
    }

  } catch (err) {
    console.error('\nFatal Error:');
    console.error('='.repeat(50));

    if (err instanceof VmdError) {
      console.error(err.format());
    } else if (err instanceof Error) {
      const wrappedErr = createVmdError(
        VmdErrorCode.UNKNOWN_ERROR,
        { details: err.message }
      );
      console.error(wrappedErr.format());
    } else {
      const wrappedErr = createVmdError(
        VmdErrorCode.UNKNOWN_ERROR,
        { details: String(err) }
      );
      console.error(wrappedErr.format());
    }

    process.exit(1);
  }
}

main();