import crypto from 'crypto';
import path from 'path';
import { execSync } from 'child_process';

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

/**
 * Get git commit date for a file
 * @param filePath - Path to the file
 * @param type - 'earliest' for first commit, 'latest' for last commit
 * @returns ISO 8601 date string (YYYY-MM-DD) or null if not found
 */
export function getGitCommitDate(filePath: string, type: 'earliest' | 'latest'): string | null {
  try {
    const format = '%Y-%m-%d';
    let command: string;
    
    if (type === 'earliest') {
      // Get the first commit date (oldest)
      command = `git log --follow --format=%cd --date=format:${format} -- "${filePath}" | tail -1`;
    } else {
      // Get the last commit date (most recent)
      command = `git log -1 --format=%cd --date=format:${format} -- "${filePath}"`;
    }
    
    const result = execSync(command, { encoding: 'utf8', cwd: process.cwd() }).trim();
    
    if (!result) {
      return null;
    }
    
    // Validate the date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(result)) {
      return result;
    }
    
    return null;
  } catch (error) {
    // Git command failed or file not tracked
    return null;
  }
}

/**
 * Resolve date value, supporting @git placeholder
 * @param value - Date value (YYYY-MM-DD or @git)
 * @param filePath - Path to the markdown file
 * @param type - 'earliest' for created_at, 'latest' for last_updated_at
 * @returns Resolved date string (YYYY-MM-DD)
 */
export function resolveDate(value: string, filePath: string, type: 'earliest' | 'latest'): string {
  if (value === '@git') {
    const gitDate = getGitCommitDate(filePath, type);
    if (gitDate) {
      return gitDate;
    }
    // Fallback to current date if git date not available
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  return value;
}

/**
 * Check if git environment is available
 * @returns boolean indicating if git is available
 */
export function isGitAvailable(): boolean {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate git environment, throws error if git is not available
 * Call this at project start when @git is used
 */
export function validateGitEnvironment(): void {
  if (!isGitAvailable()) {
    throw new Error(
      'Git environment is not available. ' +
      'Git is required when using @git placeholder in frontmatter. ' +
      'Please install git or use explicit dates (YYYY-MM-DD format).'
    );
  }
}

export interface GitUserInfo {
  name: string;
  email: string;
}

/**
 * Get git user information (name and email)
 * @returns GitUserInfo or null if not available
 */
export function getGitUserInfo(): GitUserInfo | null {
  try {
    const name = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
    
    if (name && email) {
      return { name, email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve author string, supporting @git placeholder
 * When author is @git, uses git user.name and git user.email
 * Can be mixed with other authors using | separator
 * @param value - Author value (can be @git, mixed with other authors, or standard author format)
 * @returns Resolved author string with @git replaced by git user info
 */
export function resolveAuthor(value: string): string {
  // If entire value is @git, replace with git user info
  if (value === '@git') {
    const gitUser = getGitUserInfo();
    if (gitUser) {
      return `${gitUser.name}->${gitUser.email}`;
    }
    // Fallback to a default if git user info not available
    return 'Unknown Author';
  }
  
  // Handle mixed authors with @git placeholder
  if (value.includes('@git')) {
    const gitUser = getGitUserInfo();
    const gitAuthorString = gitUser
      ? `${gitUser.name}->${gitUser.email}`
      : 'Unknown Author';
    
    // Replace @git with the git user info, preserve other authors
    return value.split('|')
      .map(a => a.trim())
      .map(a => a === '@git' ? gitAuthorString : a)
      .join('|');
  }
  
  return value;
}