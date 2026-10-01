// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Resolves the target postmortem file path.
 * @param {string} [customPath] - Optional custom file path from CLI argument.
 * @returns {string} Fully resolved file path.
 */
function resolveFilePath(customPath) {
  if (customPath) {
    return path.resolve(process.cwd(), customPath);
  }
  const defaultRelative = path.join('docs', 'POSTMORTEMS.md');
  const cwdTarget = path.resolve(process.cwd(), defaultRelative);
  if (fs.existsSync(cwdTarget)) {
    return cwdTarget;
  }
  return path.resolve(__dirname, defaultRelative);
}

/**
 * Repairs incorrectly struck postmortem records in markdown content.
 * @param {string} content - Raw markdown text of POSTMORTEMS.md.
 * @returns {{ repairedContent: string, repairedCount: number, struckCount: number }} Processed result.
 */
function repairPostmortems(content) {
  const blocks = content.split(/(?=### )/);
  const out = [];
  let repairedCount = 0;
  let struckCount = 0;

  if (blocks.length > 0) {
    out.push(blocks[0]);
  }

  for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];

    if (block.includes('⚠️ [STRUCK: NOT_VERIFIABLE')) {
      const lowerBlock = block.toLowerCase();
      const isPhantom = lowerBlock.includes('no_unused_macros') || lowerBlock.includes('no such file or directory');
      const isTruncation = lowerBlock.includes('unterminated string literal') ||
        lowerBlock.includes('has no corresponding closing tag') ||
        lowerBlock.includes('expected');
      const isFirstFiring = block.includes('NO_DEAD_CONDITIONS') ||
        block.includes('NO_UNVERIFIABLE_SELF_PRAISE') ||
        block.includes('NO_STALE_DEFECT_CLAIMS');
      const isDialect = block.includes('TypeScript files');
      const isPredictions = block.includes('PREDICTIONS.md');

      if (isPhantom) {
        struckCount++;
        out.push(block);
      } else {
        repairedCount++;
        const eol = block.includes('\r\n') ? '\r\n' : '\n';
        block = block.replace(/### ⚠️ \[STRUCK: NOT_VERIFIABLE, [^\]]+\] (\[.*?\] .*?)\r?\n/, `### ❌ $1${eol}`);

        let newConstraint = '';
        if (isTruncation) {
          newConstraint = `**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH (truncation)] Model token limit exceeded, resulting in syntax truncation.${eol}`;
        } else if (isFirstFiring || isPredictions || isDialect) {
          newConstraint = `**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated] Verified rule finding or scope catch.${eol}`;
        } else {
          newConstraint = `**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH]${eol}`;
        }

        block = block.replace(/\*\*CONSTRAINT \(Model Generalization\):\*\* \[STRUCK\] Original constraint invalidated.*?\r?\n/s, newConstraint);
        out.push(block);
      }
    } else {
      out.push(block);
    }
  }

  return {
    repairedContent: out.join(''),
    repairedCount,
    struckCount
  };
}

/**
 * Main execution handler.
 */
function main() {
  const targetPath = resolveFilePath(process.argv[2]);

  try {
    if (!fs.existsSync(targetPath)) {
      console.error(`File not found: ${targetPath}`);
      process.exitCode = 1;
      return;
    }

    const data = fs.readFileSync(targetPath, 'utf-8');
    const { repairedContent, repairedCount, struckCount } = repairPostmortems(data);

    fs.writeFileSync(targetPath, repairedContent, 'utf-8');
    console.log(`Repaired ${path.relative(process.cwd(), targetPath)}: ${repairedCount} restored, ${struckCount} kept struck.`);
  } catch (error) {
    console.error(`Failed to repair postmortems: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  repairPostmortems,
  resolveFilePath
};