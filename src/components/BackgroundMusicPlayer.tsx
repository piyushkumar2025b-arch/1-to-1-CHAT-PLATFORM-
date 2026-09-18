import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music,
  Upload,
  X,
  Minimize2,
  Maximize2,
  Radio,
  Sparkles,
  ListMusic,
  Trash2,
} from 'lucide-react';

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  isLocal?: boolean;
  duration?: string;
  category: 'lofi' | 'ambient' | 'synth' | 'local';
}

// Curated royalty-free / open CC full tracks and ambient compositions
const DEFAULT_TRACKS: SongTrack[] = [
  {
    id: 'track-1',
    title: 'Chill Lo-Fi Study Beats',
    artist: 'Open Beats Collective',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    duration: '02:27',
    category: 'lofi',
  },
  {
    id: 'track-2',
    title: 'Midnight Synthwave Drive',
    artist: 'Retrowave Lab',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-110045.mp3',
    duration: '02:45',
    category: 'synth',
  },
  {
    id: 'track-3',
    title: 'Serene Acoustic Meditation',
    artist: 'Ambient Soundscapes',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_472b5f7e57.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    duration: '03:12',
    category: 'ambient',
  },
  {
    id: 'track-4',
    title: 'Warm Coffeehouse Vibes',
    artist: 'Chillout Lounge',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
    duration: '02:38',
    category: 'lofi',
  },
  {
    id: 'track-5',
    title: 'Deep Focus Ambient Flow',
    artist: 'Mindfulness Beats',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=spirit-blossom-15285.mp3',
    duration: '03:00',
    category: 'ambient',
  },
];

interface BackgroundMusicPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  onTrackChange?: (trackName: string | null) => void;
}

export function BackgroundMusicPlayer({
  isOpen,
  onClose,
  accentColor = 'emerald',
  onTrackChange,
}: BackgroundMusicPlayerProps) {
  const [playlist, setPlaylist] = useState<SongTrack[]>(() => {
    return DEFAULT_TRACKS;
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const synthActiveRef = useRef(false);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Notify parent of track status
  useEffect(() => {
    if (isPlaying && currentTrack) {
      onTrackChange?.(currentTrack.title);
    } else {
      onTrackChange?.(null);
    }
  }, [isPlaying, currentTrack, onTrackChange]);

  // Audio setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoadError(null);
    };

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    const handleError = () => {
      console.warn('Audio playback error on track:', currentTrack?.title);
      setLoadError('Stream unavailable. Click Next or upload a local song.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isLooping, currentTrackIndex, playlist]);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.url;
    audio.load();
    setLoadError(null);

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Auto-play error on track switch:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setLoadError(null);
        })
        .catch((err) => {
          console.warn('Playback error:', err);
          setLoadError('Could not start playback. Click next or upload your own song.');
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    if (playlist.length <= 1) return;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(nextIdx);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const handlePrev = () => {
    if (playlist.length <= 1) return;
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Upload and play local song file
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: SongTrack[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

      newTracks.push({
        id: `local-${Date.now()}-${i}`,
        title: cleanTitle,
        artist: 'My Local Music',
        url: objectUrl,
        isLocal: true,
        category: 'local',
      });
    }

    setPlaylist((prev) => [...newTracks, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveTrack = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.length <= 1) return;

    const targetIdx = playlist.findIndex((t) => t.id === trackId);
    if (targetIdx === -1) return;

    // Revoke object URL if local
    const trackToRemove = playlist[targetIdx];
    if (trackToRemove.isLocal && trackToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToRemove.url);
    }

    const updated = playlist.filter((t) => t.id !== trackId);
    setPlaylist(updated);

    if (targetIdx === currentTrackIndex) {
      setCurrentTrackIndex(targetIdx % updated.length);
    } else if (targetIdx < currentTrackIndex) {
      setCurrentTrackIndex((prev) => prev - 1);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    // Hidden persistent audio element to keep playing in background even when dialog closed
    return (
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        preload="metadata"
        className="hidden"
      />
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        preload="metadata"
        className="hidden"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleLocalFileSelect}
        className="hidden"
      />

      {/* Floating Player Widget */}
      <div
        id="background-music-player"
        className="fixed bottom-20 right-4 sm:right-8 z-40 w-full max-w-sm bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 animate-in slide-in-from-bottom-5 duration-200"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Music className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-neutral-200">
              Background Music
            </span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-full" />
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2/3 delay-75" />
                <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-4/5 delay-150" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPlaylist(!showPlaylist)}
              title="Playlist"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showPlaylist ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand' : 'Minimize'}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Player window (Music continues in background)"
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimized View */}
        {isMinimized ? (
          <div className="px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-neutral-200">
                {currentTrack?.title}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">
                {currentTrack?.artist}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Track Info Card */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 text-emerald-400 relative overflow-hidden shadow-inner">
                <Music className={`w-6 h-6 ${isPlaying ? 'animate-bounce' : ''}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-neutral-100 truncate">
                  {currentTrack?.title || 'No track selected'}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate">
                  {currentTrack?.artist || 'Unknown Artist'}
                </p>
                {currentTrack?.isLocal && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 font-mono">
                    Local MP3
                  </span>
                )}
              </div>
            </div>

            {/* Error Banner if stream blocked */}
            {loadError && (
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center justify-between">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 rounded text-[10px] cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}

            {/* Seekbar and Timing */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Controls */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsShuffle(!isShuffle)}
                title="Shuffle"
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isShuffle ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePrev}
                title="Previous Track"
                className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-play-pause-bg-music"
                onClick={togglePlay}
                className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleNext}
                title="Next Track"
                className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                title={isLooping ? 'Loop: Repeating current track' : 'Loop disabled'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isLooping ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2.5 pt-1 border-t border-neutral-800/80">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[10px] font-mono text-neutral-400 w-7 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Upload Local Audio Button */}
            <div className="pt-1">
              <button
                type="button"
                id="btn-upload-local-song"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-neutral-100 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Play Local Song / MP3 File</span>
              </button>
            </div>

            {/* Playlist Drawer */}
            {showPlaylist && (
              <div className="pt-2 border-t border-neutral-800 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <div className="text-[10px] uppercase font-semibold text-neutral-400 px-1">
                  Playlist ({playlist.length} tracks)
                </div>
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors group ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'hover:bg-neutral-800/80 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-[10px] text-neutral-500 w-4">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{track.title}</div>
                          <div className="text-[10px] opacity-70 truncate">{track.artist}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {track.duration && (
                          <span className="text-[10px] font-mono opacity-60">
                            {track.duration}
                          </span>
                        )}
                        {track.isLocal && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveTrack(track.id, e)}
                            title="Remove from playlist"
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
