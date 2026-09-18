import { Reply, X, Mic, Paperclip } from 'lucide-react';
import { ReplyReference } from '../types';

interface ReplyBannerProps {
  replyTo: ReplyReference;
  onCancel: () => void;
  accentColor?: string;
}

export default function ReplyBanner({ replyTo, onCancel, accentColor = '#f59e0b' }: ReplyBannerProps) {
  return (
    <div
      id="reply-banner"
      className="flex items-center justify-between gap-3 px-3 py-2 bg-neutral-900/95 border-t border-l-4 border-neutral-700 rounded-t-xl animate-in slide-in-from-bottom-2 duration-150 text-neutral-200 text-xs"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1 rounded-md bg-neutral-800 text-neutral-300 shrink-0">
          <Reply className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-[11px] text-amber-400">
            Replying to {replyTo.senderName}
          </span>
          <p className="truncate text-neutral-400 text-[11px] flex items-center gap-1">
            {replyTo.isVoice ? (
              <>
                <Mic className="w-3 h-3 text-red-400 shrink-0" />
                <span>Voice Message</span>
              </>
            ) : replyTo.fileName ? (
              <>
                <Paperclip className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">{replyTo.fileName}</span>
              </>
            ) : (
              <span>{replyTo.text || 'Message'}</span>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
        title="Cancel reply"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
