import React, { useState } from 'react';
import {
  EyeOff,
  Eye,
  Lock,
  Unlock,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface CovertCamouflageCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const CovertCamouflageCard: React.FC<CovertCamouflageCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  // COVERT::pin::b64Decoy::b64Secret
  const parts = payload.trim().split('::');
  const requiredPin = parts[1] || 'none';
  let decoyText = 'Meeting notes';
  let secretText = '';

  try {
    decoyText = decodeURIComponent(escape(atob(parts[2] || '')));
    secretText = decodeURIComponent(escape(atob(parts[3] || '')));
  } catch {
    decoyText = parts[2] || '';
    secretText = parts[3] || '';
  }

  const [isRevealed, setIsRevealed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    if (requiredPin !== 'none') {
      if (pinInput.trim() === requiredPin) {
        setIsRevealed(true);
        setPinError(false);
      } else {
        setPinError(true);
      }
    } else {
      setIsRevealed(!isRevealed);
    }
  };

  const handleCopySecret = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(secretText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl overflow-hidden font-sans select-none my-1">
      {/* Decoy Surface Text (Visible) */}
      <div className="p-3.5 space-y-2">
        <div className="text-xs text-neutral-200 leading-relaxed font-normal">
          {decoyText}
        </div>

        {/* Subtle Discreet Stealth Unseal Trigger */}
        <div className="pt-1 flex items-center justify-between border-t border-neutral-900 text-[10px] text-neutral-500">
          <button
            type="button"
            onClick={handleReveal}
            className="flex items-center gap-1 text-neutral-500 hover:text-purple-400 transition-colors cursor-pointer"
          >
            {isRevealed ? <Eye className="w-3 h-3 text-purple-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
            <span>{isRevealed ? 'Hide Compartment' : 'Stealth Compartment'}</span>
          </button>
          <span className="font-mono text-[9px] text-neutral-600">AES-CAMOUFLAGE</span>
        </div>
      </div>

      {/* Secret Compartment Unsealed */}
      {isRevealed && (
        <div className="p-3.5 bg-purple-950/40 border-t border-purple-500/40 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-purple-300">
            <span className="flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-purple-400" />
              Covert Hidden Payload
            </span>
            <button
              type="button"
              onClick={handleCopySecret}
              className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono text-white select-text break-words">
            {secretText}
          </div>
        </div>
      )}

      {/* PIN Prompt if required and not yet revealed */}
      {!isRevealed && requiredPin !== 'none' && (
        <div className="px-3.5 pb-3 pt-0 flex items-center gap-2">
          <input
            type="password"
            maxLength={8}
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(false);
            }}
            placeholder="Compartment PIN..."
            className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={handleReveal}
            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
          >
            Unseal
          </button>
        </div>
      )}

      {pinError && (
        <div className="px-3.5 pb-2 text-[10px] text-rose-400">
          Incorrect PIN. Compartment remained sealed.
        </div>
      )}
    </div>
  );
};
