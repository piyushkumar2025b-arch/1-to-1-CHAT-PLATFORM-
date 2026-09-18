import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Loader2,
  Music,
} from 'lucide-react';
import { FileAttachment } from '../types';
import { getRoomFileBlob } from '../lib/file-retrieval';

interface InlineAudioPlayerProps {
  file: FileAttachment;
  roomId: string;
  roomPassword?: string;
  accentColor?: string;
}

export const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({
  file,
  roomId,
  roomPassword,
  accentColor = '#f59e0b',
}) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRequested = useRef<boolean>(false);

  const loadAudio = async () => {
    if (audioSrc || isLoading) return;
    setIsLoading(true);
    try {
      const blob = await getRoomFileBlob(roomId, file, undefined, roomPassword);
      const url = URL.createObjectURL(blob);
      setAudioSrc(url);
    } catch (err) {
      console.error('Failed to load audio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioSrc && audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  const handleCanPlay = () => {
    if (autoPlayRequested.current && audioRef.current) {
      autoPlayRequested.current = false;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const togglePlay = async () => {
    if (!audioSrc) {
      autoPlayRequested.current = true;
      await loadAudio();
      return;
    }
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-sm rounded-xl p-2.5 bg-neutral-950/90 border border-neutral-800/90 flex flex-col gap-2 select-none shadow-sm">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
          title={isPlaying ? 'Pause audio' : 'Play audio stream'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-neutral-200 truncate pr-2">
              {file.fileName}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration || file.duration || 0)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 hover:text-emerald-400 border border-neutral-700 transition-colors cursor-pointer shrink-0"
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};
export default InlineAudioPlayer;
