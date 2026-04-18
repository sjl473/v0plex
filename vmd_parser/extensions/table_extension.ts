/**
 * Table extension for VMD
 * Handles <table> wrapped markdown table syntax
 *
 * Syntax:
 * <table>
 *
 * | Header1 | Header2 |
 * |---------|---------|
 * | Cell1   | Cell2   |
 *
 * </table>
 *
 * Requirements:
 * - <table> must be preceded by at least 1 newline
 * - <table> must be followed by at least 2 newlines
 * - </table> must be preceded by at least 2 newlines
 * - </table> must be followed by at least 1 newline
 */

import crypto from 'crypto';
import { VmdErrorCode, createVmdError, ErrorLocation } from '../errors';
import { getFileLocation } from './validation_helpers';
import { getMarkdownSource } from './compilation_context';
import { getLineAtPosition } from './validation_helpers';
import { AssetProcessor } from '../asset_processor';
import { CONFIG } from '../config';

// Module-level storage for asset processor (set by compiler)
let assetProcessorInstance: AssetProcessor | null = null;
let generatedFilesInstance: string[] = [];

export function setTableExtensionContext(assetProcessor: AssetProcessor, generatedFiles: string[]) {
  assetProcessorInstance = assetProcessor;
  generatedFilesInstance = generatedFiles;
}

export function clearTableExtensionContext() {
  assetProcessorInstance = null;
  generatedFilesInstance = [];
}

/**
 * Check if table cell content contains disallowed block-level elements
 */
function validateTableCellContent(content: string, baseLine: number, location: ErrorLocation): null | { code: VmdErrorCode; details: Record<string, any> } {
  const trimmedContent = content.trim();

  // Check for code blocks (```)
  if (/```[\s\S]*?```/.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_CODE_BLOCK,
      details: { line: baseLine }
    };
  }

  // Check for block math ($$...$$)
  if (/\$\$[\s\S]*?\$\$/.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_BLOCK_MATH,
      details: { line: baseLine }
    };
  }

  // Check for blockquote (> ...)
  if (/^\s*>\s/m.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_BLOCKQUOTE,
      details: { line: baseLine }
    };
  }

  // Check for images (![...](...))
  if (/!\[.*?\]\(.*?\)/.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_IMAGE,
      details: { line: baseLine }
    };
  }

  // Check for unordered lists (- item or * item)
  if (/^[\s]*[-*+]\s/m.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_LIST,
      details: { line: baseLine }
    };
  }

  // Check for ordered lists (1. item)
  if (/^[\s]*\d+\.\s/m.test(trimmedContent)) {
    return {
      code: VmdErrorCode.TABLE_DISALLOWED_LIST,
      details: { line: baseLine }
    };
  }

  // Check for other block-level HTML tags (except table which is handled separately)
  const blockTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'ul', 'ol', 'blockquote'];
  for (const tag of blockTags) {
    const regex = new RegExp(`<${tag}\\b`, 'i');
    if (regex.test(trimmedContent)) {
      return {
        code: VmdErrorCode.TABLE_DISALLOWED_BLOCK_ELEMENT,
        details: { tag, line: baseLine }
      };
    }
  }

  return null;
}

/**
 * Parse a table row and extract cell contents
 */
function parseTableRow(row: string): string[] {
  // Remove leading and trailing pipes
  const trimmed = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  // Split by pipe
  return trimmed.split('|').map(cell => cell.trim());
}

/**
 * Check if a line is a separator row (|---|---|)
 */
function isSeparatorRow(row: string): boolean {
  const trimmed = row.trim();
  // Must start and end with optional pipe, contain only pipes, dashes, colons and whitespace
  if (!/^\|?[\s|:|-]+\|?$/.test(trimmed)) {
    return false;
  }
  // Must have at least one pipe separator
  if (!trimmed.includes('|')) {
    return false;
  }
  // Split by pipe and check each part
  const parts = trimmed.split('|').map(p => p.trim()).filter(p => p.length > 0);
  // Each part should only contain dashes, colons and whitespace
  return parts.every(part => /^[\s:-]+$/.test(part));
}

/**
 * Extract table content from match
 * Returns header row, alignment info, and data rows
 */
function extractTableContent(tableLines: string[]): {
  headers: string[];
  alignments: ('left' | 'center' | 'right' | null)[];
  rows: string[][];
} | null {
  if (tableLines.length < 2) {
    return null;
  }

  // First line is header
  const headers = parseTableRow(tableLines[0]);

  // Second line should be separator
  if (!isSeparatorRow(tableLines[1])) {
    return null;
  }

  // Parse alignments from separator row
  const alignments = parseTableRow(tableLines[1]).map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
      return 'center';
    } else if (trimmed.endsWith(':')) {
      return 'right';
    } else if (trimmed.startsWith(':')) {
      return 'left';
    }
    return null;
  });

  // Remaining lines are data rows
  const rows: string[][] = [];
  for (let i = 2; i < tableLines.length; i++) {
    const rowCells = parseTableRow(tableLines[i]);
    // Pad row to match header length
    while (rowCells.length < headers.length) {
      rowCells.push('');
    }
    rows.push(rowCells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

/**
 * Table extension for marked
 * Matches <table>\n\n...table content...\n\n</table>
 */
export const tableExtension = {
  name: 'vmd_table',
  level: 'block' as const,
  
  start(src: string) {
    // Pattern: newline + <table> + at least 2 newlines
    // The pattern must match at the beginning of src
    const pattern = /\n<table>\n\n/;
    const match = src.match(pattern);
    if (match && match.index !== undefined) {
      return match.index;
    }
    return -1;
  },
  
  tokenizer(this: any, src: string, tokens: any[]) {
    // Match the complete table block
    // Pattern: <table> + 2 newlines + table content + 2 newlines + </table>
    const tablePattern = /^<table>\n\n([\s\S]*?)\n\n<\/table>/;
    const match = src.match(tablePattern);
    
    if (!match) {
      return undefined;
    }
    
    const raw = match[0];
    const tableContent = match[1];
    
    // Parse table content lines
    const lines = tableContent.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return undefined;
    }
    
    // Validate table structure
    const tableData = extractTableContent(lines);
    if (!tableData) {
      return undefined;
    }
    
    // Get location info for error reporting
    const location = getFileLocation(this);
    let line = location.line || 1;
    
    // Calculate actual line number
    const fullSource = location.file ? getMarkdownSource(location.file) : undefined;
    if (fullSource) {
      const matchPos = fullSource.indexOf(raw);
      if (matchPos !== -1) {
        line = getLineAtPosition(fullSource, matchPos, location.file);
      }
    }
    
    // Validate cell contents
    let currentLine = line + 2; // +2 for <table> and blank line
    
    // Validate header cells
    for (let i = 0; i < tableData.headers.length; i++) {
      const error = validateTableCellContent(tableData.headers[i], currentLine, location);
      if (error) {
        throw createVmdError(error.code, { ...error.details, line: currentLine }, { ...location, line: currentLine });
      }
    }
    currentLine++; // separator row
    
    // Validate data cells
    for (let r = 0; r < tableData.rows.length; r++) {
      currentLine++;
      for (let c = 0; c < tableData.rows[r].length; c++) {
        const error = validateTableCellContent(tableData.rows[r][c], currentLine, location);
        if (error) {
          throw createVmdError(error.code, { ...error.details, line: currentLine }, { ...location, line: currentLine });
        }
      }
    }
    
    return {
      type: 'vmd_table',
      raw: raw,
      text: tableContent,
      headers: tableData.headers,
      alignments: tableData.alignments,
      rows: tableData.rows,
      line: line
    };
  },
  
  renderer(this: any, token: any) {
    const { headers, alignments, rows } = token;
    
    // Process inline code and write to file
    const processInlineCode = (code: string): string => {
      if (!assetProcessorInstance) {
        return `<code>${code}</code>`;
      }
      try {
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        assetProcessorInstance.writeCodeFile(code, hash);
        generatedFilesInstance.push(`${hash}.txt`);
        return `<Inlinecodevmd filePath="${hash}"></Inlinecodevmd>`;
      } catch (err) {
        return `<code>${code}</code>`;
      }
    };
    
    // Parse inline markdown to HTML
    const parseInline = (text: string): string => {
      // Process inline formats manually
      let result = text
        // Bold and italic combined: ***text***
        .replace(/\*\*\*(.+?)\*\*\*/g, '<bold><italic>$1</italic></bold>')
        // Bold: **text**
        .replace(/\*\*(.+?)\*\*/g, '<bold>$1</bold>')
        // Italic: *text*
        .replace(/\*(.+?)\*/g, '<italic>$1</italic>')
        // Inline code: `code` - process each match individually
        .replace(/`([^`]+)`/g, (match, code) => processInlineCode(code))
        // Inline math: $math$
        .replace(/\$([^$]+)\$/g, '<Inlinemathvmd formula="$1"></Inlinemathvmd>');
      
      return result;
    };
    
    // Build table header
    let headerHtml = '<Tableheadvmd><Tablerowvmd>';
    for (let i = 0; i < headers.length; i++) {
      const align = alignments[i] ? ` align="${alignments[i]}"` : '';
      const headerContent = parseInline(headers[i]);
      headerHtml += `<Tablecellvmd header="true"${align}>${headerContent}</Tablecellvmd>`;
    }
    headerHtml += '</Tablerowvmd></Tableheadvmd>';
    
    // Build table body
    let bodyHtml = '<Tablebodyvmd>';
    for (const row of rows) {
      bodyHtml += '<Tablerowvmd>';
      for (let i = 0; i < row.length; i++) {
        const align = alignments[i] ? ` align="${alignments[i]}"` : '';
        const cellContent = parseInline(row[i]);
        bodyHtml += `<Tablecellvmd${align}>${cellContent}</Tablecellvmd>`;
      }
      bodyHtml += '</Tablerowvmd>';
    }
    bodyHtml += '</Tablebodyvmd>';
    
    return `<Tablevmd>\n${headerHtml}\n${bodyHtml}\n</Tablevmd>\n`;
  }
};
