/**
 * Acoustic FSK & Ultrasonic Soundwave Steganography Engine
 * Synthesizes and decodes text data into dual-frequency audio chirps using Web Audio API.
 */

export interface ChirpConfig {
  mode: 'audible_fsk' | 'ultrasonic_sonar';
  baseFreq: number;
  freqSpacing: number;
  baudMs: number;
}

export const CHIRP_MODES: Record<string, ChirpConfig> = {
  audible_fsk: {
    mode: 'audible_fsk',
    baseFreq: 1200,
    freqSpacing: 100,
    baudMs: 65,
  },
  ultrasonic_sonar: {
    mode: 'ultrasonic_sonar',
    baseFreq: 17500,
    freqSpacing: 120,
    baudMs: 80,
  },
};

/**
 * Play a modulated chirp in real-time over the speakers / sound device
 */
export function playChirpSound(
  payload: string,
  mode: 'audible_fsk' | 'ultrasonic_sonar' = 'audible_fsk',
  onProgress?: (progress: number, currentFreq: number) => void
): () => void {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const ctx = new AudioContextClass();
  const config = CHIRP_MODES[mode];
  const startTime = ctx.currentTime + 0.1;

  // Header preamble to sync detector: 2 preamble pulses
  const preambleFreqs = [config.baseFreq - 300, config.baseFreq + 1800];
  const charCodes = Array.from(payload).map((c) => c.charCodeAt(0));

  let playCursor = startTime;

  // Master gain node
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
  gainNode.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = mode === 'ultrasonic_sonar' ? 'sine' : 'triangle';
  osc.connect(gainNode);
  osc.start(startTime);

  // Play preambles
  preambleFreqs.forEach((freq) => {
    osc.frequency.setValueAtTime(freq, playCursor);
    gainNode.gain.setValueAtTime(0.3, playCursor);
    playCursor += config.baudMs / 1000;
  });

  // Play each character tone
  charCodes.forEach((code, idx) => {
    // Map char code (32-126) to frequency
    const freq = config.baseFreq + (code % 32) * config.freqSpacing;
    osc.frequency.setValueAtTime(freq, playCursor);
    gainNode.gain.setValueAtTime(0.25, playCursor);
    
    if (onProgress) {
      setTimeout(() => {
        onProgress((idx + 1) / charCodes.length, freq);
      }, (playCursor - startTime) * 1000);
    }

    playCursor += config.baudMs / 1000;
  });

  // Fade out and stop
  gainNode.gain.setValueAtTime(0.001, playCursor);
  osc.stop(playCursor + 0.05);

  setTimeout(() => {
    try {
      ctx.close();
    } catch {}
  }, (playCursor - startTime + 0.2) * 1000);

  return () => {
    try {
      osc.stop();
      ctx.close();
    } catch {}
  };
}

/**
 * Encodes secret text into payload string
 */
export function formatChirpMessage(
  payload: string,
  mode: 'audible_fsk' | 'ultrasonic_sonar' = 'audible_fsk',
  caption?: string
): string {
  const b64 = btoa(unescape(encodeURIComponent(payload)));
  return `SONAR_CHIRP::${mode}::${b64}::${caption ? encodeURIComponent(caption) : ''}`;
}

/**
 * Parses a chirp payload string
 */
export function parseChirpMessage(text: string): {
  mode: 'audible_fsk' | 'ultrasonic_sonar';
  decodedPayload: string;
  caption?: string;
} | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('SONAR_CHIRP::')) return null;

  const parts = trimmed.split('::');
  const mode = (parts[1] as 'audible_fsk' | 'ultrasonic_sonar') || 'audible_fsk';
  let decodedPayload = '';
  try {
    decodedPayload = decodeURIComponent(escape(atob(parts[2])));
  } catch {
    decodedPayload = parts[2] || '';
  }

  const caption = parts[3] ? decodeURIComponent(parts[3]) : undefined;
  return { mode, decodedPayload, caption };
}
