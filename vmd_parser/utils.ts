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

export function cleanTitle(name: string, isDirectory: boolean = false): string {
  const nameNoExt = isDirectory ? name : path.parse(name).name;
  return nameNoExt.replace(/^_\d+_/, '');
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