import crypto from 'crypto';
import path from 'path';

export function calculateHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function calculatePathHash(relativePath: string): string {
  return crypto.createHash('shake256', { outputLength: 4 })
    .update(relativePath)
    .digest('hex');
}

/**
 * Clean a file or directory name for display as a title
 * Removes numeric prefixes, file extensions (for files), and formats with spaces and capitalization
 */
export function cleanTitle(name: string, isDirectory: boolean = false): string {
  // Remove numeric prefix (e.g., "01_" or "_01_")
  let cleaned = name.replace(/^_?(\d+)_/, '');

  // Remove file extension (only for files, not directories)
  if (!isDirectory) {
    cleaned = cleaned.replace(/\.[^/.]+$/, '');
  }

  // Replace underscores and hyphens with spaces
  cleaned = cleaned.replace(/[_-]/g, ' ');

  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, char => char.toUpperCase());

  return cleaned;
}

export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}