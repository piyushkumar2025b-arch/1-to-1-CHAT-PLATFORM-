import React from 'react';
import { Trash2, Users, User, X, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageDeleteDialogProps {
  isOpen: boolean;
  message: ChatMessage | null;
  isMyMessage: boolean;
  onClose: () => void;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
}

export function MessageDeleteDialog({
  isOpen,
  message,
  isMyMessage,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}: MessageDeleteDialogProps) {
  if (!isOpen || !message) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="message-delete-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-neutral-100 space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Delete Message</h3>
              <p className="text-xs text-neutral-400">Choose how to delete this message</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview Snippet */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300 max-h-20 overflow-y-auto">
          {message.file ? (
            <span className="flex items-center gap-1.5 text-neutral-300">
              📎 {message.file.fileName}
            </span>
          ) : message.text ? (
            <p className="line-clamp-2 italic opacity-90">"{message.text}"</p>
          ) : (
            <span className="italic opacity-60">Message</span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {/* Delete for Everyone */}
          <button
            type="button"
            id="btn-delete-for-everyone"
            onClick={() => {
              onDeleteForEveryone(message.id);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-semibold">Delete for everyone</div>
                <div className="text-[11px] text-red-300/70">
                  {isMyMessage
                    ? 'Removes content for all participants in this room'
                    : 'Removes content for both you and your peer'}
                </div>
              </div>
            </div>
          </button>

          {/* Delete for Me */}
          <button
            type="button"
            id="btn-delete-for-me"
            onClick={() => {
              onDeleteForMe(message.id);
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-200 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-neutral-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-semibold">Delete for me</div>
                <div className="text-[11px] text-neutral-400">
                  Hides this message on your device only
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer info & Cancel */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span>Cannot be undone</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
