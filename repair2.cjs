'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Re-processes POSTMORTEMS.md to refine constraints for reinstated history items.
 *
 * @param {string} filePath - Path to the markdown postmortems file.
 */
function repairPostmortems(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exitCode = 1;
      return;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const blocks = data.split(/(?=### )/);

    if (blocks.length === 0) {
      return;
    }

    const outBlocks = [blocks[0]];
    const constraintRegex = /\*\*CONSTRAINT \(Model Generalization\):\*\* \[HISTORY: struck 2026-09-10.*?\n/s;

    for (let i = 1; i < blocks.length; i++) {
      let block = blocks[i];

      if (block.includes('[HISTORY: struck 2026-09-10 by over-broad heal')) {
        const lblock = block.toLowerCase();

        const isTruncation = lblock.includes('unterminated string literal') ||
                             lblock.includes('has no corresponding closing tag') ||
                             lblock.includes('expected');
        const isFirstFiring = lblock.includes('no_dead_conditions') ||
                              lblock.includes('no_unverifiable_self_praise') ||
                              lblock.includes('no_stale_defect_claims');
        const isDialect = lblock.includes('typescript files');
        const isPredictions = lblock.includes('predictions.md');

        let newConstraint = '';
        if (isTruncation) {
          newConstraint = '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH (truncation)] Model token limit exceeded, resulting in syntax truncation.\n';
        } else if (isFirstFiring || isPredictions || isDialect) {
          newConstraint = '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated] Verified rule finding or scope catch.\n';
        } else {
          newConstraint = '**CONSTRAINT (Model Generalization):** [HISTORY: struck 2026-09-10 by over-broad heal; re-instated as VERIFIED GATE CATCH]\n';
        }

        block = block.replace(constraintRegex, newConstraint);
      }

      outBlocks.push(block);
    }

    const out = outBlocks.join('');
    fs.writeFileSync(filePath, out, 'utf-8');
    console.log('Re-Repaired POSTMORTEMS.md');
  } catch (err) {
    console.error(`Failed to repair ${filePath}:`, err);
    process.exitCode = 1;
  }
}

const targetPath = path.join('docs', 'POSTMORTEMS.md');
repairPostmortems(targetPath);