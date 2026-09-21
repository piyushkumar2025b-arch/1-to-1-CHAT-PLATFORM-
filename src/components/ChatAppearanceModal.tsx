import React, { useState } from 'react';
import { X, Sliders, Type, Clock, Keyboard, Check, Sparkles, Smile, Square, Baseline } from 'lucide-react';
import {
  DisplaySettings,
  saveDisplaySettings,
  MessageDensity,
  FontSizePreference,
  TimeFormatPreference,
  SendKeyPreference,
  BubbleRadiusPreference,
  FontFamilyPreference,
} from '../lib/display-settings';

interface ChatAppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DisplaySettings;
  onUpdateSettings: (newSettings: DisplaySettings) => void;
  accentColor?: string;
}

export function ChatAppearanceModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  accentColor = '#f59e0b',
}: ChatAppearanceModalProps) {
  const [draft, setDraft] = useState<DisplaySettings>(settings);

  if (!isOpen) return null;

  const handleChange = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    onUpdateSettings(updated);
    saveDisplaySettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}33` }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
              }}
            >
              <Sliders className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Display & Chat Preferences</h2>
              <p className="text-[11px] text-neutral-400">
                Adjust message text sizing, spacing & shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Section 1: Font Size */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Chat Message Font Size</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'small', label: 'Compact', desc: '13px' },
                  { id: 'medium', label: 'Default', desc: '14.5px' },
                  { id: 'large', label: 'Spacious', desc: '16px' },
                ] as { id: FontSizePreference; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('fontSize', opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    draft.fontSize === opt.id
                      ? 'bg-amber-500/15 border-amber-500/60 text-white ring-1 ring-amber-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {draft.fontSize === opt.id && (
                      <Check className="w-3 h-3 text-amber-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 font-mono">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Message Density */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Message Spacing / Density</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'compact', label: 'Tight', desc: 'Minimum gaps' },
                  { id: 'comfortable', label: 'Balanced', desc: 'Standard' },
                  { id: 'spacious', label: 'Relaxed', desc: 'Generous padding' },
                ] as { id: MessageDensity; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('density', opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    draft.density === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white ring-1 ring-emerald-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {draft.density === opt.id && (
                      <Check className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Time Format */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Timestamp Format</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: '12h', label: '12-Hour Clock', example: '2:45 PM' },
                  { id: '24h', label: '24-Hour Military', example: '14:45' },
                ] as { id: TimeFormatPreference; label: string; example: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('timeFormat', opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    draft.timeFormat === opt.id
                      ? 'bg-sky-500/15 border-sky-500/60 text-white ring-1 ring-sky-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{opt.example}</div>
                  </div>
                  {draft.timeFormat === opt.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Bubble Corner Shape */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Bubble Corner Styling</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'modern', label: 'Modern', desc: 'Rounded 2xl' },
                  { id: 'rounded', label: 'Pill', desc: 'Fully curved' },
                  { id: 'chatty', label: 'Classic Tail', desc: 'Tailed corners' },
                  { id: 'sharp', label: 'Clean Box', desc: 'Subtle 6px' },
                ] as { id: BubbleRadiusPreference; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('bubbleRadius', opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    (draft.bubbleRadius || 'modern') === opt.id
                      ? 'bg-amber-500/15 border-amber-500/60 text-white ring-1 ring-amber-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-neutral-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Font Family Typography */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Baseline className="w-3.5 h-3.5 text-emerald-400" />
              <span>Typography Font Family</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'sans', label: 'Clean Sans', fontClass: 'font-sans' },
                  { id: 'mono', label: 'Matrix Mono', fontClass: 'font-mono' },
                  { id: 'serif', label: 'Editorial Serif', fontClass: 'font-serif' },
                  { id: 'system', label: 'Native OS', fontClass: 'font-sans' },
                ] as { id: FontFamilyPreference; label: string; fontClass: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('fontFamily', opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${opt.fontClass} ${
                    (draft.fontFamily || 'sans') === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white ring-1 ring-emerald-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-neutral-400">Aa Bb 123</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Keyboard Send Shortcut */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-purple-400" />
              <span>Send Message Shortcut</span>
            </label>
            <div className="space-y-2">
              {(
                [
                  {
                    id: 'enter',
                    title: 'Enter to send',
                    desc: 'Press Enter to send, Shift+Enter for a new line',
                  },
                  {
                    id: 'ctrl_enter',
                    title: 'Ctrl + Enter to send',
                    desc: 'Press Enter for a new line, Ctrl+Enter or Cmd+Enter to send',
                  },
                ] as { id: SendKeyPreference; title: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('sendKey', opt.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    draft.sendKey === opt.id
                      ? 'bg-purple-500/15 border-purple-500/60 text-white ring-1 ring-purple-400/40'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
                  </div>
                  {draft.sendKey === opt.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live Bubble Preview */}
          <div className="pt-2 border-t border-neutral-800/80">
            <div className="text-[11px] font-semibold text-neutral-400 mb-2">Live Preview:</div>
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 flex flex-col gap-2.5">
              <div
                className={`self-start p-2.5 max-w-[85%] bg-neutral-800 text-neutral-200 shadow-sm ${
                  draft.bubbleRadius === 'rounded'
                    ? 'rounded-3xl'
                    : draft.bubbleRadius === 'sharp'
                    ? 'rounded-md'
                    : draft.bubbleRadius === 'chatty'
                    ? 'rounded-2xl rounded-tl-sm'
                    : 'rounded-2xl'
                } ${
                  draft.fontFamily === 'mono'
                    ? 'font-mono'
                    : draft.fontFamily === 'serif'
                    ? 'font-serif'
                    : 'font-sans'
                } ${
                  draft.fontSize === 'small'
                    ? 'text-xs'
                    : draft.fontSize === 'large'
                    ? 'text-base'
                    : 'text-sm'
                }`}
              >
                <span>Previewing your customized chat appearance!</span>
                <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between gap-3">
                  <span>{draft.timeFormat === '24h' ? '14:30' : '2:30 PM'}</span>
                  <span className="text-[9px] uppercase tracking-wider text-amber-400/90 font-mono">
                    {draft.density}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">Saved automatically in browser</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
