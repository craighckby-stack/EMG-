/**
 * File: src/utils/fileSplitter.ts
 * Role: Automatic file decomposition utility for large source files (>1000 lines).
 * Architecture: Decomposes large files by class, function, or section boundaries into logical module units.
 */

export interface SplitModuleChunk {
  id: string;
  name: string;
  type: 'class' | 'function' | 'imports' | 'section';
  startLine: number;
  endLine: number;
  content: string;
  lineCount: number;
}

export interface FileDecompositionResult {
  filePath: string;
  originalLineCount: number;
  requiresSplitting: boolean;
  chunks: SplitModuleChunk[];
  headerImports: string;
}

/**
 * Checks if a file exceeds the 1000-line token budget ceiling.
 */
export function needsDecomposition(content: string, threshold: number = 1000): boolean {
  if (!content) return false;
  return content.split('\n').length > threshold;
}

/**
 * Decomposes source code files into logical module units based on class, function,
 * or top-level section boundaries.
 */
export function decomposeFile(
  filePath: string,
  content: string,
  threshold: number = 1000
): FileDecompositionResult {
  const lines = content.split('\n');
  const totalLines = lines.length;

  if (totalLines <= threshold) {
    return {
      filePath,
      originalLineCount: totalLines,
      requiresSplitting: false,
      chunks: [
        {
          id: 'full_file',
          name: filePath.split('/').pop() || filePath,
          type: 'section',
          startLine: 1,
          endLine: totalLines,
          content,
          lineCount: totalLines,
        },
      ],
      headerImports: '',
    };
  }

  // Extract header imports / top-level declarations
  const headerLines: string[] = [];
  let codeStartIdx = 0;

  for (let i = 0; i < Math.min(100, totalLines); i++) {
    const line = lines[i] || '';
    if (
      line.startsWith('import ') ||
      line.startsWith('from ') ||
      line.startsWith('export type ') ||
      line.startsWith('export interface ') ||
      line.startsWith('/**') ||
      line.startsWith(' *') ||
      line.startsWith('//') ||
      line.trim() === ''
    ) {
      headerLines.push(line);
      codeStartIdx = i + 1;
    } else if (/^(class\s+|export\s+class\s+|def\s+|function\s+|export\s+function\s+)/.test(line.trim())) {
      break;
    }
  }

  const headerImports = headerLines.join('\n');
  const chunks: SplitModuleChunk[] = [];
  let currentChunkLines: string[] = [];
  let currentChunkName = 'Header & Imports';
  let currentChunkType: SplitModuleChunk['type'] = 'imports';
  let chunkStartLine = 1;

  const targetChunkSize = 350; // Target ~350 lines per module chunk

  for (let i = codeStartIdx; i < totalLines; i++) {
    const line = lines[i] || '';
    const lineNum = i + 1;

    // Detect structural boundaries (class or top-level function / def)
    const classMatch = line.match(/^(?:export\s+)?class\s+([A-Za-z0-9_]+)/);
    const fnMatch =
      line.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/) ||
      line.match(/^def\s+([A-Za-z0-9_]+)/);

    const isBoundary = (classMatch || fnMatch) && currentChunkLines.length >= 200;

    if (isBoundary || currentChunkLines.length >= targetChunkSize) {
      if (currentChunkLines.length > 0) {
        chunks.push({
          id: `chunk_${chunks.length + 1}`,
          name: currentChunkName,
          type: currentChunkType,
          startLine: chunkStartLine,
          endLine: lineNum - 1,
          content: currentChunkLines.join('\n'),
          lineCount: currentChunkLines.length,
        });
      }

      currentChunkLines = [line];
      chunkStartLine = lineNum;

      if (classMatch && classMatch[1]) {
        currentChunkName = `Class ${classMatch[1]}`;
        currentChunkType = 'class';
      } else if (fnMatch && fnMatch[1]) {
        currentChunkName = `Function ${fnMatch[1]}`;
        currentChunkType = 'function';
      } else {
        currentChunkName = `Module Section ${chunks.length + 1}`;
        currentChunkType = 'section';
      }
    } else {
      currentChunkLines.push(line);
    }
  }

  // Push final chunk
  if (currentChunkLines.length > 0) {
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      name: currentChunkName,
      type: currentChunkType,
      startLine: chunkStartLine,
      endLine: totalLines,
      content: currentChunkLines.join('\n'),
      lineCount: currentChunkLines.length,
    });
  }

  return {
    filePath,
    originalLineCount: totalLines,
    requiresSplitting: true,
    chunks,
    headerImports,
  };
}

/**
 * Re-assembles optimized module chunks back into a single cohesive source file.
 */
export function reassembleChunks(decomposition: FileDecompositionResult, optimizedChunks: string[]): string {
  if (!decomposition.requiresSplitting || optimizedChunks.length === 0) {
    return optimizedChunks[0] || '';
  }

  return optimizedChunks.join('\n\n');
}
