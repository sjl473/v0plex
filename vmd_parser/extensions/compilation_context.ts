/**
 * Compilation Context Storage
 *
 * Stores per-file compilation context data that needs to be shared between
 * the compiler and extensions during a single compilation run.
 *
 * This is necessary because marked extensions run in an isolated context
 * and don't have direct access to the compiler state. The data is stored
 * temporarily during compilation and cleaned up afterwards.
 *
 * Stored data:
 * - Full markdown source (for position-based validations)
 * - Frontmatter line offset (for accurate error line numbers)
 */

// Compilation context per file
const fileSourceContext: Map<string, string> = new Map();
const fileFrontmatterLineCount: Map<string, number> = new Map();

/**
 * Store compilation context for a file
 * Called at the start of compilation
 */
export function setCompilationContext(
  filePath: string,
  markdownSource: string,
  frontmatterLineCount: number = 0
): void {
  fileSourceContext.set(filePath, markdownSource);
  fileFrontmatterLineCount.set(filePath, frontmatterLineCount);
}

/**
 * Clear compilation context for a file
 * Called after compilation finishes
 */
export function clearCompilationContext(filePath: string): void {
  fileSourceContext.delete(filePath);
  fileFrontmatterLineCount.delete(filePath);
}

/**
 * Get the full markdown source for a file
 * Used by extensions for position-based validations
 */
export function getMarkdownSource(filePath: string): string | undefined {
  return fileSourceContext.get(filePath);
}

/**
 * Get the frontmatter line count for a file
 * Used for calculating accurate error line numbers
 */
export function getFrontmatterLineCount(filePath: string): number {
  return fileFrontmatterLineCount.get(filePath) || 0;
}

/**
 * Check if compilation context exists for a file
 */
export function hasCompilationContext(filePath: string): boolean {
  return fileSourceContext.has(filePath);
}
