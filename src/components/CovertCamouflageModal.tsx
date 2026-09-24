import React, { useState } from 'react';
import {
  X,
  EyeOff,
  Layers,
  Send,
  Sparkles,
  Shield,
  FileText,
} from 'lucide-react';

interface CovertCamouflageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendCovert: (payload: string) => void;
  accentColor?: string;
}

const DECOY_PRESETS = [
  'Hey! Review the quarterly spreadsheet when you get a chance.',
  'Pushed the latest UI changes to the staging repo, looks clean.',
  'Thanks for the notes, let us sync up on the sprint board later today.',
  'Don’t forget the grocery list: coffee beans, oat milk, and sourdough.',
];

export const CovertCamouflageModal: React.FC<CovertCamouflageModalProps> = ({
  isOpen,
  onClose,
  onSendCovert,
  accentColor = '#f59e0b',
}) => {
  const [decoyText, setDecoyText] = useState(DECOY_PRESETS[0]);
  const [secretText, setSecretText] = useState('');
  const [secretPin, setSecretPin] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!decoyText.trim() || !secretText.trim()) return;

    const b64Decoy = btoa(unescape(encodeURIComponent(decoyText.trim())));
    const b64Secret = btoa(unescape(encodeURIComponent(secretText.trim())));
    const pin = secretPin.trim() || 'none';

    // COVERT::pin::b64Decoy::b64Secret
    const payload = `COVERT::${pin}::${b64Decoy}::${b64Secret}`;
    onSendCovert(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-925 border border-purple-500/30 shadow-2xl shadow-purple-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900 border-b border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Covert Decoy Camouflage
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono uppercase font-bold tracking-wider">
                  Anti-Shoulder Surf
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Hide high-security secrets beneath an authentic decoy message
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          {/* Surface Decoy */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Surface Decoy Message (Public View)
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPreset = DECOY_PRESETS[Math.floor(Math.random() * DECOY_PRESETS.length)];
                  setDecoyText(randomPreset);
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                Random Preset
              </button>
            </div>
            <textarea
              value={decoyText}
              onChange={(e) => setDecoyText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-purple-400 resize-none"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              This is what any casual observer or shoulder-surfer will see on the screen.
            </p>
          </div>

          {/* Hidden Secret */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Hidden Covert Payload (Encrypted Compartment)
            </label>
            <textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              rows={3}
              placeholder="Enter sensitive secret, credentials, or private directives..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-purple-400 font-mono resize-none"
            />
          </div>

          {/* Optional PIN */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Optional Compartment PIN (Leave blank for tap-to-reveal)
            </label>
            <input
              type="password"
              maxLength={8}
              value={secretPin}
              onChange={(e) => setSecretPin(e.target.value)}
              placeholder="e.g. 7749"
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!decoyText.trim() || !secretText.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Covert Capsule
          </button>
        </div>
      </div>
    </div>
  );
};
