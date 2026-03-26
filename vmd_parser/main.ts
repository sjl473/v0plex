#!/usr/bin/env tsx
/**
 * VMD Generator Entry Point
 * Generates pages from markdown files
 */

import path from 'path';
import { SiteBuilder } from './builder';
import { DirectoryCleaner } from './directory_cleaner';

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] || 'dev';
  const projectRoot = path.resolve(__dirname, '..');
  const fullInputPath = path.resolve(inputPath);

  // Clean previous build
  const cleaner = new DirectoryCleaner(projectRoot);
  cleaner.clean();

  // Build site
  const builder = new SiteBuilder(projectRoot);
  const success = builder.build(fullInputPath);

  if (success) {
    console.log('✅ Build completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Build failed');
    process.exit(1);
  }
}

main();
