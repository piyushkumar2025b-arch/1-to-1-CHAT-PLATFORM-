// Cryptographically Secure Password and Passphrase Generator & Entropy Auditor

const DICEWARE_WORDLIST = [
  'amber', 'anchor', 'arcade', 'arrow', 'atlas', 'beacon', 'breeze', 'bridge',
  'bronze', 'canyon', 'castle', 'cipher', 'clover', 'comet', 'copper', 'cosmos',
  'crater', 'crystal', 'delta', 'drift', 'eagle', 'echo', 'ember', 'falcon',
  'fathom', 'feather', 'flame', 'forest', 'fossil', 'galaxy', 'glacier', 'granite',
  'harbor', 'haven', 'horizon', 'island', 'jasper', 'jungle', 'lagoon', 'lantern',
  'legacy', 'matrix', 'meadow', 'meteor', 'monarch', 'nebula', 'nexus', 'oasis',
  'ocean', 'orbit', 'origin', 'phoenix', 'pinnacle', 'planet', 'portal', 'prism',
  'quantum', 'quasar', 'radiant', 'ravine', 'reef', 'ripple', 'river', 'rocket',
  'shadow', 'shield', 'sierra', 'silver', 'solace', 'solar', 'spark', 'spectrum',
  'spiral', 'summit', 'temple', 'thunder', 'titan', 'topaz', 'torrent', 'tracer',
  'tundra', 'valiant', 'valley', 'vector', 'velvet', 'vessel', 'vortex', 'voyage',
  'walnut', 'whisper', 'zenith', 'zephyr', 'aurora', 'boreal', 'cascade', 'dynamo',
];

export interface PasswordOptions {
  mode: 'password' | 'passphrase' | 'hex' | 'pin';
  length: number; // For password length (8-64) or passphrase word count (3-8) or pin digits (4-12)
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean; // 0, O, 1, l, I
  separator: string; // for passphrase: '-', '.', '_', ' '
  capitalizeWords: boolean;
}

export interface EntropyAnalysis {
  bits: number;
  poolSize: number;
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  crackTimeText: string;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function generateSecurePassword(options: PasswordOptions): string {
  if (options.mode === 'passphrase') {
    const words: string[] = [];
    const randomBytes = new Uint32Array(options.length);
    crypto.getRandomValues(randomBytes);

    for (let i = 0; i < options.length; i++) {
      const index = randomBytes[i] % DICEWARE_WORDLIST.length;
      let word = DICEWARE_WORDLIST[index];
      if (options.capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }
    return words.join(options.separator || '-');
  }

  if (options.mode === 'hex') {
    // Length is in bytes: e.g. 16 (128-bit), 32 (256-bit), 64 (512-bit)
    const byteCount = Math.max(8, Math.min(64, options.length));
    const randomBytes = new Uint8Array(byteCount);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  if (options.mode === 'pin') {
    const digitCount = Math.max(4, Math.min(12, options.length));
    const randomBytes = new Uint32Array(digitCount);
    crypto.getRandomValues(randomBytes);
    let pin = '';
    for (let i = 0; i < digitCount; i++) {
      pin += (randomBytes[i] % 10).toString();
    }
    return pin;
  }

  // Regular password mode
  let chars = '';
  const upper = options.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = options.excludeAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  const numbers = options.excludeAmbiguous ? '23456789' : '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (options.includeUppercase) chars += upper;
  if (options.includeLowercase) chars += lower;
  if (options.includeNumbers) chars += numbers;
  if (options.includeSymbols) chars += symbols;

  if (!chars) chars = lower + numbers; // fallback

  const passLength = Math.max(6, Math.min(128, options.length));
  const randomBytes = new Uint32Array(passLength);
  crypto.getRandomValues(randomBytes);

  let result = '';
  for (let i = 0; i < passLength; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

export function analyzeEntropy(text: string): EntropyAnalysis {
  if (!text) {
    return {
      bits: 0,
      poolSize: 0,
      strength: 'very_weak',
      crackTimeText: 'Instant',
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasSymbol: false,
    };
  }

  const hasLower = /[a-z]/.test(text);
  const hasUpper = /[A-Z]/.test(text);
  const hasNumber = /[0-9]/.test(text);
  const hasSymbol = /[^a-zA-Z0-9]/.test(text);

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 33;

  if (poolSize === 0) poolSize = 1;

  // Shannon Entropy: L * log2(poolSize)
  const bits = Math.round(text.length * Math.log2(poolSize));

  let strength: EntropyAnalysis['strength'] = 'very_weak';
  if (bits < 36) strength = 'very_weak';
  else if (bits < 56) strength = 'weak';
  else if (bits < 75) strength = 'moderate';
  else if (bits < 100) strength = 'strong';
  else strength = 'very_strong';

  // Estimate crack time assuming 100 billion guesses per second (GPU cluster)
  // combinations = poolSize ^ length
  // seconds = (poolSize ^ length) / (1e11 * 2) on average
  let crackTimeText = 'Instant';
  if (bits < 32) {
    crackTimeText = '< 1 millisecond';
  } else if (bits < 45) {
    crackTimeText = 'Few seconds';
  } else if (bits < 55) {
    crackTimeText = 'Several hours';
  } else if (bits < 65) {
    crackTimeText = 'Few months';
  } else if (bits < 75) {
    crackTimeText = 'Several decades';
  } else if (bits < 90) {
    crackTimeText = 'Thousands of years';
  } else if (bits < 120) {
    crackTimeText = 'Millions of years';
  } else {
    crackTimeText = 'Billions of years (Quantum/Heat-death resistant)';
  }

  return {
    bits,
    poolSize,
    strength,
    crackTimeText,
    hasLower,
    hasUpper,
    hasNumber,
    hasSymbol,
  };
}
