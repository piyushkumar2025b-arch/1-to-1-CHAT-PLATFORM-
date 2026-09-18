import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  X,
  Check,
  Laptop,
  Music,
  Sliders,
  Play,
} from 'lucide-react';
import {
  playIncomingMessageSound,
  playSentMessageSound,
  playPeerJoinedSound,
  requestNotificationPermission,
  getNotificationPermission,
  sendBrowserNotification,
  getAudioSettings,
  saveAudioSettings,
  SoundTheme,
  AudioSettings,
} from '../lib/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  desktopEnabled: boolean;
  setDesktopEnabled: (enabled: boolean) => void;
  accentColor?: string;
}

const SOUND_THEMES: { id: SoundTheme; name: string; desc: string; icon: string }[] = [
  { id: 'crystal', name: 'Crystal Pop', desc: 'Crisp, bright modern ascending droplet', icon: '💧' },
  { id: 'zen', name: 'Zen Chime', desc: 'Warm meditative harmonic overtone', icon: '🎐' },
  { id: 'cyber', name: 'Cyber Pulse', desc: 'Futuristic 8-bit retro synth ping', icon: '⚡' },
  { id: 'minimal', name: 'Minimal Tap', desc: 'Gentle organic soft wood tap', icon: '🪵' },
  { id: 'classic', name: 'Classic Bell', desc: 'Traditional cheerful two-tone chime', icon: '🔔' },
];

export function NotificationSettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  setSoundEnabled,
  desktopEnabled,
  setDesktopEnabled,
  accentColor = '#f59e0b',
}: NotificationSettingsModalProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState(false);
  const [audioSettings, setAudioSettingsState] = useState<AudioSettings>(getAudioSettings);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setAudioSettingsState(getAudioSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    const updated = { ...audioSettings, [key]: value };
    setAudioSettingsState(updated);
    saveAudioSettings(updated);
    if (key === 'soundEnabled') {
      setSoundEnabled(Boolean(value));
    }
  };

  const handleRequestDesktopPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setDesktopEnabled(true);
      sendBrowserNotification(
        {
          title: '🔔 Notifications Activated!',
          body: 'Real-time desktop alerts are active! You will receive alerts when messages arrive.',
        },
        true
      );
    } else {
      setDesktopEnabled(false);
    }
  };

  const handlePreviewTheme = (theme: SoundTheme) => {
    playIncomingMessageSound(theme, audioSettings.volume);
  };

  const handleTestDesktopNotification = () => {
    if (permission !== 'granted') {
      handleRequestDesktopPermission();
      return;
    }
    setTestSent(true);
    sendBrowserNotification(
      {
        title: '🔔 Private Chat Notification',
        body: 'Success! Real-time desktop alerts are fully functioning on your system.',
      },
      true
    );
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="notification-settings-dialog"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-5 text-neutral-100 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-100 flex items-center gap-2">
                Sound & Notifications
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                  Web Audio
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Zero-knowledge synthesized chimes and background alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Sound Switch */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                audioSettings.soundEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
              }`}
            >
              {audioSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                Audio Chimes
                {audioSettings.soundEnabled && (
                  <span className="text-[10px] text-emerald-400 font-mono font-normal">Active</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400">
                Play synthesized tone on incoming & outgoing messages
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !audioSettings.soundEnabled;
              updateSetting('soundEnabled', next);
              if (next) playIncomingMessageSound(audioSettings.soundTheme, audioSettings.volume);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              audioSettings.soundEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                audioSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sound Volume Slider */}
        {audioSettings.soundEnabled && (
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                Chime Volume
              </span>
              <span className="font-mono text-[11px] text-neutral-400">
                {Math.round(audioSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={audioSettings.volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                updateSetting('volume', vol);
              }}
              onMouseUp={() => playIncomingMessageSound(audioSettings.soundTheme, audioSettings.volume)}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        )}

        {/* Sound Themes */}
        {audioSettings.soundEnabled && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Chime Sound Theme
              </span>
              <span className="text-[10px] text-neutral-400">Click preview to test tone</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUND_THEMES.map((theme) => {
                const isSelected = audioSettings.soundTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      updateSetting('soundTheme', theme.id);
                      playIncomingMessageSound(theme.id, audioSettings.volume);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-neutral-950/50 border-neutral-800/80 hover:bg-neutral-800/40 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{theme.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          {theme.name}
                          {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{theme.desc}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTheme(theme.id);
                      }}
                      title="Preview tone"
                      className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fine-Grained Sound Events */}
        {audioSettings.soundEnabled && (
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-neutral-300">Play Sounds For</div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">Incoming Messages</span>
                <input
                  type="checkbox"
                  checked={audioSettings.incomingChime}
                  onChange={(e) => updateSetting('incomingChime', e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">Sent Messages (Swoosh Pop)</span>
                <input
                  type="checkbox"
                  checked={audioSettings.outgoingChime}
                  onChange={(e) => updateSetting('outgoingChime', e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">Peer Join & Departure</span>
                <input
                  type="checkbox"
                  checked={audioSettings.peerChime}
                  onChange={(e) => updateSetting('peerChime', e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Desktop Push Notifications */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  desktopEnabled && permission === 'granted'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                }`}
              >
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  Desktop Notifications
                  {permission === 'granted' && (
                    <span className="text-[10px] text-sky-400 font-mono font-normal">(Permitted)</span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Alerts you when you are in another tab or application
                </div>
              </div>
            </div>

            {permission === 'granted' ? (
              <button
                type="button"
                onClick={() => setDesktopEnabled(!desktopEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  desktopEnabled ? 'bg-sky-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    desktopEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestDesktopPermission}
                className="px-3 py-1.5 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5">
              Desktop notifications are blocked in your browser settings. To enable, click the site settings / lock icon in your URL bar and allow notifications.
            </p>
          )}

          {permission === 'granted' && (
            <button
              type="button"
              onClick={handleTestDesktopNotification}
              disabled={testSent}
              className="w-full mt-2 px-3 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/40 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Notification Sent (Switch tab to inspect)</span>
                </>
              ) : (
                <>
                  <Laptop className="w-3.5 h-3.5 text-sky-400" />
                  <span>Send Test Desktop Alert</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 text-[10px] text-neutral-400 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Audio chimes are synthesized directly in your browser using the Web Audio API. Zero external audio downloads, zero tracking, zero push server leaks.
          </span>
        </div>
      </div>
    </div>
  );
}
