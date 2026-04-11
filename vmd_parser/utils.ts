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
  // Strip leading sort prefix: "_086_" or "086_"
  // e.g. "_086_深入_版本控制_86.md" → "深入_版本控制_86.md"
  let cleaned = name.replace(/^_?\d+_/, '');

  // Remove file extension (only for files, not directories)
  if (!isDirectory) {
    cleaned = cleaned.replace(/\.[^/.]+$/, '');
  }

  // Strip trailing numeric suffix: "_86" → ""
  // e.g. "深入_版本控制_86" → "深入_版本控制"
  cleaned = cleaned.replace(/_\d+$/, '');

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