import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  X,
  Clock,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertTriangle,
} from 'lucide-react';
import { FileAttachment } from '../types';

interface ViewOnceMediaModalProps {
  isOpen: boolean;
  file: FileAttachment;
  mediaUrl: string | null;
  onBurnAndClose: () => void;
  isVoice?: boolean;
}

export const ViewOnceMediaModal: React.FC<ViewOnceMediaModalProps> = ({
  isOpen,
  file,
  mediaUrl,
  onBurnAndClose,
  isVoice = false,
}) => {
  const isVideo = Boolean(
    file.mimeType?.startsWith('video/') ||
    file.fileName?.endsWith('.mp4') ||
    file.fileName?.endsWith('.webm')
  );
  const isVoiceOrAudio = Boolean(isVoice || file.isVoice || file.mimeType?.startsWith('audio/'));

  const TOTAL_SECONDS = isVoiceOrAudio
    ? Math.max(Math.round(file.duration || 10) + 4, 10)
    : isVideo
    ? Math.max(Math.round(file.duration || 25) + 5, 25)
    : 15;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(TOTAL_SECONDS);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onBurnAndClose();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, TOTAL_SECONDS, onBurnAndClose]);

  // Prevent right-click context menu and drag
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (!isOpen) return null;

  const progressPercent = (secondsRemaining / TOTAL_SECONDS) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onContextMenu={handleContextMenu}
    >
      <div className="relative max-w-2xl w-full flex flex-col items-center bg-neutral-900 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Burn Alert Header */}
        <div className="w-full bg-amber-950/70 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>VIEW ONCE • Burn-on-Read Enclave</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsRemaining}s remaining</span>
            </div>

            <button
              type="button"
              onClick={onBurnAndClose}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close & Burn Media Now"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Disintegration Progress Bar */}
        <div className="w-full h-1 bg-neutral-800 overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full transition-all duration-1000 ease-linear ${
              secondsRemaining <= 5 ? 'bg-red-500' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Media Content Display */}
        <div className="p-6 w-full flex flex-col items-center justify-center min-h-[300px] max-h-[65vh] overflow-hidden">
          {isVoiceOrAudio ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-10 h-10 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-neutral-200">
                Burn-on-Read Voice Note ({file.duration ? `${Math.round(file.duration)}s` : 'Voice'})
              </p>
              {mediaUrl && (
                <audio
                  ref={audioRef}
                  src={mediaUrl}
                  autoPlay
                  controls
                  className="rounded-xl w-full max-w-xs mt-2"
                />
              )}
            </div>
          ) : isVideo ? (
            <div className="relative max-h-[60vh] max-w-full flex items-center justify-center">
              {mediaUrl ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  playsInline
                  controls
                  controlsList="nodownload"
                  className="max-h-[60vh] max-w-full rounded-xl select-none"
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <div className="text-sm text-neutral-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Decrypting one-time video...
                </div>
              )}
            </div>
          ) : (
            <div className="relative max-h-[60vh] max-w-full flex items-center justify-center">
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt="View Once Payload"
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full object-contain rounded-xl select-none pointer-events-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              ) : (
                <div className="text-sm text-neutral-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Decrypting one-time payload...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning Banner & Immediate Burn Button */}
        <div className="w-full bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This media will permanently dissolve and cannot be viewed again.</span>
          </div>

          <button
            type="button"
            onClick={onBurnAndClose}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Burn & Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ViewOnceMediaModal;
