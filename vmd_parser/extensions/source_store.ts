/**
 * Global source store for tracking full markdown source per file
 * Used for accurate line number calculation including frontmatter
 */

// Global store for full source per file
const fullSourceStore: Map<string, string> = new Map();
// Global store for frontmatter line offset per file
const frontmatterOffsetStore: Map<string, number> = new Map();

export function setFullSource(filePath: string, source: string, frontmatterLineCount: number = 0): void {
  fullSourceStore.set(filePath, source);
  frontmatterOffsetStore.set(filePath, frontmatterLineCount);
}

export function clearFullSource(filePath: string): void {
  fullSourceStore.delete(filePath);
  frontmatterOffsetStore.delete(filePath);
}

export function getFullSource(filePath: string): string | undefined {
  return fullSourceStore.get(filePath);
}

export function getFrontmatterOffset(filePath: string): number {
  return frontmatterOffsetStore.get(filePath) || 0;
}

export function hasFullSource(filePath: string): boolean {
  return fullSourceStore.has(filePath);
}
