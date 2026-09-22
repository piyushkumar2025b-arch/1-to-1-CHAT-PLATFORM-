import React, { useState } from 'react';
import {
  Clock,
  X,
  Calendar,
  Send,
  Timer,
  AlertCircle,
} from 'lucide-react';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
  onConfirmSchedule: (delayMs: number) => void;
  accentColor?: string;
}

const PRESET_DELAYS = [
  { label: 'In 1 minute', ms: 1 * 60 * 1000 },
  { label: 'In 5 minutes', ms: 5 * 60 * 1000 },
  { label: 'In 10 minutes', ms: 10 * 60 * 1000 },
  { label: 'In 15 minutes', ms: 15 * 60 * 1000 },
  { label: 'In 30 minutes', ms: 30 * 60 * 1000 },
  { label: 'In 1 hour', ms: 60 * 60 * 1000 },
  { label: 'In 2 hours', ms: 120 * 60 * 1000 },
  { label: 'In 3 hours', ms: 3 * 60 * 60 * 1000 },
];

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  messageText,
  onConfirmSchedule,
  accentColor = '#f59e0b',
}) => {
  const [selectedDelayMs, setSelectedDelayMs] = useState<number>(5 * 60 * 1000);
  const [customMinutes, setCustomMinutes] = useState<string>('10');
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let finalDelayMs = selectedDelayMs;
    if (useCustom) {
      const parsed = parseInt(customMinutes, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return;
      }
      finalDelayMs = parsed * 60 * 1000;
    }

    onConfirmSchedule(finalDelayMs);
    onClose();
  };

  const calculateTargetTime = (ms: number): string => {
    const target = new Date(Date.now() + ms);
    return target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const currentMs = useCustom
    ? (parseInt(customMinutes, 10) || 1) * 60 * 1000
    : selectedDelayMs;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center"
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Schedule Delayed Dispatch</h3>
              <p className="text-[11px] text-neutral-400">
                Staged locally in encrypted memory and sent automatically
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Message Preview */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
            <div className="text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
              <span>Message to send:</span>
            </div>
            <p className="line-clamp-2 italic text-neutral-200">
              "{messageText || 'Empty message'}"
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium block">
              Choose Delay Time:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_DELAYS.map((preset) => {
                const isSelected = !useCustom && selectedDelayMs === preset.ms;
                return (
                  <button
                    key={preset.ms}
                    type="button"
                    onClick={() => {
                      setSelectedDelayMs(preset.ms);
                      setUseCustom(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/80 bg-neutral-800 text-amber-300 font-semibold ring-1 ring-amber-500/40'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className="block text-xs">{preset.label}</span>
                    <span className="block text-[10px] text-neutral-500 font-mono mt-0.5">
                      {calculateTargetTime(preset.ms)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Minute Input */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="scheduleType"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="accent-amber-500"
              />
              <span className="text-neutral-300 font-medium">Custom Minutes</span>
            </label>
            {useCustom && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-neutral-100 font-mono text-xs focus:outline-none"
                />
                <span className="text-neutral-400 text-xs">minutes from now</span>
              </div>
            )}
          </div>

          {/* Dispatch Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] flex items-start gap-2">
            <Timer className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span>Will transmit at approximately </span>
              <strong className="font-mono text-amber-200">
                {calculateTargetTime(currentMs)}
              </strong>
              <span>. You can cancel or transmit early at any time from the chat bar.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-1.5 rounded-xl text-neutral-950 font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ScheduleMessageModal;
