/**
 * Cryptographic Notary & Attestation Engine
 * Generates dual SHA-256 & SHA-512 immutable digests, timestamp attestation,
 * and enclave notary certificates.
 */

export interface NotaryCertificate {
  certificateId: string;
  documentTitle: string;
  fileName?: string;
  fileSize?: number;
  sha256: string;
  sha512Prefix: string;
  signerId: string;
  timestamp: number;
  formattedDate: string;
  algorithm: string;
}

/**
 * Computes dual cryptographic digests for a given ArrayBuffer or string
 */
export async function notarizeData(
  data: ArrayBuffer | string,
  title: string,
  signerId: string,
  fileName?: string
): Promise<NotaryCertificate> {
  let buffer: ArrayBuffer;
  let fileSize = 0;

  if (typeof data === 'string') {
    const enc = new TextEncoder();
    const encoded = enc.encode(data);
    buffer = encoded.buffer;
    fileSize = encoded.byteLength;
  } else {
    buffer = data;
    fileSize = data.byteLength;
  }

  // Compute SHA-256
  const sha256Buffer = await crypto.subtle.digest('SHA-256', buffer);
  const sha256 = Array.from(new Uint8Array(sha256Buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Compute SHA-512
  const sha512Buffer = await crypto.subtle.digest('SHA-512', buffer);
  const sha512 = Array.from(new Uint8Array(sha512Buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const now = Date.now();
  const certificateId = 'notary_' + sha256.slice(0, 10) + '_' + Math.random().toString(36).slice(2, 6);

  return {
    certificateId,
    documentTitle: title.trim(),
    fileName,
    fileSize,
    sha256,
    sha512Prefix: sha512.slice(0, 32) + '...',
    signerId,
    timestamp: now,
    formattedDate: new Date(now).toISOString(),
    algorithm: 'NIST SHA-256 / SHA-512 Dual Digest',
  };
}

/**
 * Verifies a candidate file or text against a target SHA-256 digest
 */
export async function verifyHashMatch(
  data: ArrayBuffer | string,
  expectedSha256: string
): Promise<boolean> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    const enc = new TextEncoder();
    buffer = enc.encode(data).buffer;
  } else {
    buffer = data;
  }

  const sha256Buffer = await crypto.subtle.digest('SHA-256', buffer);
  const actualSha256 = Array.from(new Uint8Array(sha256Buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return actualSha256.toLowerCase() === expectedSha256.toLowerCase().trim();
}
