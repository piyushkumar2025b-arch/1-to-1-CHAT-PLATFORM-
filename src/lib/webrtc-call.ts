import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// Play synthesized ringtones and call sound effects with Web Audio API
class CallAudioEffects {
  private ctx: AudioContext | null = null;
  private ringOscillatorInterval: number | null = null;

  getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Pre-unlock audio on user gesture
  unlock() {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // Play outgoing ringing tone (repeating tone bursts)
  startOutgoingRinging() {
    this.stopRinging();
    const playBurst = () => {
      try {
        const ctx = this.getContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
        osc1.type = 'sine';
        osc2.type = 'sine';

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.3);
        osc2.stop(ctx.currentTime + 1.3);
      } catch {
        // Audio playback error or autoplay guard
      }
    };

    playBurst();
    this.ringOscillatorInterval = window.setInterval(playBurst, 3500);
  }

  // Play incoming phone ringing melody
  startIncomingRinging() {
    this.stopRinging();
    const playChime = () => {
      try {
        const ctx = this.getContext();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + idx * 0.15;

          osc.frequency.setValueAtTime(freq, startTime);
          osc.type = 'sine';

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch {
        // ignore audio errors
      }
    };

    playChime();
    this.ringOscillatorInterval = window.setInterval(playChime, 2500);
  }

  // Stop any active ringing tone
  stopRinging() {
    if (this.ringOscillatorInterval) {
      clearInterval(this.ringOscillatorInterval);
      this.ringOscillatorInterval = null;
    }
  }

  // Connected chime
  playConnectedTone() {
    this.stopRinging();
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }

  // Busy tone (repeated short beeps)
  playBusyTone() {
    this.stopRinging();
    try {
      const ctx = this.getContext();
      [0, 0.25, 0.5].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(480, ctx.currentTime + offset);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // End call chime
  playEndCallTone() {
    this.stopRinging();
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }
}

export const callAudioEffects = new CallAudioEffects();

export interface CandidateItem {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface CallCandidatePayload {
  sessionId: string;
  sender: 'caller' | 'callee';
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  createdAt?: number;
}

export interface CallDataFirestore {
  id: string;
  sessionId?: string;
  callerId: string;
  callerName: string;
  callType: 'video' | 'audio';
  status: 'calling' | 'ringing' | 'connecting' | 'answered' | 'connected' | 'ended' | 'declined' | 'busy' | 'missed';
  offer?: { type: string; sdp: string };
  answer?: { type: string; sdp: string };
  videoEnabled?: boolean;
  calleeVideoEnabled?: boolean;
  audioEnabled?: boolean;
  calleeAudioEnabled?: boolean;
  isScreenSharing?: boolean;
  activeScreenSharer?: string;
  callerCandidates?: CandidateItem[];
  calleeCandidates?: CandidateItem[];
  createdAt: string;
  answeredAt?: string;
  endedAt?: string;
}

/**
 * Clean up existing call candidate documents
 */
export async function clearCallCandidates(roomId: string, callId: string = 'current') {
  try {
    const candidatesRef = collection(db, 'rooms', roomId, 'calls', callId, 'candidates');
    const snapCandidates = await getDocs(candidatesRef);
    const deletes = snapCandidates.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
  } catch (err) {
    console.warn('Clear call candidates warning:', err);
  }
}

/**
 * Create a synthetic, animated video track fallback when hardware camera is locked,
 * in use by another tab (multi-tab testing), or unavailable.
 */
export function createSyntheticVideoTrack(userName: string = 'User'): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  function draw() {
    if (!ctx) return;
    frame++;

    // Deep modern gradient background
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    const hue = (frame * 0.4) % 360;
    grad.addColorStop(0, `hsl(${hue}, 40%, 14%)`);
    grad.addColorStop(1, `hsl(${(hue + 50) % 360}, 50%, 20%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Outer pulsating ring
    const pulse = Math.sin(frame * 0.06) * 10;
    ctx.beginPath();
    ctx.arc(320, 200, 75 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();

    // Inner avatar container
    ctx.beginPath();
    ctx.arc(320, 200, 65, 0, Math.PI * 2);
    ctx.fillStyle = '#0f766e';
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();

    // User initials
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userName.slice(0, 2).toUpperCase(), 320, 200);

    // User Name badge
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(userName, 320, 305);

    // Live video feed indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Live Video Feed', 332, 335);

    // Pulsing live green dot
    ctx.beginPath();
    ctx.arc(268, 335, 5, 0, Math.PI * 2);
    ctx.fillStyle = frame % 30 < 20 ? '#10b981' : '#047857';
    ctx.fill();
  }

  draw();
  const animInterval = setInterval(draw, 40); // 25 FPS

  const stream = canvas.captureStream(25);
  const track = stream.getVideoTracks()[0];
  if (track) {
    const origStop = track.stop.bind(track);
    track.stop = () => {
      clearInterval(animInterval);
      origStop();
    };
  }
  return track;
}

/**
 * Acquire user media with graceful fallback (HD -> Basic -> Synthetic Video fallback)
 * Ensures a valid video track is ALWAYS provided when withVideo is requested!
 */
export async function getMediaStream(
  withVideo: boolean = true,
  withAudio: boolean = true,
  fallbackUserName: string = 'User'
): Promise<{ stream: MediaStream; hasVideo: boolean; isSyntheticVideo?: boolean }> {
  let videoTrack: MediaStreamTrack | null = null;
  let audioTrack: MediaStreamTrack | null = null;
  let isSyntheticVideo = false;

  // 1. Try unified acquisition with flexible constraints
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      audio: withAudio ? { echoCancellation: true, noiseSuppression: true } : false,
    });
    return { stream, hasVideo: stream.getVideoTracks().length > 0 };
  } catch (err1) {
    console.warn('[WebRTC] Preferred constraints failed, attempting fallback:', err1);
  }

  // 2. Try simple video constraints
  if (withVideo) {
    try {
      const vidStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoTrack = vidStream.getVideoTracks()[0] || null;
    } catch (vidErr) {
      console.warn('[WebRTC] Hardware camera locked or unavailable, activating synthetic video feed:', vidErr);
      videoTrack = createSyntheticVideoTrack(fallbackUserName);
      isSyntheticVideo = true;
    }
  }

  // 3. Try audio constraints
  if (withAudio) {
    try {
      const audStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      audioTrack = audStream.getAudioTracks()[0] || null;
    } catch {
      try {
        const audStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = audStream.getAudioTracks()[0] || null;
      } catch (audErr) {
        console.warn('[WebRTC] Microphone unavailable:', audErr);
      }
    }
  }

  const tracks: MediaStreamTrack[] = [];
  if (videoTrack) tracks.push(videoTrack);
  if (audioTrack) tracks.push(audioTrack);

  return {
    stream: new MediaStream(tracks),
    hasVideo: !!videoTrack,
    isSyntheticVideo,
  };
}

/**
 * Sanitize candidate item for storing directly in call document arrays
 */
export function sanitizeCandidateItem(candidate: RTCIceCandidate): CandidateItem {
  const candStr = typeof candidate.candidate === 'string' ? candidate.candidate.slice(0, 2048) : '';
  const midStr = candidate.sdpMid !== undefined && candidate.sdpMid !== null ? String(candidate.sdpMid).slice(0, 64) : null;
  const mLineIdx = typeof candidate.sdpMLineIndex === 'number' && Number.isInteger(candidate.sdpMLineIndex) && candidate.sdpMLineIndex >= 0 && candidate.sdpMLineIndex < 1024
    ? candidate.sdpMLineIndex
    : null;

  return {
    candidate: candStr,
    sdpMid: midStr,
    sdpMLineIndex: mLineIdx,
  };
}

/**
 * Sanitize candidate payload for Firestore (ensures NO undefined values)
 */
export function sanitizeCandidate(
  candidate: RTCIceCandidate,
  sessionId: string,
  sender: 'caller' | 'callee'
): CallCandidatePayload {
  const item = sanitizeCandidateItem(candidate);
  return {
    sessionId: (sessionId || '').slice(0, 64),
    sender,
    candidate: item.candidate,
    sdpMid: item.sdpMid,
    sdpMLineIndex: item.sdpMLineIndex,
    createdAt: Date.now(),
  };
}

/**
 * Reliably play audio element and overcome autoplay policy restrictions
 */
export function playAudioSafely(audioElement: HTMLAudioElement | null) {
  if (!audioElement) return;
  const playPromise = audioElement.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Audio autoplay blocked by browser policy. Will unlock on user interaction:', err);
      const unlock = () => {
        audioElement.play().catch(() => {});
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    });
  }
}
