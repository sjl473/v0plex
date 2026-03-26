import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { calculateHash } from './utils';
import { VmdErrorCode, createVmdError, ErrorLocation, VmdError } from './errors';

export class AssetProcessor {
  private projectRoot: string;
  private imageMap: Record<string, string> = {};
  private siteImages: { originalPath: string; hashPath: string }[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public processImage(srcPath: string): string | null {
    const location: ErrorLocation = { file: srcPath };

    try {
      if (!fs.existsSync(srcPath)) {
        throw createVmdError(
          VmdErrorCode.IMAGE_NOT_FOUND,
          { imagePath: srcPath },
          location
        );
      }

      const fileBuffer = fs.readFileSync(srcPath);
      const hash = calculateHash(fileBuffer);
      const ext = path.extname(srcPath).toLowerCase();
      const destFileName = `${hash}${ext}`;
      const vmdImagePath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_IMAGE_DIR);

      if (!fs.existsSync(vmdImagePath)) {
        fs.mkdirSync(vmdImagePath, { recursive: true });
      }

      const destPath = path.join(vmdImagePath, destFileName);
      fs.writeFileSync(destPath, fileBuffer);

      const relativeSrcPath = path.relative(this.projectRoot, srcPath);
      const relativeHashPath = path.join(CONFIG.VMD_IMAGE_DIR, destFileName);

      if (!this.siteImages.some(img => img.hashPath === relativeHashPath)) {
        this.siteImages.push({
          originalPath: relativeSrcPath,
          hashPath: relativeHashPath
        });
      }

      this.imageMap[path.basename(srcPath)] = destFileName;
      return hash;
    } catch (err) {
      if (err instanceof VmdError) {
        throw err;
      }
      throw createVmdError(
        VmdErrorCode.IMAGE_PROCESS_FAILED,
        { imagePath: srcPath, details: err instanceof Error ? err.message : String(err) },
        location,
        undefined,
        err instanceof Error ? err : undefined
      );
    }
  }

  public getHashedImageName(originalName: string): string | null {
    return this.imageMap[originalName] || null;
  }

  public hasImage(originalName: string): boolean {
    return originalName in this.imageMap;
  }

  public validateImageExists(imagePath: string, location?: ErrorLocation): void {
    const isRemoteUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://');
    
    if (isRemoteUrl) {
      // For remote URLs, we cannot validate at build time easily
      // but we can at least check it's a valid URL format
      try {
        new URL(imagePath);
      } catch {
        throw createVmdError(
          VmdErrorCode.IMAGE_NOT_FOUND,
          { imageName: imagePath, reason: 'Invalid URL format' },
          location
        );
      }
      return;
    }

    // Check if image was already processed and exists in imageMap
    // The basename might be URL-encoded in the reference
    const basename = path.basename(decodeURIComponent(imagePath));
    if (this.hasImage(basename)) {
      return;
    }

    // Decode URL-encoded path (e.g., %20 -> space)
    const decodedPath = decodeURIComponent(imagePath);

    // Build list of possible paths to check
    const possiblePaths: string[] = [
      path.join(this.projectRoot, 'public', decodedPath),
      path.join(this.projectRoot, 'dev', 'assets', 'images', path.basename(decodedPath)),
      path.join(this.projectRoot, decodedPath),
    ];

    // If location has a file, also check relative to that file's directory
    if (location?.file) {
      // Handle both absolute and relative file paths
      const filePath = path.isAbsolute(location.file)
        ? location.file
        : path.join(this.projectRoot, location.file);
      const fileDir = path.dirname(filePath);
      possiblePaths.push(path.normalize(path.join(fileDir, decodedPath)));
    }

    const exists = possiblePaths.some(p => fs.existsSync(p));
    
    if (!exists) {
      throw createVmdError(
        VmdErrorCode.IMAGE_NOT_FOUND,
        { imageName: imagePath, searchedPaths: possiblePaths },
        location
      );
    }
  }

  public getSiteImages() {
    return [...this.siteImages];
  }

  public getImageMap() {
    return { ...this.imageMap };
  }

  public writeCodeFile(content: string, hash: string): void {
    const codeDir = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_CODE_DIR);
    const codeFilePath = path.join(codeDir, `${hash}.txt`);
    const location: ErrorLocation = { file: codeFilePath };

    try {
      if (!fs.existsSync(codeDir)) {
        fs.mkdirSync(codeDir, { recursive: true });
      }

      fs.writeFileSync(codeFilePath, content);
    } catch (err) {
      throw createVmdError(
        VmdErrorCode.CODE_FILE_WRITE_ERROR,
        { filePath: codeFilePath, details: err instanceof Error ? err.message : String(err) },
        location,
        undefined,
        err instanceof Error ? err : undefined
      );
    }
  }

  public reset(): void {
    this.imageMap = {};
    this.siteImages = [];
  }
}