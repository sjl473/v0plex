#!/usr/bin/env tsx
/**
 * VMD Generator Entry Point
 * Generates pages from markdown files
 */

import path from 'path';
import { VmdUtil } from './vmd_util';

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] || 'dev';
  const projectRoot = path.resolve(__dirname, '..');

  // Create VmdUtil instance and run
  const util = new VmdUtil(projectRoot);
  const success = util.run(inputPath);

  if (!success) {
    process.exit(1);
  }
}

main();
