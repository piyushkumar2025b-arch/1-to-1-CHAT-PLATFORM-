import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Plus,
  Search,
  Pin,
  Trash2,
  Copy,
  Check,
  Send,
  CheckSquare,
  Square,
  Tag,
  Clock,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import {
  PersonalNote,
  getPersonalNotes,
  addPersonalNote,
  updatePersonalNote,
  deletePersonalNote,
  togglePinNote,
  toggleTodoNote,
} from '../lib/personal-notes';

interface PersonalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  accentColor?: string;
}

export function PersonalNotesModal({
  isOpen,
  onClose,
  onSendToChat,
  accentColor = '#f59e0b',
}: PersonalNotesModalProps) {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'todos'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newIsTodo, setNewIsTodo] = useState(false);
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes(getPersonalNotes());
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContent.trim()) return;

    const created = addPersonalNote({
      title: newTitle.trim() || undefined,
      content: newContent.trim(),
      isPinned: newIsPinned,
      isTodo: newIsTodo,
      completed: false,
    });

    setNotes((prev) => [created, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewIsTodo(false);
    setNewIsPinned(false);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    const updated = deletePersonalNote(id);
    setNotes(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = togglePinNote(id);
    setNotes(updated);
  };

  const handleToggleTodo = (id: string) => {
    const updated = toggleTodoNote(id);
    setNotes(updated);
  };

  const handleCopyContent = (note: PersonalNote) => {
    const textToCopy = note.title ? `${note.title}\n${note.content}` : note.content;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const handleSendNote = (content: string) => {
    if (onSendToChat) {
      onSendToChat(content);
      onClose();
    }
  };

  const filteredNotes = notes
    .filter((note) => {
      if (filter === 'pinned') return note.isPinned;
      if (filter === 'todos') return note.isTodo;
      return true;
    })
    .filter((note) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        note.title?.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.sourceSender?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div
      id="personal-notes-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        style={{ borderColor: `${accentColor}30` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
              }}
            >
              <Bookmark className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Encrypted Notes to Self</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Local E2EE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Private scratchpad, saved messages, and personal checklists
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                id="notes-add-btn"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-950 hover:brightness-110 transition-all cursor-pointer shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            )}
            <button
              type="button"
              id="notes-close-btn"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              id="notes-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved notes, messages, or tags..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:ring-1"
              style={{ outlineColor: accentColor }}
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-700 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pinned')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'pinned'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
              }`}
            >
              <Pin className="w-3 h-3" />
              Pinned
            </button>
            <button
              type="button"
              onClick={() => setFilter('todos')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'todos'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-neutral-400 hover:text-emerald-300 hover:bg-neutral-800'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              Checklist
            </button>
          </div>
        </div>

        {/* Note Creation Card if active */}
        {isCreating && (
          <form
            onSubmit={handleCreateNote}
            className="p-4 border-b border-neutral-800 bg-neutral-800/40 animate-in slide-in-from-top-2 duration-150 shrink-0 space-y-3"
          >
            <input
              type="text"
              id="new-note-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title (optional)..."
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-750 text-white placeholder-neutral-500 text-xs font-semibold focus:outline-none"
            />
            <textarea
              id="new-note-content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your note, code, confidential draft, or saved snippet..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-750 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsTodo}
                    onChange={(e) => setNewIsTodo(e.target.checked)}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                  />
                  <span>Checklist item</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPinned}
                    onChange={(e) => setNewIsPinned(e.target.checked)}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                  />
                  <span>Pin note</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim()}
                  className="px-3.5 py-1 text-xs font-semibold text-neutral-950 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Notes Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-500">
                <StickyNote className="w-6 h-6 opacity-60" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-semibold text-neutral-300">
                  {searchQuery ? 'No matching notes found' : 'No personal notes yet'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {searchQuery
                    ? 'Try adjusting your search query or clear filters.'
                    : 'Save important chat messages, passwords, or personal thoughts safely in this device-encrypted notebook.'}
                </p>
              </div>
              {!searchQuery && !isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-xs font-semibold text-neutral-900 px-3.5 py-1.5 rounded-xl cursor-pointer shadow-sm hover:brightness-110"
                  style={{ backgroundColor: accentColor }}
                >
                  Create First Note
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isCopied = copiedId === note.id;

              return (
                <div
                  key={note.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                    note.isPinned
                      ? 'bg-neutral-950/80 border-amber-500/30'
                      : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {note.isTodo && (
                        <button
                          type="button"
                          onClick={() => handleToggleTodo(note.id)}
                          className="text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        >
                          {note.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {note.title && (
                        <h4
                          className={`text-xs font-bold truncate ${
                            note.completed ? 'line-through text-neutral-500' : 'text-neutral-100'
                          }`}
                        >
                          {note.title}
                        </h4>
                      )}
                      {note.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 shrink-0 font-medium">
                          <Pin className="w-2.5 h-2.5 fill-amber-400" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {note.sourceSender && (
                        <span className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20 shrink-0">
                          Saved from {note.sourceSender}
                        </span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(note.id)}
                        title={note.isPinned ? 'Unpin note' : 'Pin to top'}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          note.isPinned
                            ? 'text-amber-400 hover:bg-amber-400/10'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyContent(note)}
                        title="Copy note text"
                        className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {onSendToChat && (
                        <button
                          type="button"
                          onClick={() => handleSendNote(note.content)}
                          title="Insert note text into message input"
                          className="p-1 text-neutral-400 hover:text-cyan-300 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        title="Delete note"
                        className="p-1 text-neutral-500 hover:text-rose-400 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Body */}
                  <p
                    className={`text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed select-text font-sans ${
                      note.completed ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {note.content}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>{note.content.length} chars</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
