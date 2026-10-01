/**
 * File and String Patching Utility
 * Provides functions to apply text replacements and patches safely.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Replaces a target pattern in string content.
 * @param {string} content - Source text content.
 * @param {string | RegExp} search - Search target.
 * @param {string} replacement - Replacement text.
 * @returns {string} - Modified content.
 */
function patchString(content, search, replacement) {
  if (typeof content !== 'string') {
    throw new TypeError('Content parameter must be a string');
  }
  if (!search) {
    throw new Error('Search target must be specified');
  }
  return content.replace(search, replacement);
}

/**
 * Applies a text replacement patch directly to a file atomically.
 * @param {string} filePath - Target file path.
 * @param {string | RegExp} search - Target pattern to replace.
 * @param {string} replacement - Replacement string.
 * @returns {boolean} - Returns true if file was modified.
 */
function patchFile(filePath, search, replacement) {
  if (typeof filePath !== 'string' || !filePath) {
    throw new TypeError('Valid file path required');
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const originalContent = fs.readFileSync(absolutePath, 'utf8');
  const updatedContent = patchString(originalContent, search, replacement);

  if (originalContent === updatedContent) {
    return false;
  }

  const tempPath = `${absolutePath}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempPath, updatedContent, 'utf8');
    fs.renameSync(tempPath, absolutePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (_) {
        // Ignore cleanup failure
      }
    }
    throw error;
  }

  return true;
}

module.exports = {
  patchString,
  patchFile,
};