import React from 'react';
import { Pin, X, ArrowRight, FileText, Mic, Image as ImageIcon } from 'lucide-react';
import { ChatMessage } from '../types';

interface PinnedMessageBannerProps {
  message: ChatMessage | null;
  onJumpTo: (messageId: string) => void;
  onUnpin: () => void;
  accentColor?: string;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  message,
  onJumpTo,
  onUnpin,
  accentColor = '#f59e0b',
}) => {
  if (!message) return null;

  const getPreviewContent = () => {
    if (message.isDeleted) return 'This message was deleted';
    if (message.file) {
      if (message.file.isVoice) {
        return (
          <span className="flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice message ({message.file.duration || 0}s)</span>
          </span>
        );
      }
      if (message.file.mimeType.startsWith('image/')) {
        return (
          <span className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Photo: {message.file.fileName}</span>
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>File: {message.file.fileName}</span>
        </span>
      );
    }
    return message.text || 'Message';
  };

  const senderLabel = message.sender === 'me' ? 'You' : 'Peer';

  return (
    <div
      id="pinned-message-banner"
      className="w-full bg-neutral-900/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-2 z-20 flex items-center justify-between gap-3 text-xs shadow-sm transition-all"
    >
      <div
        onClick={() => onJumpTo(message.id)}
        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/pin select-none"
      >
        <div
          style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
          className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
        >
          <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
              Pinned Message
            </span>
            <span className="text-[10px] text-neutral-400">• {senderLabel}</span>
          </div>
          <p className="truncate text-xs text-neutral-200 group-hover/pin:text-white transition-colors">
            {getPreviewContent()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onJumpTo(message.id)}
          className="text-neutral-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-[11px]"
          title="Jump to message in chat"
        >
          <span>Jump</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onUnpin}
          className="text-neutral-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Unpin message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
