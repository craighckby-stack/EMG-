'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Re-repairs constraint blocks in the postmortems documentation file.
 * @param {string} [targetPath] - Relative or absolute path to target markdown file.
 */
function repairPostmortems(targetPath) {
  const filePath = path.resolve(process.cwd(), targetPath || 'docs/POSTMORTEMS.md');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Target file not found: ${filePath}`);
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const blocks = data.split(/(?=### )/);

  if (blocks.length === 0) {
    return;
  }

  const processedBlocks = [blocks[0]];

  for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];

    if (block.includes('[HISTORY: struck 2026-09-10 by over-broad heal')) {
      const lblock = block.toLowerCase();
      const isTruncation =
        lblock.includes('unterminated') ||
        lblock.includes('has no corresponding closing tag') ||
        lblock.includes('expected');
      const isFirstFiring =
        lblock.includes('no_dead_conditions') ||
        lblock.includes('no_unverifiable_self_praise') ||
        lblock.includes('no_stale_defect_claims');
      const isDialect = lblock.includes('typescript files');
      const isPredictions = lblock.includes('predictions.md');

      let newConstraint = '';
      if (isTruncation) {
        newConstraint =
          '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH (truncation)] Model token limit exceeded, resulting in syntax truncation.\n';
      } else if (isFirstFiring || isPredictions || isDialect) {
        newConstraint =
          '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated] Verified rule finding or scope catch.\n';
      } else {
        newConstraint =
          '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH]\n';
      }

      block = block.replace(
        /\*\*CONSTRAINT \(Model Generalization\):\*\* \[HISTORY: struck 2026-09-10.*?\n/s,
        newConstraint
      );
    }

    processedBlocks.push(block);
  }

  const output = processedBlocks.join('');
  fs.writeFileSync(filePath, output, 'utf-8');
  console.log('Re-Repaired POSTMORTEMS.md v3');
}

try {
  repairPostmortems();
} catch (error) {
  console.error('Failed to repair POSTMORTEMS.md:', error.message);
  process.exit(1);
}