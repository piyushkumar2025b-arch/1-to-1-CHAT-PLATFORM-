import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, FileText, Link, MessageSquare } from 'lucide-react';

export type SearchFilterType = 'all' | 'text' | 'files' | 'links';

interface ChatSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  filterType: SearchFilterType;
  setFilterType: (filter: SearchFilterType) => void;
  accentColor?: string;
}

export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  filterType,
  setFilterType,
  accentColor = '#f59e0b',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  return (
    <div
      id="chat-search-bar"
      className="w-full bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800/80 px-4 py-2.5 z-25 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages, files, links in this room..."
            className="w-full bg-neutral-950/80 border border-neutral-750/90 rounded-xl pl-9 pr-8 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Match Count Badge */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-mono font-semibold ${
                matchCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No matches'}
            </span>

            {/* Prev / Next Navigation Arrows */}
            {matchCount > 0 && (
              <div className="flex items-center rounded-lg border border-neutral-750 bg-neutral-950/60 overflow-hidden">
                <button
                  type="button"
                  onClick={onPrevMatch}
                  title="Previous match (Shift+Enter)"
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-neutral-800" />
                <button
                  type="button"
                  onClick={onNextMatch}
                  title="Next match (Enter)"
                  className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Chips & Close */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 bg-neutral-950/60 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('text')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              filterType === 'text'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('files')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              filterType === 'files'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Files</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('links')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              filterType === 'links'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>Links</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close search (Esc)"
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
