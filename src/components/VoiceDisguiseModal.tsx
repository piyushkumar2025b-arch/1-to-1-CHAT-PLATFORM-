import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Sparkles,
  Volume2,
  Sliders,
  Shield,
  Radio,
  RefreshCw,
} from 'lucide-react';

interface VoiceDisguiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendDisguisedAudio: (file: File) => void;
  accentColor?: string;
}

type VoiceMaskProfile = 'anonymous' | 'radio' | 'whisper' | 'helium' | 'clean';

const PROFILES: {
  id: VoiceMaskProfile;
  name: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: 'anonymous',
    name: 'Cyber Anonymous',
    badge: 'Pitch Down',
    desc: 'Deep robotic vocal pitch shift to conceal personal vocal identity.',
  },
  {
    id: 'radio',
    name: 'Tactical Radio Comms',
    badge: 'Walkie-Talkie',
    desc: '300Hz–3kHz narrow bandpass military radio filter with subtle grit.',
  },
  {
    id: 'whisper',
    name: 'Stealth Whisper',
    badge: 'High-Pass',
    desc: 'Attenuates resonant bass frequencies for quiet, masked speech.',
  },
  {
    id: 'helium',
    name: 'Helium Shift',
    badge: 'Pitch Up',
    desc: 'High-frequency upward formant shift for complete vocal obscurity.',
  },
  {
    id: 'clean',
    name: 'Direct Original',
    badge: 'Unmasked',
    desc: 'Clean direct microphone capture without filters applied.',
  },
];

export const VoiceDisguiseModal: React.FC<VoiceDisguiseModalProps> = ({
  isOpen,
  onClose,
  onSendDisguisedAudio,
  accentColor = '#f59e0b',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<VoiceMaskProfile>('anonymous');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(rawBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playTransformedPreview = async () => {
    if (!recordedBlob) return;
    if (isPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    try {
      setIsProcessing(true);
      const arrayBuf = await recordedBlob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);

      // Create offline context to render effect
      const offlineCtx = new OfflineAudioContext(
        decodedBuffer.numberOfChannels,
        decodedBuffer.length,
        decodedBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;

      // Apply profile DSP
      if (selectedProfile === 'anonymous') {
        source.playbackRate.value = 0.82; // Pitch down
      } else if (selectedProfile === 'helium') {
        source.playbackRate.value = 1.35; // Pitch up
      } else if (selectedProfile === 'radio') {
        const biquad = offlineCtx.createBiquadFilter();
        biquad.type = 'bandpass';
        biquad.frequency.value = 1600;
        biquad.Q.value = 1.2;
        source.connect(biquad);
        biquad.connect(offlineCtx.destination);
      } else if (selectedProfile === 'whisper') {
        const hp = offlineCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        source.connect(hp);
        hp.connect(offlineCtx.destination);
      }

      if (selectedProfile !== 'radio' && selectedProfile !== 'whisper') {
        source.connect(offlineCtx.destination);
      }

      source.start();
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert rendered buffer to wav/audio blob
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
      setIsProcessing(false);
    } catch {
      setIsProcessing(false);
      setIsPlaying(false);
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    try {
      setIsProcessing(true);
      const arrayBuf = await recordedBlob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);

      const offlineCtx = new OfflineAudioContext(
        decodedBuffer.numberOfChannels,
        decodedBuffer.length,
        decodedBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;

      if (selectedProfile === 'anonymous') {
        source.playbackRate.value = 0.82;
      } else if (selectedProfile === 'helium') {
        source.playbackRate.value = 1.35;
      } else if (selectedProfile === 'radio') {
        const biquad = offlineCtx.createBiquadFilter();
        biquad.type = 'bandpass';
        biquad.frequency.value = 1600;
        biquad.Q.value = 1.2;
        source.connect(biquad);
        biquad.connect(offlineCtx.destination);
      } else if (selectedProfile === 'whisper') {
        const hp = offlineCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        source.connect(hp);
        hp.connect(offlineCtx.destination);
      }

      if (selectedProfile !== 'radio' && selectedProfile !== 'whisper') {
        source.connect(offlineCtx.destination);
      }

      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWavBlob(renderedBuffer);

      const disguisedFile = new File(
        [wavBlob],
        `voice_disguised_${Date.now()}.wav`,
        { type: 'audio/wav' }
      );

      onSendDisguisedAudio(disguisedFile);
      onClose();
    } catch {
      alert('Failed to process disguised audio');
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="voice-disguise-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-sm">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Voice Disguise Studio</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                  Anonymizer
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                DSP voice morphing & acoustic identity protection
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Record Control Area */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecording ? 'bg-rose-500 animate-ping' : 'bg-neutral-600'
                }`}
              />
              <span className={isRecording ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                {isRecording
                  ? `Recording Voice (${recordDuration}s)...`
                  : recordedBlob
                  ? `Audio Captured (${recordDuration}s)`
                  : 'Ready to Record'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>{recordedBlob ? 'Re-record Voice' : 'Start Recording'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>Stop Recording</span>
                </button>
              )}

              {recordedBlob && !isRecording && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={playTransformedPreview}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Test Filter'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Masking Profiles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Vocal Disguise Mask
            </label>
            <div className="space-y-1.5">
              {PROFILES.map((p) => {
                const isSelected = selectedProfile === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfile(p.id);
                      if (isPlaying && previewAudioRef.current) {
                        previewAudioRef.current.pause();
                        setIsPlaying(false);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-800 border-purple-500/60 shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {p.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">{p.desc}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-purple-400 bg-purple-400'
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

          {/* Send Button */}
          {recordedBlob && (
            <button
              type="button"
              disabled={isRecording || isProcessing}
              onClick={handleSend}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transforming Audio...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Disguised Voice Note</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Hardware DSP voice obfuscation</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Minimal WAV Blob encoder helper
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
