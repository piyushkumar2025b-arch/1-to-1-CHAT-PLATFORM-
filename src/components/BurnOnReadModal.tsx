import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Send,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';

interface BurnOnReadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (payload: string) => void;
  accentColor?: string;
}

export const BurnOnReadModal: React.FC<BurnOnReadModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  accentColor = '#f59e0b',
}) => {
  const [secret, setSecret] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const buildPayload = () => {
    if (!secret.trim()) return '';
    try {
      const b64 = btoa(unescape(encodeURIComponent(secret.trim())));
      return `BURN_SECRET::${timerSeconds}::${b64}`;
    } catch {
      return '';
    }
  };

  const payload = buildPayload();

  const handleCopy = () => {
    if (!payload) return;
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInsert = () => {
    if (onInsertToChat && payload) {
      onInsertToChat(payload);
      onClose();
      setSecret('');
    }
  };

  return (
    <div
      id="burn-on-read-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Burn-After-Reading Note</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300">
                  Self-Destruct
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Messages that self-destruct into ash once read by the recipient
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
          {/* Secret Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidential Secret</span>
              </span>
              <span className="text-[10px] text-neutral-500">Purged upon timer expiry</span>
            </label>
            <textarea
              rows={4}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter passwords, temporary keys, banking info, recovery seeds or private notes..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-mono focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Timer Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Self-Destruct Timer (After Opening)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimerSeconds(sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    timerSeconds === sec
                      ? 'bg-orange-500 text-neutral-950 shadow-md font-extrabold'
                      : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                >
                  <span>{sec}s</span>
                  <span className="text-[9px] opacity-80 font-sans">
                    {sec <= 10 ? 'Rapid' : sec <= 30 ? 'Normal' : 'Extended'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 flex items-start gap-2.5 text-[11px] text-orange-200">
            <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-300">Strict One-Time Read Guarantee</p>
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                The timer begins immediately once the recipient clicks &apos;Reveal&apos;. When the countdown reaches 0s, the content is wiped from RAM.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!secret.trim()}
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Payload!' : 'Copy Capsule'}</span>
            </button>

            {onInsertToChat && (
              <button
                type="button"
                disabled={!secret.trim()}
                onClick={handleInsert}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Send to Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
