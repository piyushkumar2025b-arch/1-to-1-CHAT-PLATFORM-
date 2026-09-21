import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Loader2, FileText, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { FileAttachment } from '../types';
import { triggerBlobDownload } from '../lib/file-compression';
import { getRoomFileBlob } from '../lib/file-retrieval';
import { copyToClipboardSafe } from '../lib/security';

interface VoiceMessagePlayerProps {
  file: FileAttachment;
  roomId: string;
  isMe: boolean;
  accentColor?: string;
  roomPassword?: string;
}

export default function VoiceMessagePlayer({
  file,
  roomId,
  isMe,
  accentColor = '#f59e0b',
  roomPassword,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file.duration || 0);
  const [playbackRate, setPlaybackRate] = useState<0.75 | 1 | 1.25 | 1.5 | 2>(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rawAudioBlobRef = useRef<Blob | null>(null);

  const transcriptText = file.transcription?.trim() || '';

  // Initialize or fetch audio source blob
  const loadAudioBlob = async (): Promise<string> => {
    if (audioUrl) return audioUrl;
    setIsLoadingAudio(true);

    try {
      const blob = await getRoomFileBlob(roomId, file, undefined, roomPassword);
      rawAudioBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    if (isLoadingAudio) return;

    if (!audioRef.current) {
      const url = await loadAudioBlob();
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio playback error:', err);
      }
    }
  };

  const cycleSpeed = () => {
    const speeds: Array<0.75 | 1 | 1.25 | 1.5 | 2> = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = async (index: number, totalBars: number) => {
    const targetFraction = index / totalBars;
    const targetSeconds = targetFraction * (duration || 1);

    if (!audioRef.current) {
      const url = await loadAudioBlob();
      const audio = new Audio(url);
      audioRef.current = audio;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = targetSeconds;
      setCurrentTime(targetSeconds);
      if (!isPlaying) {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = async () => {
    if (!rawAudioBlobRef.current) {
      await loadAudioBlob();
    }
    if (rawAudioBlobRef.current) {
      triggerBlobDownload(rawAudioBlobRef.current, file.fileName || 'voice-message.webm');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Default bars if not provided
  const waveform = file.waveformData?.length
    ? file.waveformData
    : [0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.8, 0.5, 0.4, 0.6];

  const playedFraction = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      id={`voice-player-${file.fileId}`}
      className={`flex flex-col gap-2 p-3 rounded-xl min-w-[240px] sm:min-w-[280px] max-w-sm select-none ${
        isMe
          ? 'bg-neutral-900/90 text-neutral-100 border border-neutral-700/60'
          : 'bg-neutral-800/95 text-neutral-100 border border-neutral-700/60'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={isLoadingAudio}
          style={{ backgroundColor: accentColor }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-950 font-bold shrink-0 hover:opacity-90 transition-transform active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
          title={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isLoadingAudio ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Bars */}
        <div className="flex-1 flex items-center gap-[2.5px] h-8 cursor-pointer py-1">
          {waveform.map((val, idx) => {
            const barFraction = idx / waveform.length;
            const isPlayed = barFraction <= playedFraction;
            const heightPx = Math.max(6, Math.round(val * 26));

            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx, waveform.length)}
                className="flex-1 flex items-center justify-center hover:opacity-80 py-1"
                title={`Seek to ${formatTime(barFraction * duration)}`}
              >
                <div
                  style={{
                    height: `${heightPx}px`,
                    backgroundColor: isPlayed ? accentColor : undefined,
                  }}
                  className={`w-full rounded-full transition-colors ${
                    isPlayed ? 'opacity-100' : 'bg-neutral-600/70'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Timer, Speed, Download, Transcript */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-0.5 border-t border-neutral-700/40">
        <span className="font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Transcript Toggle */}
          {transcriptText && (
            <button
              type="button"
              onClick={() => setShowTranscript((prev) => !prev)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                showTranscript
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-neutral-750 hover:bg-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="View voice note transcript"
            >
              <FileText className="w-3 h-3" />
              <span>Transcript</span>
              {showTranscript ? (
                <ChevronUp className="w-2.5 h-2.5" />
              ) : (
                <ChevronDown className="w-2.5 h-2.5" />
              )}
            </button>
          )}

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded bg-neutral-750 hover:bg-neutral-700 text-[10px] font-bold tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            {playbackRate}x
          </button>

          {/* Download Voice Note */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download voice note (.webm)"
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Voice Note Transcript Drawer */}
      {showTranscript && transcriptText && (
        <div className="mt-2 pt-2 border-t border-neutral-700/50 text-xs text-neutral-200 bg-neutral-900/60 rounded-lg p-2.5 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
            <span className="flex items-center gap-1 text-amber-400">
              <FileText className="w-3 h-3" />
              Speech Transcript
            </span>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboardSafe(transcriptText);
                if (ok) {
                  setCopiedTranscript(true);
                  setTimeout(() => setCopiedTranscript(false), 2000);
                }
              }}
              className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy transcript text"
            >
              {copiedTranscript ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed italic select-text">
            "{transcriptText}"
          </p>
        </div>
      )}
    </div>
  );
}
