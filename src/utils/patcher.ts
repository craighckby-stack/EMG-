import { applyPatch } from 'diff';

export function applyUnifiedDiff(source: string, patchText: string): string {
    if (!patchText.trim()) return source;
    
    // Ensure the patch has header
    let formattedPatch = patchText;
    if (!formattedPatch.startsWith('--- ')) {
        formattedPatch = `--- a/file\n+++ b/file\n${formattedPatch}`;
    }
    
    const result = applyPatch(source, formattedPatch, { fuzzFactor: 2 });
    if (result === false) {
        throw new Error('Failed to apply diff cleanly.');
    }
    return result;
}
