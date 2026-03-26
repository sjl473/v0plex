/**
 * Line Number Tracker
 * 
 * Pre-scans markdown to record all VMD block positions.
 * Uses sequential indexing to match tokens with their line numbers.
 */

// Full source storage
let fullSource: string = '';
let frontmatterOffset: number = 0;

// Array to store line numbers in order of appearance
let postBlockLines: number[] = [];
let currentIndex: number = 0;

/**
 * Clear tracker for a new file
 */
export function clearLineTracker(filePath?: string): void {
  fullSource = '';
  frontmatterOffset = 0;
  postBlockLines = [];
  currentIndex = 0;
}

/**
 * Pre-scan markdown to record all VMD block positions
 * This must be called BEFORE marked processes the markdown
 */
export function scanVmdBlocks(source: string, offset: number = 0): void {
  fullSource = source;
  frontmatterOffset = offset;
  postBlockLines = [];
  currentIndex = 0;
  
  // Find all <post> blocks and record their line numbers
  const regex = /<post>[\s\S]*?<\/post>/g;
  let match;
  
  while ((match = regex.exec(source)) !== null) {
    const startPos = match.index;
    
    // Calculate line number
    const textBefore = source.substring(0, startPos);
    const lineNumber = (textBefore.match(/\n/g) || []).length + 1 + offset;
    
    // Store line number in array
    postBlockLines.push(lineNumber);
  }
}

/**
 * Get the line number for the next post block in sequence.
 * This uses an internal index that increments with each call.
 * Must be called in the same order as scanVmdBlocks found the blocks.
 */
export function getBlockLineNumber(): number | undefined {
  if (currentIndex < postBlockLines.length) {
    const line = postBlockLines[currentIndex];
    currentIndex++;
    return line;
  }
  return undefined;
}

/**
 * Reset the block index counter.
 * Call this before tokenization starts to ensure line numbers
 * are returned from the beginning.
 */
export function resetBlockIndices(): void {
  currentIndex = 0;
}

/**
 * Calculate line number for content within a block
 * @param blockStartLine - The starting line of the block
 * @param content - The full block content
 * @param subContentOffset - The offset of subContent within content
 */
export function calculateSubContentLine(
  blockStartLine: number,
  content: string,
  subContentOffset: number
): number {
  const textBefore = content.substring(0, subContentOffset);
  const linesBefore = (textBefore.match(/\n/g) || []).length;
  return blockStartLine + linesBefore;
}

/**
 * Debug: Print all tracked positions
 */
export function debugPrintTrackedBlocks(): void {
  console.log('=== Tracked VMD Blocks ===');
  postBlockLines.forEach((line, idx) => {
    console.log(`  [${idx}] Line ${line}`);
  });
  console.log(`Current index: ${currentIndex}`);
  console.log('==========================');
}
