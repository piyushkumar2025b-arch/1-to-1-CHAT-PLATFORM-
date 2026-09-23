import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, BellRing, CheckCircle2 } from 'lucide-react';

interface CountdownTimerCardProps {
  totalSeconds: number;
  label?: string;
  accentColor?: string;
}

export const CountdownTimerCard: React.FC<CountdownTimerCardProps> = ({
  totalSeconds: initialSeconds,
  label = 'Countdown Timer',
  accentColor = '#f59e0b',
}) => {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [hasFinished, setHasFinished] = useState(false);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            setHasFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, remaining]);

  // Audio chime when finished
  useEffect(() => {
    if (remaining === 0 && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.85);
        }
      } catch {
        // audio play failed or muted
      }
    }
  }, [remaining]);

  const handleReset = () => {
    setRemaining(initialSeconds);
    setIsRunning(true);
    setHasFinished(false);
    audioPlayedRef.current = false;
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = initialSeconds > 0 ? (remaining / initialSeconds) * 100 : 0;

  return (
    <div className="w-full max-w-xs rounded-xl overflow-hidden border border-cyan-500/30 bg-neutral-950/80 shadow-md my-1 text-left select-none">
      <div className="px-3 py-2 bg-cyan-500/15 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasFinished ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-cyan-300">
            {label}
          </span>
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
            hasFinished
              ? 'bg-emerald-500/20 text-emerald-300'
              : isRunning
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {hasFinished ? 'COMPLETED' : isRunning ? 'RUNNING' : 'PAUSED'}
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-mono font-bold tracking-tight text-white flex items-baseline gap-1">
            <span>{formattedTime}</span>
            <span className="text-xs text-neutral-400 font-normal">left</span>
          </div>

          <div className="flex items-center gap-1">
            {!hasFinished && (
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              hasFinished
                ? 'bg-emerald-500'
                : remaining < 10
                ? 'bg-rose-500 animate-pulse'
                : 'bg-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
