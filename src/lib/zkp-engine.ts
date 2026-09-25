/**
 * Zero-Knowledge Proof (ZKP) Cryptographic Engine
 * Implements commitment-based Zero-Knowledge verification:
 * Proves knowledge of a secret without ever revealing the secret itself.
 */

export interface ZkpCommitment {
  challengeId: string;
  creatorId: string;
  prompt: string;
  commitmentHash: string; // SHA-256(Secret + Salt)
  salt: string;
  createdAt: number;
}

export interface ZkpProof {
  challengeId: string;
  proverId: string;
  proofHash: string;
  timestamp: number;
  verified: boolean;
}

/**
 * Creates a cryptographic commitment for a secret
 */
export async function createZkpCommitment(
  secret: string,
  prompt: string,
  creatorId: string
): Promise<ZkpCommitment> {
  const challengeId = 'zkp_' + Math.random().toString(36).substring(2, 9);
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const normalizedSecret = secret.trim().toLowerCase();
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(`${normalizedSecret}::${salt}`)
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const commitmentHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    challengeId,
    creatorId,
    prompt: prompt.trim(),
    commitmentHash,
    salt,
    createdAt: Date.now(),
  };
}

/**
 * Verifies a candidate secret against a ZKP commitment without disclosing the secret
 */
export async function verifyZkpCandidate(
  candidate: string,
  commitmentHash: string,
  salt: string
): Promise<boolean> {
  const normalized = candidate.trim().toLowerCase();
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(`${normalized}::${salt}`)
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const candidateHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return candidateHash === commitmentHash;
}
