import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { VmdErrorCode, createVmdError, VmdError, VmdErrorSeverity } from './errors';

export class Cleaner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public clean(): void {
    console.log("Starting Clean Process...");

    try {
      const publicPath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR);
      const appPath = path.join(this.projectRoot, CONFIG.APP_DIR);

      this.resetDirectory(path.join(publicPath, CONFIG.VMD_CODE_DIR));
      this.resetDirectory(path.join(publicPath, CONFIG.VMD_IMAGE_DIR));
      this.resetDirectory(path.join(publicPath, CONFIG.VMD_JSON_DIR));
      this.resetDirectory(path.join(appPath, CONFIG.OUT_DIR));

      console.log("Clean Done.");
    } catch (err) {
      if (err instanceof VmdError) {
        throw err;
      }
      throw createVmdError(
        VmdErrorCode.FILE_SYSTEM_ERROR,
        { message: `Clean failed: ${err instanceof Error ? err.message : String(err)}` },
        undefined,
        VmdErrorSeverity.ERROR,
        err instanceof Error ? err : undefined
      );
    }
  }

  private resetDirectory(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            fs.rmSync(filePath, { recursive: true, force: true });
          } catch (err) {
            throw createVmdError(
              VmdErrorCode.FILE_SYSTEM_ERROR,
              { message: `Cannot delete file ${filePath}: ${err instanceof Error ? err.message : String(err)}` },
              { file: filePath }
            );
          }
        }
      } else {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
          throw createVmdError(
            VmdErrorCode.FILE_SYSTEM_ERROR,
            { message: `Cannot create directory ${dirPath}: ${err instanceof Error ? err.message : String(err)}` },
            { file: dirPath }
          );
        }
      }
    } catch (err) {
      if (err instanceof VmdError) {
        throw err;
      }
      throw createVmdError(
        VmdErrorCode.FILE_SYSTEM_ERROR,
        { message: `Reset directory failed ${dirPath}: ${err instanceof Error ? err.message : String(err)}` },
        { file: dirPath },
        undefined,
        err instanceof Error ? err : undefined
      );
    }
  }

  public safeCleanFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
      return true;
    } catch (err) {
      console.warn(`Cannot delete file ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public isEmpty(dirPath: string): boolean {
    try {
      if (!fs.existsSync(dirPath)) {
        return true;
      }
      const files = fs.readdirSync(dirPath);
      return files.length === 0;
    } catch (err) {
      return false;
    }
  }
}