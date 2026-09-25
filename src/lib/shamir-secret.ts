// Shamir's Secret Sharing (SSS) over Galois Field GF(256)
// Allows splitting a secret into N shares such that any K shares (threshold) can reconstruct the secret.

// Exponent and Logarithm tables for GF(256) with primitive polynomial 0x11d (x^8 + x^4 + x^3 + x^2 + 1)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  LOG_TABLE[0] = 0; // undefined in theory, 0 for safety
})();

function gfAdd(a: number, b: number): number {
  return a ^ b;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)');
  if (a === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] - LOG_TABLE[b] + 255) % 255];
}

// Evaluate polynomial at x using Horner's method in GF(256)
function evalPoly(poly: Uint8Array, x: number): number {
  let result = 0;
  for (let i = poly.length - 1; i >= 0; i--) {
    result = gfAdd(gfMul(result, x), poly[i]);
  }
  return result;
}

export interface ShamirShare {
  x: number; // Share index (1 to 255)
  data: Uint8Array;
}

export function splitSecret(
  secretStr: string,
  totalShares: number,
  threshold: number
): ShamirShare[] {
  if (threshold < 2) throw new Error('Threshold must be at least 2');
  if (totalShares < threshold) throw new Error('Total shares must be >= threshold');
  if (totalShares > 255) throw new Error('Maximum shares is 255');

  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secretStr);
  const secretLength = secretBytes.length;

  const shares: ShamirShare[] = [];
  for (let i = 1; i <= totalShares; i++) {
    shares.push({
      x: i,
      data: new Uint8Array(secretLength),
    });
  }

  // Random coefficient buffers
  const poly = new Uint8Array(threshold);

  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    // poly[0] is the secret byte
    poly[0] = secretBytes[byteIdx];
    // Random higher degree coefficients
    const randomBytes = new Uint8Array(threshold - 1);
    crypto.getRandomValues(randomBytes);
    for (let deg = 1; deg < threshold; deg++) {
      poly[deg] = randomBytes[deg - 1];
    }

    // Evaluate for each share x = 1..totalShares
    for (let s = 0; s < totalShares; s++) {
      const x = shares[s].x;
      shares[s].data[byteIdx] = evalPoly(poly, x);
    }
  }

  return shares;
}

// Reconstruct secret using Lagrange Interpolation in GF(256) at x = 0
export function reconstructSecret(shares: ShamirShare[]): string {
  if (shares.length < 2) throw new Error('Need at least 2 shares to reconstruct');

  // Verify shares have matching length
  const length = shares[0].data.length;
  for (const s of shares) {
    if (s.data.length !== length) {
      throw new Error('Share lengths do not match');
    }
  }

  const k = shares.length;
  const result = new Uint8Array(length);

  for (let byteIdx = 0; byteIdx < length; byteIdx++) {
    let secretByte = 0;

    for (let i = 0; i < k; i++) {
      const xi = shares[i].x;
      const yi = shares[i].data[byteIdx];

      // Compute Lagrange basis polynomial L_i(0) = PROD_{j != i} (0 - xj) / (xi - xj) = PROD xj / (xi ^ xj)
      let basis = 1;
      for (let j = 0; j < k; j++) {
        if (i === j) continue;
        const xj = shares[j].x;
        const numerator = xj;
        const denominator = gfAdd(xi, xj);
        basis = gfMul(basis, gfDiv(numerator, denominator));
      }

      secretByte = gfAdd(secretByte, gfMul(yi, basis));
    }

    result[byteIdx] = secretByte;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

// Serialization helpers to and from Base64 string for chat/clipboard
export function encodeShareToString(
  share: ShamirShare,
  threshold: number,
  total: number,
  label: string = 'Master Key'
): string {
  // Format: SHAMIR_SHARE::x::threshold::total::hexData::label
  let hex = '';
  for (let i = 0; i < share.data.length; i++) {
    hex += share.data[i].toString(16).padStart(2, '0');
  }
  const safeLabel = encodeURIComponent(label);
  return `SHAMIR_SHARE::${share.x}::${threshold}::${total}::${hex}::${safeLabel}`;
}

export function parseShareFromString(str: string): {
  share: ShamirShare;
  threshold: number;
  total: number;
  label: string;
} | null {
  const match = str.trim().match(/^SHAMIR_SHARE::(\d+)::(\d+)::(\d+)::([0-9a-fA-F]+)(?:::([^:]*))?$/);
  if (!match) return null;

  const x = parseInt(match[1], 10);
  const threshold = parseInt(match[2], 10);
  const total = parseInt(match[3], 10);
  const hex = match[4];
  const label = match[5] ? decodeURIComponent(match[5]) : 'Secret Share';

  const data = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    data[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  return {
    share: { x, data },
    threshold,
    total,
    label,
  };
}
