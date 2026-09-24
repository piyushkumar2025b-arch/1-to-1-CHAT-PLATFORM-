import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  Hourglass,
} from 'lucide-react';

interface RoomLifespanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLifespanMinutes?: number;
  onSetRoomLifespan: (minutes: number) => void;
  accentColor?: string;
}

const LIFESPANS = [
  { label: '10 Minutes (High Risk)', minutes: 10 },
  { label: '30 Minutes', minutes: 30 },
  { label: '1 Hour (Standard Burner)', minutes: 60 },
  { label: '4 Hours', minutes: 240 },
  { label: '12 Hours', minutes: 720 },
  { label: '24 Hours (1 Day)', minutes: 1440 },
];

export const RoomLifespanModal: React.FC<RoomLifespanModalProps> = ({
  isOpen,
  onClose,
  currentLifespanMinutes,
  onSetRoomLifespan,
  accentColor = '#f59e0b',
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(currentLifespanMinutes || 60);

  if (!isOpen) return null;

  const handleApply = () => {
    onSetRoomLifespan(selectedMinutes);
    onClose();
  };

  const handleDisable = () => {
    onSetRoomLifespan(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-neutral-925 border border-orange-500/30 shadow-2xl shadow-orange-950/30 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-950/40 via-neutral-900 to-neutral-900 border-b border-orange-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Hourglass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Disposable Burner Room
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono uppercase font-bold tracking-wider">
                  Self-Destruct
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Evacuate and zeroize entire room session after expiration
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
        <div className="p-5 space-y-4 text-sm text-neutral-300">
          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
            When a Burner Room lifespan is set, both participants will see a synchronized countdown in the top banner. When the timer hits 0:00, all messages, chunks, and session keys are purged.
          </p>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Select Room Lifespan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LIFESPANS.map((item) => (
                <button
                  key={item.minutes}
                  type="button"
                  onClick={() => setSelectedMinutes(item.minutes)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedMinutes === item.minutes
                      ? 'bg-orange-500/20 border-orange-500 text-white font-semibold shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-orange-400" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          {currentLifespanMinutes && currentLifespanMinutes > 0 ? (
            <button
              type="button"
              onClick={handleDisable}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Turn Off Burner Timer
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-orange-400 hover:bg-orange-300 shadow-lg shadow-orange-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            Arm Room Lifespan
          </button>
        </div>
      </div>
    </div>
  );
};
