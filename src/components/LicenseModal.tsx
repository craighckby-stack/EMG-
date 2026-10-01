/**
 * File: src/components/LicenseModal.tsx
 * Role: Modern Black & Emerald License & Attribution Modal
 */

import React, { useState } from 'react';
import {
  Scale,
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  GitFork,
  Ban,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LICENSE_TEXT = `Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)
[Full text of the license is available at https://creativecommons.org]

Copyright (c) 2026 Craighckby

This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License.
To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.

License Summary:
- Share: Copy and redistribute the material.
- NoDerivatives: If you remix, transform, or build upon the material, you may not distribute the modified material.
- Attribution/NonCommercial/NoDerivatives terms apply as detailed at the link above.`;

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LICENSE_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div
        id="emg-license-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="emg-license-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="cyber-card w-full max-w-2xl max-h-[90vh] bg-[#070e0a]/95 border border-emerald-500/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-5 md:p-6 border-b border-emerald-950 bg-[#040805] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  License & Attribution
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  CC BY-NC-ND 4.0 International
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-exit-license-header"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exit License Modal (Esc)"
                aria-label="Exit License Modal"
              >
                <X className="w-4 h-4" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 md:p-6 overflow-y-auto space-y-5 custom-scrollbar font-sans">
            {/* Core Badges & Terms Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#040805] border border-emerald-950 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Copy and redistribute the material in any medium or format.
                </p>
              </div>

              <div className="p-3.5 bg-[#040805] border border-emerald-950 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Adapt</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Remix, transform, and build upon the material.
                </p>
              </div>

              <div className="p-3.5 bg-[#040805] border border-emerald-950 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                  <Ban className="w-3.5 h-3.5" />
                  <span>NonCommercial</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Attribution, NonCommercial, & ShareAlike terms apply.
                </p>
              </div>
            </div>

            {/* Full License Block */}
            <div className="bg-[#040805] border border-emerald-950 rounded-xl p-4 font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap select-text max-h-56 overflow-y-auto custom-scrollbar">
              {LICENSE_TEXT}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 border-t border-emerald-950 bg-[#040805] shrink-0">
            <a
              id="link-creative-commons"
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors font-medium cursor-pointer"
            >
              <span>View Deed on Creative Commons</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-license"
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-[#09140c] hover:bg-emerald-950 text-zinc-300 hover:text-white border border-emerald-800/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy License</span>
                  </>
                )}
              </button>

              <button
                id="btn-dismiss-license"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                title="Exit and close modal"
                aria-label="Exit modal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
