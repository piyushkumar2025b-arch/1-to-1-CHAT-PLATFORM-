import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Shield,
  Radio,
  Sliders,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Headphones,
} from 'lucide-react';
import { acousticShield, NoiseType } from '../lib/acoustic-shield';

interface AcousticShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

const PROFILES: {
  id: NoiseType;
  name: string;
  badge: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'speech_jam',
    name: 'Voice Band Jammer',
    badge: 'Anti-Eavesdropping',
    description: 'Modulated speech frequencies (300Hz–3.4kHz) designed to mask nearby room conversation.',
    color: 'text-amber-400',
  },
  {
    id: 'pink',
    name: 'Pink Noise Privacy',
    badge: 'Acoustic Veil',
    description: 'Natural 1/f falloff noise profile standard for office and medical room speech privacy.',
    color: 'text-rose-400',
  },
  {
    id: 'brown',
    name: 'Brown Deep Rumble',
    badge: 'Heavy Masking',
    description: 'Deep low-frequency bass rumble. Optimal for drown out traffic and open cafe chatter.',
    color: 'text-orange-400',
  },
  {
    id: 'white',
    name: 'White Noise Scrambler',
    badge: 'Mic Dither',
    description: 'Uniform full-spectrum energy that saturates directional smartphone microphones.',
    color: 'text-cyan-400',
  },
  {
    id: 'binaural',
    name: '432Hz Binaural Wave',
    badge: 'Focus & Calm',
    description: 'Harmonic 432Hz tone with subtle 6Hz theta beats for high-focus deep work.',
    color: 'text-emerald-400',
  },
];

export const AcousticShieldModal: React.FC<AcousticShieldModalProps> = ({
  isOpen,
  onClose,
  accentColor = '#f59e0b',
}) => {
  const [isActive, setIsActive] = useState<boolean>(() => acousticShield.getIsPlaying());
  const [selectedType, setSelectedType] = useState<NoiseType>('speech_jam');
  const [volume, setVolume] = useState<number>(0.55);
  const [timerOption, setTimerOption] = useState<'off' | '15' | '30' | '60'>('off');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerTimeoutRef = useRef<any>(null);

  // Sync state if already playing
  useEffect(() => {
    setIsActive(acousticShield.getIsPlaying());
  }, [isOpen]);

  const handleToggle = () => {
    if (isActive) {
      acousticShield.stop();
      setIsActive(false);
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    } else {
      acousticShield.start(selectedType, volume);
      setIsActive(true);
      applyTimer(timerOption);
    }
  };

  const handleSelectType = (type: NoiseType) => {
    setSelectedType(type);
    if (isActive) {
      acousticShield.start(type, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    acousticShield.setVolume(newVol);
  };

  const applyTimer = (option: 'off' | '15' | '30' | '60') => {
    setTimerOption(option);
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    if (option !== 'off' && isActive) {
      const minutes = parseInt(option, 10);
      timerTimeoutRef.current = setTimeout(() => {
        acousticShield.stop();
        setIsActive(false);
      }, minutes * 60 * 1000);
    }
  };

  // Canvas spectrum visualizer
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSpectrum = () => {
      const analyser = acousticShield.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isActive) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + (dataArray[i] / 255) * 0.7})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        // Idle line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(renderSpectrum);
    };

    animFrameRef.current = requestAnimationFrame(renderSpectrum);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isActive]);

  if (!isOpen) return null;

  return (
    <div
      id="acoustic-shield-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-all ${
                isActive
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Acoustic Privacy Shield</h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {isActive ? 'SHIELD ENGAGED' : 'STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Acoustic speech jamming & room noise masking to defeat eavesdropping
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className="relative w-full h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={64}
            className="w-full h-full opacity-90"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Real-time Audio Spectrum</span>
            </span>
            {isActive && (
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                48 kHz Masker Active
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Power Button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2.5 active:scale-98 ${
              isActive
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-neutral-950 shadow-amber-500/20'
            }`}
          >
            {isActive ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Mute Acoustic Shield</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Engage Acoustic Shield</span>
              </>
            )}
          </button>

          {/* Volume Control */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Masking Intensity</span>
              </span>
              <span className="font-mono text-neutral-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Sound Profiles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Acoustic Masking Profiles</span>
              <span className="text-[10px] text-neutral-500">Synthesized locally in RAM</span>
            </label>
            <div className="space-y-1.5">
              {PROFILES.map((p) => {
                const isSelected = selectedType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectType(p.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-800/80 border-amber-500/50 shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">{p.description}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-neutral-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Off Timer */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Auto-Off Timer</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'off', label: 'Continuous' },
                { id: '15', label: '15 min' },
                { id: '30', label: '30 min' },
                { id: '60', label: '60 min' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => applyTimer(opt.id as any)}
                  className={`py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer border ${
                    timerOption === opt.id
                      ? 'bg-neutral-800 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Optimal with laptop or phone external speakers</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
