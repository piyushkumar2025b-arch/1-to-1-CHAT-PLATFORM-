import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Square,
  Send,
  Sparkles,
  Info,
  Waves,
  Activity,
} from 'lucide-react';
import { playChirpSound, formatChirpMessage } from '../lib/audio-chirp';

interface AudioSteganographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendChirpToChat?: (payload: string) => void;
  accentColor?: string;
}

export const AudioSteganographyModal: React.FC<AudioSteganographyModalProps> = ({
  isOpen,
  onClose,
  onSendChirpToChat,
  accentColor = '#f59e0b',
}) => {
  const [textToEncode, setTextToEncode] = useState('');
  const [caption, setCaption] = useState('Acoustic Sonar Transmission');
  const [mode, setMode] = useState<'audible_fsk' | 'ultrasonic_sonar'>('audible_fsk');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);

  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const handlePlayChirp = () => {
    if (!textToEncode.trim()) return;

    if (isPlaying && stopPlaybackRef.current) {
      stopPlaybackRef.current();
      setIsPlaying(false);
      setPlaybackProgress(0);
      setCurrentFreq(null);
      return;
    }

    setIsPlaying(true);
    setPlaybackProgress(0);

    try {
      const stopFn = playChirpSound(textToEncode.trim(), mode, (progress, freq) => {
        setPlaybackProgress(progress);
        setCurrentFreq(freq);
      });
      stopPlaybackRef.current = stopFn;
    } catch (err) {
      console.error('Failed to play chirp sound:', err);
      setIsPlaying(false);
    }
  };

  // Animate oscilloscope canvas
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let phase = 0;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = mode === 'ultrasonic_sonar' ? '#a855f7' : '#06b6d4';

      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      for (let x = 0; x < width; x++) {
        const freqMultiplier = (currentFreq || 1400) / 200;
        const y = mid + Math.sin((x / 20) * freqMultiplier + phase) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.2;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, currentFreq, mode]);

  const handleSend = () => {
    if (!textToEncode.trim() || !onSendChirpToChat) return;
    const payload = formatChirpMessage(textToEncode.trim(), mode, caption.trim());
    onSendChirpToChat(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-925 border border-cyan-500/30 shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-neutral-900 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Acoustic & Sonar Steganography
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono uppercase font-bold tracking-wider">
                  FSK Audio
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Modulate secret messages into sound waves and near-ultrasonic chirps
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('audible_fsk')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'audible_fsk'
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300 mb-1">
                <Volume2 className="w-4 h-4" />
                Acoustic Sonar FSK
              </div>
              <p className="text-[11px] text-neutral-400">
                1.2 kHz - 2.4 kHz audible sci-fi telemetry chirps.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('ultrasonic_sonar')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'ultrasonic_sonar'
                  ? 'bg-purple-950/30 border-purple-500/50 text-white shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300 mb-1">
                <VolumeX className="w-4 h-4" />
                Near-Ultrasonic Sonar
              </div>
              <p className="text-[11px] text-neutral-400">
                17.5 kHz - 19.5 kHz covert high-frequency chirps.
              </p>
            </button>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Transmission Label / Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Subspace Encrypted Telemetry"
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Secret Text */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Secret Text to Modulate into Audio
            </label>
            <textarea
              value={textToEncode}
              onChange={(e) => setTextToEncode(e.target.value)}
              rows={3}
              placeholder="Enter message to synthesize as audio chirps..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-cyan-500 font-mono resize-none"
            />
          </div>

          {/* Oscilloscope Visualizer */}
          <div className="rounded-xl bg-black border border-neutral-800 overflow-hidden relative">
            <canvas ref={canvasRef} width={420} height={70} className="w-full h-[70px] block" />
            <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-500 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{currentFreq ? `${Math.round(currentFreq)} Hz` : 'Carrier Idle'}</span>
            </div>
            {isPlaying && (
              <div className="absolute top-2 right-2 text-[10px] font-mono text-cyan-300">
                {Math.round(playbackProgress * 100)}%
              </div>
            )}
          </div>

          {/* Play Preview Button */}
          <button
            type="button"
            onClick={handlePlayChirp}
            disabled={!textToEncode.trim()}
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Synthesis</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>Play Modulated Soundwave Preview</span>
              </>
            )}
          </button>
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
            disabled={!textToEncode.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Send Audio Chirp to Chat
          </button>
        </div>
      </div>
    </div>
  );
};
