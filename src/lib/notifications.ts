/**
 * Sound and Browser Notifications Engine for Private Chat
 * 
 * Provides:
 * 1. Web Audio API synthesized chimes (zero external MP3/WAV dependencies)
 * 2. Web Notifications API desktop/system alerts when tab is in background
 * 3. Dynamic browser title badge alerts (e.g. "(1) 💬 New Message!")
 * 4. User notification toggle preferences (sound on/off, desktop notifications on/off)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Synthesizes a soft, pleasant, modern incoming message chime using Web Audio API.
 */
export function playIncomingMessageSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    // D5 note gliding to A5
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    osc2.type = 'sine';
    // A5 gliding to D6
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.debug('Error playing audio chime:', err);
  }
}

/**
 * Synthesizes a subtle, soft, tactile swoosh/pop when sending a message.
 */
export function playSentMessageSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.debug('Error playing sent message sound:', err);
  }
}

/**
 * Synthesizes a soft chime when a peer enters the room.
 */
export function playPeerJoinedSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.09); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.18); // G5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.debug('Error playing peer joined sound:', err);
  }
}

/**
 * Synthesizes a gentle tone when a peer disconnects.
 */
export function playPeerLeftSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.2); // A4

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.debug('Error playing peer left sound:', err);
  }
}

/**
 * Title badge flasher for background tabs
 */
let originalTitle = typeof document !== 'undefined' ? document.title : 'Private Chat';
let unreadCount = 0;
let titleInterval: any = null;

export function setOriginalTitle(title: string) {
  originalTitle = title;
}

export function triggerTitleAlert(unreadIncrement = 1): void {
  if (typeof document === 'undefined') return;
  if (!document.hidden) return; // Tab is active, no need to flash title

  unreadCount += unreadIncrement;

  if (!titleInterval) {
    let toggle = false;
    titleInterval = setInterval(() => {
      document.title = toggle
        ? `(${unreadCount}) 💬 New message! • Private Chat`
        : originalTitle;
      toggle = !toggle;
    }, 1200);
  }
}

export function clearTitleAlert(): void {
  unreadCount = 0;
  if (titleInterval) {
    clearInterval(titleInterval);
    titleInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = originalTitle;
  }
}

// Auto-clear title alert when user returns to the tab
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    clearTitleAlert();
  });
}

/**
 * Web Notifications API helpers
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch (e) {
    return 'unsupported';
  }
}

/**
 * Requests real browser notification permission with fallback support for both promise and callback styles.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    // Check if permission already granted
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    // Modern promise-based request with callback fallback
    let result: NotificationPermission;
    if (typeof Notification.requestPermission === 'function') {
      try {
        const promise = Notification.requestPermission();
        if (promise && typeof promise.then === 'function') {
          result = await promise;
        } else {
          result = await new Promise((resolve) => {
            Notification.requestPermission((perm) => resolve(perm));
          });
        }
      } catch (innerErr) {
        // In iframe or restricted sandbox
        console.warn('Notification.requestPermission error (may be iframe restricted):', innerErr);
        result = Notification.permission || 'denied';
      }
    } else {
      result = 'denied';
    }

    return result;
  } catch (e) {
    console.warn('Failed to request notification permission:', e);
    return 'denied';
  }
}

export interface NotificationPayload {
  title?: string;
  body: string;
  tag?: string;
  silent?: boolean;
  icon?: string;
}

/**
 * Dispatches a native desktop/browser notification.
 * @param payload Notification content
 * @param force If true, displays the notification even if the tab currently has focus (crucial for testing and explicit user verification)
 */
export function sendBrowserNotification(payload: NotificationPayload, force = false): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  // Unless forced (e.g. test or high-priority ping), only show when tab is hidden or backgrounded
  if (!force && typeof document !== 'undefined' && !document.hidden) {
    return false;
  }

  try {
    const notif = new Notification(payload.title || 'Private Chat', {
      body: payload.body,
      tag: payload.tag || `private-chat-${Date.now()}`,
      silent: payload.silent !== undefined ? payload.silent : true, // Handled via Web Audio API
      icon: payload.icon || '/favicon.ico',
    });

    notif.onclick = () => {
      try {
        window.focus();
      } catch (e) {}
      clearTitleAlert();
      notif.close();
    };

    // Auto close after 5.5 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch (e) {}
    }, 5500);

    return true;
  } catch (err) {
    console.debug('Browser notification error:', err);
    return false;
  }
}
