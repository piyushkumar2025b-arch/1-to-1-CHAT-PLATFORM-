import React from 'react';
import { Clock, Calendar, ShieldCheck, X, Copy, Check, CheckCheck, Info, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageDetailsModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  isSeen?: boolean;
}

export function MessageDetailsModal({
  isOpen,
  message,
  onClose,
  isSeen,
}: MessageDetailsModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !message) return null;

  const rawDate = message.createdAt ? new Date(message.createdAt) : new Date();
  const isValidDate = !isNaN(rawDate.getTime());

  const fullDateString = isValidDate
    ? rawDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  const fullTimeString = isValidDate
    ? rawDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : message.time || 'Unknown Time';

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Relative time calculation
  const getRelativeTime = () => {
    if (!isValidDate) return '';
    const diffMs = Date.now() - rawDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    const days = Math.floor(diffSec / 86400);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  const handleCopyTimestamp = () => {
    const text = `${fullDateString} at ${fullTimeString} (${timeZone})`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="message-details-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-neutral-100 space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Message Details</h3>
              <p className="text-[11px] text-neutral-400">Timestamp & dispatch metadata</p>
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

        {/* Date & Time Blocks */}
        <div className="space-y-2.5 text-xs">
          {/* Exact Date */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                Sent Date
              </span>
              <div className="font-medium text-neutral-200 mt-0.5">{fullDateString}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">{getRelativeTime()}</div>
            </div>
          </div>

          {/* Exact Time with seconds */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-400 shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                Exact Time
              </span>
              <div className="font-mono text-sm font-semibold text-neutral-100 mt-0.5">
                {fullTimeString}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                Time Zone: {timeZone}
              </div>
            </div>
          </div>

          {/* Sender & Delivery Details */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                Security & Delivery
              </span>
              <div className="flex items-center gap-1.5 text-neutral-300 mt-0.5 font-medium">
                <User className="w-3 h-3 text-neutral-400" />
                <span>{message.sender === 'me' ? 'Sent by you' : 'Sent by peer'}</span>
              </div>
              {message.sender === 'me' && (
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  {isSeen ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-sky-400 font-medium">Seen by peer</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="text-neutral-400">Delivered</span>
                    </>
                  )}
                </div>
              )}
              <div className="text-[11px] text-emerald-400/90 mt-1">
                🔒 Protected by AES-GCM-256 Zero-Knowledge Enclave
              </div>
            </div>
          </div>
        </div>

        {/* Action button: Copy full timestamp */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleCopyTimestamp}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Timestamp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
