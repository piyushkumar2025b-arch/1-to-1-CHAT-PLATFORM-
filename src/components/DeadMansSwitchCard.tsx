import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Heart,
  Clock,
  Unlock,
  Lock,
  Skull,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface DeadMansSwitchCardProps {
  payload: string;
  isMe: boolean;
  myUserId?: string;
  accentColor?: string;
}

export const DeadMansSwitchCard: React.FC<DeadMansSwitchCardProps> = ({
  payload,
  isMe,
  myUserId,
  accentColor = '#f59e0b',
}) => {
  // DEADMAN::creatorId::durationSec::expirationTs::action::b64Label::b64Secret
  const parts = payload.trim().split('::');
  const creatorId = parts[1] || '';
  const durationSec = parseInt(parts[2] || '300', 10);
  const initialExpTs = parseInt(parts[3] || '0', 10);
  const actionType = (parts[4] as 'emergency_message' | 'purge_enclave') || 'emergency_message';

  let label = 'Emergency Dossier';
  let secret = '';
  try {
    label = decodeURIComponent(escape(atob(parts[5] || '')));
    secret = decodeURIComponent(escape(atob(parts[6] || '')));
  } catch {}

  const [expirationTs, setExpirationTs] = useState(initialExpTs);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.max(0, Math.floor((initialExpTs - Date.now()) / 1000))
  );
  const [isTriggered, setIsTriggered] = useState(remainingSeconds <= 0);
  const [isDisarmed, setIsDisarmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const isOwner = myUserId ? myUserId === creatorId : isMe;

  useEffect(() => {
    if (isDisarmed || isTriggered) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expirationTs - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        setIsTriggered(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationTs, isDisarmed, isTriggered]);

  const handleHeartbeat = () => {
    setIsPinging(true);
    setTimeout(() => {
      const newExp = Date.now() + durationSec * 1000;
      setExpirationTs(newExp);
      setRemainingSeconds(durationSec);
      setIsPinging(false);
    }, 300);
  };

  const handleDisarm = () => {
    setIsDisarmed(true);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format time remaining
  const formatTime = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentLeft = Math.min(100, Math.max(0, (remainingSeconds / durationSec) * 100));

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border border-rose-500/40 shadow-xl overflow-hidden font-sans select-none my-1">
      {/* Status Bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-rose-950/60 to-neutral-900 border-b border-rose-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className={`w-4 h-4 ${isTriggered ? 'text-rose-500 animate-bounce' : isDisarmed ? 'text-neutral-500' : 'text-rose-400 animate-pulse'}`} />
          <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">
            {isDisarmed
              ? 'Dead Man Switch: Disarmed'
              : isTriggered
              ? 'SWITCH TRIGGERED: FAIL-SAFE ACTIVATED'
              : "Active Dead Man's Switch"}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
            isDisarmed
              ? 'bg-neutral-800 text-neutral-400'
              : isTriggered
              ? 'bg-rose-500/30 text-rose-300 animate-pulse'
              : 'bg-rose-900/40 text-rose-300'
          }`}
        >
          {isDisarmed ? 'Neutral' : isTriggered ? 'Tripped' : 'Armed'}
        </span>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">{label}</div>
            <div className="text-[11px] text-neutral-400">
              {actionType === 'emergency_message'
                ? 'Unseals sealed payload if heartbeat ceases'
                : 'Triggers emergency enclave zeroization'}
            </div>
          </div>
          {isOwner && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              Your Switch
            </span>
          )}
        </div>

        {/* Live Timer or Unsealed Output */}
        {!isDisarmed && !isTriggered && (
          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                Heartbeat Expiry
              </span>
              <span className="text-sm font-mono font-bold text-rose-400 tracking-wider">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000"
                style={{ width: `${percentLeft}%` }}
              />
            </div>
          </div>
        )}

        {/* Triggered Revealed State */}
        {isTriggered && !isDisarmed && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-rose-400" />
                Emergency Dossier Unsealed
              </span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="px-2 py-1 rounded bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-[10px] flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 border border-rose-500/30 text-xs font-mono text-neutral-200 break-all select-text">
              {secret}
            </div>
          </div>
        )}

        {/* Disarmed State */}
        {isDisarmed && (
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400">
            <ShieldCheck className="w-5 h-5 mx-auto text-neutral-500 mb-1" />
            Switch neutralized and disarmed. No emergency action will occur.
          </div>
        )}

        {/* Controls for Switch Owner */}
        {isOwner && !isDisarmed && !isTriggered && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleHeartbeat}
              disabled={isPinging}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Heart className={`w-3.5 h-3.5 text-rose-400 ${isPinging ? 'scale-125 text-rose-300' : 'animate-pulse'}`} />
              <span>{isPinging ? 'Transmitting Ping...' : 'Transmit Heartbeat (Reset)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDisarm}
              className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Disarm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
