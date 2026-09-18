import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Chatting' | 'Media & Tools';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Enter'], description: 'Send current message', category: 'Chatting' },
  { keys: ['Shift', 'Enter'], description: 'Add new line without sending', category: 'Chatting' },
  { keys: ['/'], description: 'Open Slash Commands palette (/notes, /quick, /appearance, /canvas...)', category: 'Chatting' },
  { keys: ['Alt', 'N'], description: 'Open Encrypted Notes to Self & scratchpad', category: 'Media & Tools' },
  { keys: ['Ctrl / ⌘', 'K'], description: 'Toggle in-chat search & filter', category: 'Navigation' },
  { keys: ['Ctrl / ⌘', 'F'], description: 'Quick find in conversation', category: 'Navigation' },
  { keys: ['Ctrl / ⌘', 'Shift', 'L'], description: 'Instant privacy lock screen', category: 'Navigation' },
  { keys: ['Escape'], description: 'Close modals / Cancel reply / Lock session', category: 'Navigation' },
  { keys: ['Ctrl / ⌘', 'V'], description: 'Paste screenshot or image directly as attachment', category: 'Media & Tools' },
  { keys: ['Alt', 'S'], description: 'Toggle collaborative scratchpad & whiteboard', category: 'Media & Tools' },
  { keys: ['Alt', 'C'], description: 'Open interactive code snippet sandbox & REPL', category: 'Media & Tools' },
  { keys: ['Alt', 'B'], description: 'Toggle Screenshot & Blur Guard privacy veil', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts cheat sheet', category: 'Media & Tools' },
];

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  accentColor = '#f59e0b',
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = ['Chatting', 'Navigation', 'Media & Tools'] as const;

  return (
    <div
      id="keyboard-shortcuts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              className="p-2 rounded-xl"
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-neutral-400">Master fast shortcuts for seamless chatting</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-1">
                  {cat}
                </span>
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 divide-y divide-neutral-800/60 overflow-hidden">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-900/60 transition-colors text-xs"
                    >
                      <span className="text-neutral-300 font-medium">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 text-[10px] font-mono font-semibold text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-md shadow-inner"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-neutral-500" />
            <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono text-[9px]">Esc</kbd> anytime to exit dialogs</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-1.5 rounded-xl text-neutral-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
