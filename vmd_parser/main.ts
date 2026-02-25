import path from 'path';
import fs from 'fs';
import { SiteBuilder } from './site_builder';
import { Cleaner } from './cleaner';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: ts-node vmd_parser/main.ts <input_path>");
  console.log("Input path can be a file (.md) or a directory.");
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
// Assuming vmd_parser is in the project root
const projectRoot = path.resolve(__dirname, '..'); 

if (!fs.existsSync(inputPath)) {
    console.error(`Error: Path not found: ${inputPath}`);
    process.exit(1);
}

// 1. Clean previous build
const cleaner = new Cleaner(projectRoot);
cleaner.clean();

// 2. Build Site
const builder = new SiteBuilder(projectRoot);
builder.build(inputPath);