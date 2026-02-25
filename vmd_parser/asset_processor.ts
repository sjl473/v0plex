import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { calculateHash } from './utils';

export class AssetProcessor {
  private projectRoot: string;
  private imageMap: Record<string, string> = {}; // originalFilename -> hashFilename
  private siteImages: { originalPath: string; hashPath: string }[] = [];
  
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public processImage(srcPath: string): string | null {
     try {
      const fileBuffer = fs.readFileSync(srcPath);
      const hash = calculateHash(fileBuffer);
      const ext = path.extname(srcPath).toLowerCase();
      const destFileName = `${hash}${ext}`;
      const vmdImagePath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_IMAGE_DIR);
      
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
    } catch (err: any) {
      console.error(`Failed to process image ${srcPath}:`, err.message);
      return null;
    }
  }

  public getHashedImageName(originalName: string): string | null {
    return this.imageMap[originalName] || null;
  }

  public getSiteImages() {
    return this.siteImages;
  }

  public getImageMap() {
      return this.imageMap;
  }

  public writeCodeFile(content: string, hash: string): void {
     const codeFilePath = path.join(this.projectRoot, CONFIG.PUBLIC_DIR, CONFIG.VMD_CODE_DIR, `${hash}.txt`);
     try {
       fs.writeFileSync(codeFilePath, content);
     } catch (err) {
       console.error(`Failed to write code block file ${codeFilePath}:`, err);
     }
  }
}