import React, { useState } from 'react';
import { X, Zap, Plus, Trash2, Send, CornerDownLeft, Sparkles, Search } from 'lucide-react';
import {
  QuickReplyItem,
  getAllQuickReplies,
  getCustomQuickReplies,
  saveCustomQuickReplies,
} from '../lib/quick-replies';

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReply: (text: string, sendImmediately: boolean) => void;
  accentColor?: string;
}

export function QuickRepliesModal({
  isOpen,
  onClose,
  onSelectReply,
  accentColor = '#f59e0b',
}: QuickRepliesModalProps) {
  const [replies, setReplies] = useState<QuickReplyItem[]>(() => getAllQuickReplies());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'status' | 'actions' | 'privacy' | 'custom'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  if (!isOpen) return null;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const customList = getCustomQuickReplies();
    const newItem: QuickReplyItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      text: newText.trim(),
      category: 'custom',
      isCustom: true,
    };

    const updated = [newItem, ...customList];
    saveCustomQuickReplies(updated);
    setReplies(getAllQuickReplies());
    setNewTitle('');
    setNewText('');
    setIsCreating(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const customList = getCustomQuickReplies().filter((item) => item.id !== id);
    saveCustomQuickReplies(customList);
    setReplies(getAllQuickReplies());
  };

  const filtered = replies
    .filter((item) => {
      if (filterCategory === 'all') return true;
      if (filterCategory === 'custom') return item.isCustom;
      return item.category === filterCategory;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ borderColor: `${accentColor}33` }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
              }}
            >
              <Zap className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Quick Canned Replies</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  {replies.length}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Instantly insert or send frequent templates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search canned replies and shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(['all', 'status', 'actions', 'privacy', 'custom'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-white/15 text-white shadow-xs font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Custom</span>
          </button>
        </div>

        {/* Custom Reply Creator Drawer */}
        {isCreating && (
          <form
            onSubmit={handleSaveCustom}
            className="p-4 bg-neutral-950/60 border-b border-amber-500/30 flex flex-col gap-2.5 animate-in slide-in-from-top-2"
          >
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Custom Shortcut Reply</span>
            </div>
            <input
              type="text"
              placeholder="Short title (e.g. ETA, Safe Code, In a Meeting)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
              maxLength={40}
              required
            />
            <textarea
              placeholder="Full reply text that will be inserted..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400 resize-none"
              maxLength={300}
              required
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-xs"
              >
                Save Shortcut
              </button>
            </div>
          </form>
        )}

        {/* List of Quick Replies */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-neutral-800/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No replies found in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="pt-2 first:pt-0 group/item flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-200 group-hover/item:text-amber-300 transition-colors">
                      {item.title}
                    </span>
                    {item.isCustom && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-medium">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 select-text">
                    {item.text}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 opacity-85 group-hover/item:opacity-100 transition-opacity">
                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(item.id, e)}
                      title="Delete custom reply"
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSelectReply(item.text, false);
                      onClose();
                    }}
                    title="Insert text into message box without sending"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CornerDownLeft className="w-3 h-3 text-neutral-400" />
                    <span>Insert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectReply(item.text, true);
                      onClose();
                    }}
                    title="Send this response immediately"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Tip: Type <code className="text-amber-400 font-mono">/quick</code> in chat to open anytime</span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
