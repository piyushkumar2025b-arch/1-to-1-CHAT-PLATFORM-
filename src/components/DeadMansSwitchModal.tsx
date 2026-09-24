import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Send,
  Skull,
  Radio,
  FileKey,
  Info,
  Lock,
} from 'lucide-react';

interface DeadMansSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUserId: string;
  onArmSwitch: (switchPayload: string) => void;
  accentColor?: string;
}

const DURATIONS = [
  { label: '5 Minutes (Testing)', seconds: 300 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '2 Hours', seconds: 7200 },
  { label: '12 Hours', seconds: 43200 },
  { label: '24 Hours (1 Day)', seconds: 86400 },
  { label: '3 Days', seconds: 259200 },
];

export const DeadMansSwitchModal: React.FC<DeadMansSwitchModalProps> = ({
  isOpen,
  onClose,
  myUserId,
  onArmSwitch,
  accentColor = '#f59e0b',
}) => {
  const [actionType, setActionType] = useState<'emergency_message' | 'purge_enclave'>('emergency_message');
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [dossierTitle, setDossierTitle] = useState('Emergency Security Dossier');
  const [secretContent, setSecretContent] = useState('');
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  if (!isOpen) return null;

  const handleArm = () => {
    if (actionType === 'emergency_message' && !secretContent.trim()) return;

    const expirationTimestamp = Date.now() + durationSeconds * 1000;
    const b64Label = btoa(unescape(encodeURIComponent(dossierTitle.trim() || 'Emergency Dossier')));
    const b64Secret = btoa(unescape(encodeURIComponent(secretContent.trim() || 'WIPE_TRIGGERED')));

    // DEADMAN::creatorId::durationSec::expirationTs::action::b64Label::b64Secret
    const payload = `DEADMAN::${myUserId}::${durationSeconds}::${expirationTimestamp}::${actionType}::${b64Label}::${b64Secret}`;

    onArmSwitch(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-925 border border-rose-500/30 shadow-2xl shadow-rose-950/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-rose-950/60 via-neutral-900 to-neutral-900 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Dead Man's Switch Escrow
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono uppercase tracking-wider">
                  Fail-Safe
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Automatic trigger if heartbeat check-in ping is missed
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
          {/* Action Choice */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Contingency Trigger Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActionType('emergency_message')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  actionType === 'emergency_message'
                    ? 'bg-rose-950/30 border-rose-500/50 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-rose-300 mb-1">
                  <FileKey className="w-4 h-4" />
                  Unseal Emergency Dossier
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Reveals secret backup credentials or instructions to peer when countdown expires.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActionType('purge_enclave')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  actionType === 'purge_enclave'
                    ? 'bg-rose-950/30 border-rose-500/50 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-300 mb-1">
                  <Skull className="w-4 h-4" />
                  Emergency Enclave Zeroization
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Triggers irrevocable self-destruct warning and purges all cryptographic material.
                </p>
              </button>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Inactivity Heartbeat Threshold
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATIONS.map((dur) => (
                <button
                  key={dur.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(dur.seconds)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    durationSeconds === dur.seconds
                      ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                  {dur.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1">
              <Radio className="w-3 h-3 text-rose-400" />
              You can transmit check-in heartbeat pings at any time from the chat card to reset this timer.
            </p>
          </div>

          {/* Dossier Content if Emergency Message */}
          {actionType === 'emergency_message' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Dossier Title
                </label>
                <input
                  type="text"
                  value={dossierTitle}
                  onChange={(e) => setDossierTitle(e.target.value)}
                  placeholder="e.g. Master Enclave Recovery Key"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Sealed Emergency Payload (Unseals on Inactivity)
                </label>
                <textarea
                  value={secretContent}
                  onChange={(e) => setSecretContent(e.target.value)}
                  rows={4}
                  placeholder="Enter sensitive recovery credentials, master password, or contingency protocol..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-rose-500 font-mono resize-none"
                />
              </div>
            </div>
          )}

          {/* Warning Checkbox */}
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="confirm-deadman"
              checked={confirmedRisk}
              onChange={(e) => setConfirmedRisk(e.target.checked)}
              className="mt-0.5 accent-rose-500 rounded cursor-pointer"
            />
            <label htmlFor="confirm-deadman" className="text-xs text-rose-200/90 leading-relaxed cursor-pointer select-none">
              I understand that if I fail to transmit a heartbeat check-in before the timer expires, this fail-safe trigger will execute automatically in the room.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleArm}
            disabled={!confirmedRisk || (actionType === 'emergency_message' && !secretContent.trim())}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            Arm Dead Man's Switch
          </button>
        </div>
      </div>
    </div>
  );
};
