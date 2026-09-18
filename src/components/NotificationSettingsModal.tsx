import React from 'react';
import { Bell, BellOff, Volume2, VolumeX, Sparkles, Shield, X, Check, Laptop } from 'lucide-react';
import {
  playIncomingMessageSound,
  playPeerJoinedSound,
  requestNotificationPermission,
  getNotificationPermission,
  sendBrowserNotification,
} from '../lib/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  desktopEnabled: boolean;
  setDesktopEnabled: (enabled: boolean) => void;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  setSoundEnabled,
  desktopEnabled,
  setDesktopEnabled,
}: NotificationSettingsModalProps) {
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestDesktopPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setDesktopEnabled(true);
      sendBrowserNotification({
        title: '🔔 Notifications Activated!',
        body: 'Real-time desktop alerts are active! You will receive alerts when messages arrive.',
      }, true);
    } else {
      setDesktopEnabled(false);
    }
  };

  const handleTestSound = () => {
    playIncomingMessageSound();
  };

  const handleTestPeerSound = () => {
    playPeerJoinedSound();
  };

  const handleTestDesktopNotification = () => {
    if (permission !== 'granted') {
      handleRequestDesktopPermission();
      return;
    }
    setTestSent(true);
    sendBrowserNotification({
      title: '🔔 Private Chat Notification',
      body: 'Success! Real-time desktop alerts are fully functioning on your system.',
    }, true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="notification-settings-dialog"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-6 text-neutral-100 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-100">
                Notification Center
              </h2>
              <p className="text-xs text-neutral-400">
                Manage audio chimes and background desktop alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {/* Sound Notifications Toggle */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  soundEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  Audio Chimes
                  {soundEnabled && (
                    <span className="text-[10px] text-emerald-400 font-normal">(Active)</span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Plays pleasant synthesizer chime on new messages and peer joins
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playIncomingMessageSound();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Desktop Push / Background Notifications */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                      <span className="text-[10px] text-sky-400 font-normal">(Permitted)</span>
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
                  className="px-2.5 py-1 text-[11px] font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>

            {permission === 'denied' && (
              <p className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2">
                Desktop notifications are blocked by your browser settings. To enable, click the lock icon in your browser address bar and allow notifications.
              </p>
            )}
          </div>

          {/* Test Buttons Area */}
          <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestSound}
              className="px-3 py-2 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Message Chime</span>
            </button>

            <button
              type="button"
              onClick={handleTestPeerSound}
              className="px-3 py-2 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Join Chime</span>
            </button>
          </div>

          {permission === 'granted' && (
            <button
              type="button"
              onClick={handleTestDesktopNotification}
              disabled={testSent}
              className="w-full px-3 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/40 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Notification Sent (Switch Tab to View)</span>
                </>
              ) : (
                <>
                  <Laptop className="w-3.5 h-3.5 text-sky-400" />
                  <span>Send Test Desktop Notification</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 text-[10px] text-neutral-500 bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/60">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            Notifications are handled entirely in your local browser. No data is sent to external push servers or third parties.
          </span>
        </div>
      </div>
    </div>
  );
}
