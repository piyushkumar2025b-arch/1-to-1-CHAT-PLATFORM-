import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { FileAttachment } from '../types';
import { getRoomFileBlob } from '../lib/file-retrieval';

interface InlineVideoPlayerProps {
  file: FileAttachment;
  roomId: string;
  roomPassword?: string;
  accentColor?: string;
}

export const InlineVideoPlayer: React.FC<InlineVideoPlayerProps> = ({
  file,
  roomId,
  roomPassword,
  accentColor = '#f59e0b',
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isPiPSupported, setIsPiPSupported] = useState<boolean>(false);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const autoPlayRequested = useRef<boolean>(false);

  // Check if Picture-in-Picture is supported
  useEffect(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      setIsPiPSupported(Boolean(document.pictureInPictureEnabled));
    }
  }, []);

  // Sync PiP state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnterPiP = () => setIsPiPActive(true);
    const onLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [videoSrc]);

  // Fetch and prepare video blob URL
  const prepareVideo = async () => {
    if (videoSrc || isLoading) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const blob = await getRoomFileBlob(roomId, file, undefined, roomPassword);
      const url = URL.createObjectURL(blob);
      setVideoSrc(url);
    } catch (err: any) {
      console.error('Failed to load video stream:', err);
      setLoadError('Failed to load video stream.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Video event listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    if (autoPlayRequested.current && videoRef.current) {
      autoPlayRequested.current = false;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const togglePlay = async () => {
    if (!videoSrc) {
      autoPlayRequested.current = true;
      await prepareVideo();
      return;
    }
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Playback prevented:', e);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const triggerControlsHover = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerControlsHover}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full max-w-sm rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-md group/player select-none"
    >
      {/* Video Element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full max-h-72 object-contain bg-black cursor-pointer"
        />
      ) : (
        <div
          onClick={() => {
            autoPlayRequested.current = true;
            prepareVideo();
          }}
          className="w-full h-44 bg-neutral-900/90 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-850 transition-colors relative overflow-hidden"
        >
          {file.previewUrl && (
            <img
              src={file.previewUrl}
              alt={file.fileName}
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px]"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="relative z-10 w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg group-hover/player:scale-105 transition-transform">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </div>
          <span className="relative z-10 text-[11px] font-semibold text-neutral-200 tracking-wide">
            {isLoading ? 'Decrypting Stream...' : 'Tap to Stream Video'}
          </span>
          <span className="relative z-10 text-[10px] text-neutral-400 font-mono">
            {file.fileName}
          </span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          <span className="text-xs text-neutral-200 font-medium">Decrypting video payload...</span>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="p-3 bg-red-950/70 text-red-300 text-xs text-center border-t border-red-800/50">
          {loadError}
          <button
            type="button"
            onClick={prepareVideo}
            className="block mx-auto mt-1 underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Video Floating Controls Overlay (When video is loaded) */}
      {videoSrc && (
        <div
          className={`absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-200 z-10 ${
            showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Slider */}
          <div className="flex items-center gap-2 mb-1.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-neutral-700/80 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Bottom Bar: Play, Time, Volume, PiP, Fullscreen */}
          <div className="flex items-center justify-between text-neutral-200 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="p-1 hover:text-amber-400 transition-colors cursor-pointer text-neutral-400 hover:text-neutral-200"
                title="Replay from start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-mono text-neutral-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume & Mute */}
              <div className="flex items-center gap-1 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 h-1 bg-neutral-700/80 rounded-lg appearance-none cursor-pointer accent-amber-400 hidden sm:inline-block"
                  title="Volume"
                />
              </div>

              {/* Picture-in-Picture Button */}
              {isPiPSupported && (
                <button
                  type="button"
                  onClick={togglePiP}
                  className={`p-1 transition-colors cursor-pointer ${
                    isPiPActive ? 'text-amber-400' : 'hover:text-amber-400 text-neutral-300'
                  }`}
                  title="Picture-in-Picture (Float video outside chat)"
                >
                  <Tv className="w-4 h-4" />
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 hover:text-amber-400 transition-colors cursor-pointer text-neutral-300"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InlineVideoPlayer;
