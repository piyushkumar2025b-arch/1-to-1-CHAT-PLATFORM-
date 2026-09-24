import React, { useState, useRef } from 'react';
import {
  Radio,
  Play,
  Square,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Activity,
  Check,
  Copy,
} from 'lucide-react';
import { playChirpSound, parseChirpMessage } from '../lib/audio-chirp';

interface AudioSteganographyCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const AudioSteganographyCard: React.FC<AudioSteganographyCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  const parsed = parseChirpMessage(payload);
  if (!parsed) {
    return (
      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 font-mono">
        Invalid Acoustic Telemetry Stream
      </div>
    );
  }

  const { mode, decodedPayload, caption } = parsed;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const stopFnRef = useRef<(() => void) | null>(null);

  const handleTogglePlay = () => {
    if (isPlaying && stopFnRef.current) {
      stopFnRef.current();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    setIsPlaying(true);
    setProgress(0);
    try {
      const stop = playChirpSound(decodedPayload, mode, (p) => {
        setProgress(p);
      });
      stopFnRef.current = stop;
    } catch (err) {
      console.error('Failed to play chirp:', err);
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(decodedPayload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border border-cyan-500/30 shadow-xl overflow-hidden font-sans select-none my-1">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/50 to-neutral-900 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-300 tracking-wide uppercase">
            {mode === 'ultrasonic_sonar' ? 'Near-Ultrasonic Sonar' : 'Acoustic FSK Sonar'}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
          {mode === 'ultrasonic_sonar' ? '18 kHz' : '1.8 kHz'}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs font-semibold text-white tracking-wide">
            {caption || 'Acoustic Telemetry Cipher'}
          </div>
          <div className="text-[11px] text-neutral-400">
            {decodedPayload.length} characters modulated into soundwave frequencies
          </div>
        </div>

        {/* Audio Wave / Player Bar */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                {isPlaying ? 'Synthesizing Pulses...' : 'Soundwave Ready'}
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Decode / Reveal Plaintext Button */}
        {revealed ? (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                Decoded Plaintext Payload
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2 rounded-lg bg-black/60 text-xs font-mono text-white select-text break-words">
              {decodedPayload}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Demodulate & Reveal Plaintext</span>
          </button>
        )}
      </div>
    </div>
  );
};
