import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';

export class Cleaner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public clean(): void {
    console.log("Starting Clean Process...");
    const publicPath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR);
    const appPath = path.join(this.projectRoot, CONFIG.APP_DIR);

    this.resetDirectory(path.join(publicPath, CONFIG.VMD_CODE_DIR));
    this.resetDirectory(path.join(publicPath, CONFIG.VMD_IMAGE_DIR));
    this.resetDirectory(path.join(publicPath, CONFIG.VMD_JSON_DIR));
    this.resetDirectory(path.join(appPath, CONFIG.OUT_DIR));

    console.log("Clean Done.");
  }

  private resetDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
        // Instead of removing the directory itself (which might be a volume),
        // we remove its contents.
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            fs.rmSync(path.join(dirPath, file), { recursive: true, force: true });
        }
    } else {
        // Only create if it doesn't exist
        fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}