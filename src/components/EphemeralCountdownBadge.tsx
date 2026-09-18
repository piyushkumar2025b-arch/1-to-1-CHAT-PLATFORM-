import { useEffect, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { formatRemainingTime } from '../lib/ephemeral-utils';

interface EphemeralCountdownBadgeProps {
  expiresAt?: number;
  messageId: string;
  onExpire?: (messageId: string) => void;
  isMe?: boolean;
}

export function EphemeralCountdownBadge({
  expiresAt,
  messageId,
  onExpire,
  isMe,
}: EphemeralCountdownBadgeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    // Check if already expired
    if (Date.now() >= expiresAt) {
      onExpire?.(messageId);
      return;
    }

    // Refresh every 1 second
    const interval = setInterval(() => {
      if (Date.now() >= expiresAt) {
        clearInterval(interval);
        onExpire?.(messageId);
      } else {
        setTick((t) => t + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, messageId, onExpire]);

  if (!expiresAt) return null;

  const { isExpired, text, secondsRemaining } = formatRemainingTime(expiresAt);

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded-full animate-pulse">
        <Flame className="w-2.5 h-2.5 text-rose-500" />
        <span>Self-destructing...</span>
      </span>
    );
  }

  const isUrgent = secondsRemaining <= 10;

  return (
    <span
      title={`Auto-disappearing message: destroys in ${text}`}
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full select-none transition-all duration-300 ${
        isUrgent
          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-900/40'
          : isMe
          ? 'bg-black/35 text-amber-300 border border-white/10'
          : 'bg-black/40 text-amber-300 border border-white/10'
      }`}
    >
      <Flame
        className={`w-2.5 h-2.5 ${
          isUrgent ? 'text-rose-400 animate-bounce' : 'text-amber-400'
        }`}
      />
      <span className="tabular-nums font-semibold">{text}</span>
    </span>
  );
}
