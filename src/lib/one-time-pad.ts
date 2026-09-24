/**
 * One-Time Pad (OTP) Cryptographic Engine
 * Implements mathematically unbreakable Information-Theoretic Secrecy (Shannon Theorem).
 */

export interface OtpResult {
  ciphertext: string;
  pad: string;
  fingerprint: string;
  mode: 'xor_hex' | 'modular_alpha';
  steps: {
    charP: string;
    codeP: number;
    charK: string;
    codeK: number;
    charC: string;
    codeC: number;
  }[];
}

/**
 * Generate a cryptographically secure random one-time pad of given length
 */
export function generateRandomPad(length: number, mode: 'xor_hex' | 'modular_alpha'): string {
  if (length <= 0) return '';
  const cryptoObj = window.crypto || (window as any).msCrypto;

  if (mode === 'modular_alpha') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  } else {
    // Hexadecimal pad (each byte represented as 2 hex chars)
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  }
}

/**
 * Calculate SHA-256 fingerprint of a pad for verification without leaking the pad
 */
export async function calculatePadFingerprint(pad: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(pad));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Encrypt plaintext using One-Time Pad
 */
export async function encryptOtp(
  plaintext: string,
  pad: string,
  mode: 'xor_hex' | 'modular_alpha'
): Promise<OtpResult> {
  const steps: OtpResult['steps'] = [];
  const fingerprint = await calculatePadFingerprint(pad);

  if (mode === 'modular_alpha') {
    const cleanPlain = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanPad = pad.toUpperCase().replace(/[^A-Z]/g, '');

    if (cleanPad.length < cleanPlain.length) {
      throw new Error(`One-Time Pad length (${cleanPad.length}) is shorter than message (${cleanPlain.length}). OTP requires Pad >= Message.`);
    }

    let cipher = '';
    for (let i = 0; i < cleanPlain.length; i++) {
      const p = cleanPlain.charCodeAt(i) - 65;
      const k = cleanPad.charCodeAt(i) - 65;
      const c = (p + k) % 26;
      const charC = String.fromCharCode(c + 65);
      cipher += charC;

      steps.push({
        charP: cleanPlain[i],
        codeP: p,
        charK: cleanPad[i],
        codeK: k,
        charC: charC,
        codeC: c,
      });
    }

    return {
      ciphertext: cipher,
      pad: cleanPad.slice(0, cleanPlain.length),
      fingerprint,
      mode,
      steps,
    };
  } else {
    // Binary XOR mode
    const enc = new TextEncoder();
    const plainBytes = enc.encode(plaintext);
    
    // Parse hex pad bytes
    const cleanHex = pad.replace(/[^0-9A-Fa-f]/g, '');
    if (cleanHex.length < plainBytes.length * 2) {
      throw new Error(`Hex One-Time Pad length (${Math.floor(cleanHex.length / 2)} bytes) is shorter than plaintext (${plainBytes.length} bytes).`);
    }

    const padBytes: number[] = [];
    for (let i = 0; i < plainBytes.length * 2; i += 2) {
      padBytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }

    const cipherBytes: number[] = [];
    for (let i = 0; i < plainBytes.length; i++) {
      const p = plainBytes[i];
      const k = padBytes[i];
      const c = p ^ k;
      cipherBytes.push(c);

      steps.push({
        charP: plaintext[i] || ' ',
        codeP: p,
        charK: cleanHex.substr(i * 2, 2),
        codeK: k,
        charC: c.toString(16).padStart(2, '0').toUpperCase(),
        codeC: c,
      });
    }

    const hexCipher = cipherBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('');

    return {
      ciphertext: hexCipher,
      pad: cleanHex.slice(0, plainBytes.length * 2).toUpperCase(),
      fingerprint,
      mode,
      steps,
    };
  }
}

/**
 * Decrypt ciphertext using One-Time Pad
 */
export function decryptOtp(
  ciphertext: string,
  pad: string,
  mode: 'xor_hex' | 'modular_alpha'
): string {
  if (mode === 'modular_alpha') {
    const cleanCipher = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanPad = pad.toUpperCase().replace(/[^A-Z]/g, '');

    if (cleanPad.length < cleanCipher.length) {
      throw new Error(`Pad is too short to decrypt (${cleanPad.length} < ${cleanCipher.length}).`);
    }

    let plain = '';
    for (let i = 0; i < cleanCipher.length; i++) {
      const c = cleanCipher.charCodeAt(i) - 65;
      const k = cleanPad.charCodeAt(i) - 65;
      const p = (c - k + 26) % 26;
      plain += String.fromCharCode(p + 65);
    }
    return plain;
  } else {
    // Binary XOR
    const cleanCipher = ciphertext.replace(/[^0-9A-Fa-f]/g, '');
    const cleanPad = pad.replace(/[^0-9A-Fa-f]/g, '');

    if (cleanCipher.length % 2 !== 0) {
      throw new Error('Invalid hex ciphertext length.');
    }

    const byteLen = cleanCipher.length / 2;
    if (cleanPad.length < cleanCipher.length) {
      throw new Error('Pad is shorter than ciphertext.');
    }

    const bytes: number[] = [];
    for (let i = 0; i < byteLen; i++) {
      const c = parseInt(cleanCipher.substr(i * 2, 2), 16);
      const k = parseInt(cleanPad.substr(i * 2, 2), 16);
      bytes.push(c ^ k);
    }

    const dec = new TextDecoder();
    return dec.decode(new Uint8Array(bytes));
  }
}
