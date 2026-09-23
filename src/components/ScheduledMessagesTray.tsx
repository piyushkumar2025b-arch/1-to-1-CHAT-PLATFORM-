import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ScheduledMessage } from '../types';

interface ScheduledMessagesTrayProps {
  scheduledMessages: ScheduledMessage[];
  onSendImmediately?: (id: string) => void;
  onSendNow?: (id: string) => void;
  onCancelScheduled?: (id: string) => void;
  onCancel?: (id: string) => void;
  accentColor?: string;
}

export const ScheduledMessagesTray: React.FC<ScheduledMessagesTrayProps> = ({
  scheduledMessages,
  onSendImmediately,
  onSendNow,
  onCancelScheduled,
  onCancel,
  accentColor = '#f59e0b',
}) => {
  const [, setTick] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSend = (id: string) => {
    if (onSendNow) onSendNow(id);
    else if (onSendImmediately) onSendImmediately(id);
  };

  const handleCancel = (id: string) => {
    if (onCancel) onCancel(id);
    else if (onCancelScheduled) onCancelScheduled(id);
  };

  // Update countdown every second
  useEffect(() => {
    if (scheduledMessages.length === 0) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledMessages.length]);

  if (scheduledMessages.length === 0) return null;

  const formatRemaining = (scheduledAt: number): string => {
    const diffMs = Math.max(0, scheduledAt - Date.now());
    const totalSecs = Math.ceil(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const nextMsg = scheduledMessages[0];

  return (
    <div className="w-full px-3 sm:px-6 mb-2">
      <div className="w-full max-w-4xl mx-auto rounded-2xl bg-neutral-900/95 border border-amber-500/40 shadow-xl overflow-hidden backdrop-blur-md">
        {/* Main Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 text-xs bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-amber-200">
                {scheduledMessages.length} Scheduled Dispatch
                {scheduledMessages.length > 1 ? 'es' : ''}:
              </span>
              <span className="font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-[11px]">
                {formatRemaining(nextMsg.scheduledAt)}
              </span>
              <span className="text-neutral-300 truncate hidden sm:inline italic">
                "{nextMsg.text}"
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => handleSend(nextMsg.id)}
              title="Dispatch message right now"
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 font-medium text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30"
            >
              <Send className="w-3 h-3" />
              <span>Send Now</span>
            </button>
            <button
              type="button"
              onClick={() => handleCancel(nextMsg.id)}
              title="Cancel scheduled dispatch"
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {scheduledMessages.length > 1 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded list if more than 1 scheduled message */}
        {isExpanded && scheduledMessages.length > 1 && (
          <div className="p-2 space-y-1.5 max-h-40 overflow-y-auto bg-neutral-950/60 divide-y divide-neutral-800/60">
            {scheduledMessages.slice(1).map((msg) => (
              <div
                key={msg.id}
                className="pt-1.5 flex items-center justify-between text-xs text-neutral-300 px-2"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="font-mono text-amber-400 text-[11px]">
                    {formatRemaining(msg.scheduledAt)}
                  </span>
                  <span className="truncate italic">"{msg.text}"</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleSend(msg.id)}
                    className="p-1 rounded text-amber-400 hover:text-amber-200"
                    title="Send now"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(msg.id)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ScheduledMessagesTray;
