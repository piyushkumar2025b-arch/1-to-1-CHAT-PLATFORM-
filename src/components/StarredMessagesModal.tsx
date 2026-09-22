import React, { useState } from 'react';
import {
  Star,
  X,
  Search,
  ArrowRight,
  Copy,
  Check,
  Trash2,
  Clock,
  FileText,
  Mic,
  MessageSquare,
  Download,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { triggerBlobDownload } from '../lib/file-compression';

interface StarredMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  starredMessages: ChatMessage[];
  onToggleStarMessage: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
}

export const StarredMessagesModal: React.FC<StarredMessagesModalProps> = ({
  isOpen,
  onClose,
  starredMessages,
  onToggleStarMessage,
  onJumpToMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'media' | 'links'>('all');

  if (!isOpen) return null;

  const filteredMessages = starredMessages.filter((msg) => {
    // Type filtering
    if (filterType === 'media' && !msg.file) return false;
    if (filterType === 'links' && (!msg.text || !/https?:\/\/[^\s]+/i.test(msg.text))) return false;
    if (filterType === 'text' && (!msg.text || msg.file)) return false;

    // Search filtering
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const textMatch = msg.text?.toLowerCase().includes(query);
    const fileMatch = msg.file?.fileName?.toLowerCase().includes(query);
    return Boolean(textMatch || fileMatch);
  });

  const handleCopy = (msg: ChatMessage) => {
    const textToCopy = msg.text || msg.file?.fileName || '';
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleExportStarred = () => {
    if (starredMessages.length === 0) return;
    const lines = [
      '# Starred Messages Export',
      `Exported: ${new Date().toLocaleString()}`,
      `Total Bookmarks: ${starredMessages.length}`,
      '----------------------------------------\n',
    ];

    starredMessages.forEach((msg, idx) => {
      const timeStr = msg.time || (msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Unknown time');
      const senderStr = msg.sender === 'me' ? 'You' : 'Peer';
      lines.push(`[#${idx + 1}] ${senderStr} (${timeStr}):`);
      if (msg.text) {
        lines.push(msg.text);
      }
      if (msg.file) {
        lines.push(`[Attachment: ${msg.file.fileName} - ${(msg.file.fileSize / 1024).toFixed(1)} KB]`);
      }
      lines.push('\n');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `starred-messages-${new Date().toISOString().slice(0, 10)}.txt`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Starred Messages</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {starredMessages.length}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Bookmarked confidential messages, notes, and attachments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {starredMessages.length > 0 && (
              <button
                type="button"
                onClick={handleExportStarred}
                title="Export all starred messages to a text file"
                className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter */}
        {starredMessages.length > 0 && (
          <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/50 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search starred messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {(
                [
                  { id: 'all', label: 'All Items' },
                  { id: 'text', label: 'Text Messages' },
                  { id: 'media', label: 'Attachments & Files' },
                  { id: 'links', label: 'Links & URLs' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                    filterType === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
          {starredMessages.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center mx-auto text-neutral-500">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-300">No starred messages yet</p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Hover over any chat message and click the star icon to save important encrypted notes or media.
              </p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No starred messages match &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div
                  key={msg.id}
                  className="group relative p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-semibold ${
                          isMe ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {isMe ? 'You' : 'Peer'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {msg.time || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg)}
                        title="Copy message text"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onJumpToMessage(msg.id);
                        }}
                        title="Jump to message in chat"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Jump</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStarMessage(msg.id)}
                        title="Remove from starred"
                        className="p-1 rounded hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview */}
                  {msg.text && (
                    <p className="text-xs text-neutral-200 leading-relaxed break-words whitespace-pre-wrap line-clamp-4">
                      {msg.text}
                    </p>
                  )}

                  {/* Attachment indicator if present */}
                  {msg.file && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                      {msg.file.isVoice ? (
                        <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate flex-1 font-medium">{msg.file.fileName}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {(msg.file.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Starred messages stay saved locally during your active session</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default StarredMessagesModal;
