import React, { useState } from 'react';
import {
  X,
  Lock,
  Clock,
  Send,
  Calendar,
  Sparkles,
  KeyRound,
  Shield,
} from 'lucide-react';

interface TimeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (payload: string) => void;
  accentColor?: string;
}

const PRESETS = [
  { label: '1 Min', minutes: 1 },
  { label: '5 Min', minutes: 5 },
  { label: '15 Min', minutes: 15 },
  { label: '1 Hour', minutes: 60 },
  { label: '4 Hours', minutes: 240 },
  { label: '24 Hours', minutes: 1440 },
];

export const TimeLockModal: React.FC<TimeLockModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  accentColor = '#f59e0b',
}) => {
  const [title, setTitle] = useState('');
  const [secretText, setSecretText] = useState('');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  if (!isOpen) return null;

  const getTargetEpoch = (): number => {
    if (useCustomDate && customDateTime) {
      const dt = new Date(customDateTime).getTime();
      if (!isNaN(dt) && dt > Date.now()) return dt;
    }
    return Date.now() + selectedMinutes * 60 * 1000;
  };

  const targetEpoch = getTargetEpoch();
  const unlockDateStr = new Date(targetEpoch).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSeal = () => {
    if (!secretText.trim()) return;

    try {
      const b64 = btoa(unescape(encodeURIComponent(secretText.trim())));
      const safeTitle = encodeURIComponent(title.trim() || 'Classified Time Capsule');
      const payload = `TIMELOCK::${targetEpoch}::${b64}::${safeTitle}`;
      onInsertToChat(payload);
      onClose();
      setSecretText('');
      setTitle('');
    } catch {
      alert('Failed to encode secret');
    }
  };

  return (
    <div
      id="timelock-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Time-Locked Message Capsule</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  Escrow
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Seals messages in temporal lock until a future timestamp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Capsule Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Capsule Label / Title (Visible while locked)
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Roadmap, Tomorrow's Meeting Seed, Surprise Note..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Secret Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Confidential Content (Hidden until unlock time)
            </label>
            <textarea
              rows={4}
              placeholder="Enter sensitive message, code, or announcement to be sealed..."
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono resize-none"
            />
          </div>

          {/* Lock Duration Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Schedule</span>
              </span>
              <button
                type="button"
                onClick={() => setUseCustomDate(!useCustomDate)}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                {useCustomDate ? 'Use Quick Presets' : 'Custom Date & Time'}
              </button>
            </div>

            {!useCustomDate ? (
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => setSelectedMinutes(p.minutes)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedMinutes === p.minutes
                        ? 'bg-neutral-800 text-amber-300 border-amber-500/50 shadow-xs'
                        : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          {/* Preview Banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
            <span className="text-neutral-300 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Will automatically unlock on:</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">{unlockDateStr}</span>
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={!secretText.trim()}
            onClick={handleSeal}
            className="w-full py-3 rounded-xl font-bold text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Seal & Dispatch Time-Locked Capsule</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Temporal lock enforced in recipient view</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
