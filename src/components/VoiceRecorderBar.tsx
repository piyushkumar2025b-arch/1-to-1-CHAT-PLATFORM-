import { useEffect, useState } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';

interface VoiceRecorderBarProps {
  volume: number; // 0 to 1
  onCancel: () => void;
  onSend: () => void;
}

export default function VoiceRecorderBar({
  volume,
  onCancel,
  onSend,
}: VoiceRecorderBarProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate 16 responsive wave bars that animate with live mic volume
  const waveBars = Array.from({ length: 16 }, (_, i) => {
    const factor = Math.sin((i / 16) * Math.PI);
    const heightPercent = Math.min(100, Math.max(15, Math.round(volume * factor * 100 + 15)));
    return heightPercent;
  });

  return (
    <div
      id="voice-recording-bar"
      className="flex-1 flex items-center justify-between gap-3 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-2 text-neutral-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Left: Recording Indicator & Live Timer */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-red-300">
          <Mic className="w-3.5 h-3.5" />
          <span>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Center: Live Soundwave visualizer */}
      <div className="flex-1 flex items-center justify-center gap-1 h-7 px-2 max-w-xs overflow-hidden">
        {waveBars.map((h, idx) => (
          <div
            key={idx}
            style={{ height: `${h}%` }}
            className="w-1 rounded-full bg-red-400 transition-all duration-75"
          />
        ))}
      </div>

      {/* Right: Discard & Send buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          title="Discard voice message"
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSend}
          title="Send voice message"
          className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
