import React from 'react';
import { X, Flame, Clock, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';
import { EphemeralTimerOption } from '../types';
import { EPHEMERAL_OPTIONS } from '../lib/ephemeral-utils';

interface EphemeralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  durationOption: EphemeralTimerOption;
  onChangeSetting: (enabled: boolean, option: EphemeralTimerOption) => void;
  accentColor?: string;
}

export function EphemeralSettingsModal({
  isOpen,
  onClose,
  enabled,
  durationOption,
  onChangeSetting,
  accentColor = '#f59e0b',
}: EphemeralSettingsModalProps) {
  if (!isOpen) return null;

  const handleToggle = () => {
    if (enabled) {
      onChangeSetting(false, 'off');
    } else {
      onChangeSetting(true, durationOption === 'off' ? '1m' : durationOption);
    }
  };

  const handleSelectOption = (opt: EphemeralTimerOption) => {
    if (opt === 'off') {
      onChangeSetting(false, 'off');
    } else {
      onChangeSetting(true, opt);
    }
  };

  return (
    <div
      id="ephemeral-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>Disappearing Messages</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Self-destructing ephemeral timer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-100">
                Auto-Disappear Status
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  enabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {enabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {enabled
                ? 'New messages will auto-erase after the selected timer.'
                : 'Messages stay in the encrypted room history.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-amber-500' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Timer Duration Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between px-1">
            <span>Timer Duration</span>
            {enabled && (
              <span className="text-[11px] font-mono text-amber-400">
                Active: {durationOption}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-2">
            {EPHEMERAL_OPTIONS.filter((o) => o.id !== 'off').map((opt) => {
              const isSelected = enabled && durationOption === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Privacy info note */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            When a message expires, it is permanently wiped from the room&apos;s encrypted Firestore storage and client cache. Timers count down locally in real time.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
