// Cryptographic and Cipher Utilities for Private Chat

// Generate SHA-256 Hash using Web Crypto API
export async function generateSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate SHA-512 Hash using Web Crypto API
export async function generateSha512(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-512', enc.encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// AES-GCM 256-bit Key Derivation via PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string with AES-GCM
export async function encryptAesGcm(
  text: string,
  passphrase: string
): Promise<{ payload: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const ivB64 = btoa(String.fromCharCode(...iv));
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

  // Encapsulated single-string packet format
  return {
    payload: `CIPHER_AES::${saltB64}::${ivB64}::${cipherB64}`,
  };
}

// Decrypt string with AES-GCM
export async function decryptAesGcm(
  payload: string,
  passphrase: string
): Promise<string> {
  const parts = payload.trim().split('::');
  if (parts.length !== 4 || parts[0] !== 'CIPHER_AES') {
    throw new Error('Invalid AES payload format. Must start with CIPHER_AES::');
  }

  const [, saltB64, ivB64, cipherB64] = parts;
  const salt = new Uint8Array(
    atob(saltB64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );
  const iv = new Uint8Array(
    atob(ivB64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );
  const cipherBytes = new Uint8Array(
    atob(cipherB64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(decrypted);
}

// Caesar / ROT-N Shift Cipher
export function caesarCipher(text: string, shift: number = 13): string {
  const s = ((shift % 26) + 26) % 26;
  return text
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + s) % 26) + 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + s) % 26) + 97);
      }
      return c;
    })
    .join('');
}

// Text to Binary representation
export function textToBinary(text: string): string {
  return text
    .split('')
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

// Binary back to Text
export function binaryToText(bin: string): string {
  try {
    return bin
      .trim()
      .split(/\s+/)
      .map((b) => String.fromCharCode(parseInt(b, 2)))
      .join('');
  } catch {
    return '[Invalid Binary]';
  }
}

// Morse Code Dictionary
const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
};

const REVERSE_MORSE: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {}
);

export function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => MORSE_MAP[char] || char)
    .join(' ');
}

export function morseToText(morse: string): string {
  return morse
    .trim()
    .split(/\s+/)
    .map((code) => {
      if (code === '/') return ' ';
      return REVERSE_MORSE[code] || '?';
    })
    .join('');
}

// Play audio beeps for Morse code via Web Audio API
export function playMorseAudio(morse: string, onEnded?: () => void): () => void {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const dotDuration = 0.08; // 80ms
  let currentTime = ctx.currentTime + 0.05;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(750, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();

  for (let i = 0; i < morse.length; i++) {
    const sym = morse[i];
    if (sym === '.') {
      gain.gain.setValueAtTime(0.2, currentTime);
      currentTime += dotDuration;
      gain.gain.setValueAtTime(0, currentTime);
      currentTime += dotDuration;
    } else if (sym === '-') {
      gain.gain.setValueAtTime(0.2, currentTime);
      currentTime += dotDuration * 3;
      gain.gain.setValueAtTime(0, currentTime);
      currentTime += dotDuration;
    } else if (sym === ' ') {
      currentTime += dotDuration * 2;
    } else if (sym === '/') {
      currentTime += dotDuration * 5;
    }
  }

  const stopTimer = setTimeout(() => {
    try {
      osc.stop();
      ctx.close();
      if (onEnded) onEnded();
    } catch {
      // ignore
    }
  }, (currentTime - ctx.currentTime) * 1000 + 100);

  return () => {
    clearTimeout(stopTimer);
    try {
      gain.gain.setValueAtTime(0, ctx.currentTime);
      osc.stop();
      ctx.close();
    } catch {
      // ignore
    }
  };
}
