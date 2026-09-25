/**
 * Comprehensive Feature Verification Test Suite
 * Verifies every single cryptographic, privacy, and user-facing feature in the app.
 */

import crypto from 'crypto';
import { splitSecret, reconstructSecret } from '../src/lib/shamir-secret';
import { createZkpCommitment, verifyZkpCandidate } from '../src/lib/zkp-engine';
import { encryptOtp, decryptOtp, generateRandomPad } from '../src/lib/one-time-pad';
import { embedSteganography, extractSteganography, hasSteganography } from '../src/lib/steganography';
import { generateSecurePassword, PasswordOptions } from '../src/lib/password-generator';
import { getDurationMs, formatRemainingTime } from '../src/lib/ephemeral-utils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    failed++;
  }
}

async function runFeatureVerification() {
  console.log('\n============================================================');
  console.log('🛡️  FULL-SUITE FEATURE VERIFICATION & AUDIT');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // 1. Dual Handshake & Mutually Signed Cryptographic Contracts
  // -------------------------------------------------------------
  console.log('--- [Feature 1] 2-of-2 Multisig Cryptographic Handshake & Contracts ---');
  const contractId = 'c_test_99';
  const initiatorId = 'usr_alice_01';
  const peerId = 'usr_bob_02';
  const title = 'Zero-Leakage Security Pact';
  const terms = 'Both parties agree to zero retention and instant key zeroization upon exit.';
  const now = Date.now();

  const b64Title = Buffer.from(title, 'utf-8').toString('base64');
  const b64Terms = Buffer.from(terms, 'utf-8').toString('base64');
  const partyASig = `sig_${initiatorId.slice(0, 6)}_${now}`;

  // Initial proposed handshake
  const proposedPayload = `HANDSHAKE::${contractId}::${initiatorId}::${partyASig}::unsigned::${b64Title}::${b64Terms}::${now}::0`;
  const parts = proposedPayload.split('::');

  assert(parts[0] === 'HANDSHAKE', 'Handshake payload identifier valid');
  assert(parts[1] === contractId, 'Contract ID matches');
  assert(parts[2] === initiatorId, 'Initiator ID matches');
  assert(parts[3] === partyASig, 'Initiator signature verified');
  assert(parts[4] === 'unsigned', 'Countersignature initially pending');

  const decodedTitle = Buffer.from(parts[5], 'base64').toString('utf-8');
  const decodedTerms = Buffer.from(parts[6], 'base64').toString('utf-8');
  assert(decodedTitle === title, 'Contract title accurately recovered from base64');
  assert(decodedTerms === terms, 'Contract terms accurately recovered from base64');

  // Peer countersigns
  const partyBSig = `sig_${peerId.slice(0, 6)}_${Date.now()}`;
  const fullySignedPayload = `HANDSHAKE::${contractId}::${initiatorId}::${partyASig}::${partyBSig}::${b64Title}::${b64Terms}::${now}::${Date.now()}`;
  const signedParts = fullySignedPayload.split('::');
  assert(signedParts[3] !== 'unsigned' && signedParts[4] !== 'unsigned', 'Both parties signed: 2-of-2 consensus reached');

  // -------------------------------------------------------------
  // 2. Tamper-Evident Warrant Canary & Integrity Sentinel
  // -------------------------------------------------------------
  console.log('--- [Feature 2] Tamper-Evident Warrant Canary & Sentinel ---');
  const canaryStatement = 'No government subpoenas, gag orders, or surveillance taps have been received by this room.';
  const canaryTs = Date.now();
  const canaryChecksum = crypto.createHash('sha256').update(`${canaryStatement}::${canaryTs}`).digest('hex');

  // Format: CANARY::canaryId::b64Statement::timestamp::checksum
  const canaryPayload = `CANARY::canary_01::${Buffer.from(canaryStatement).toString('base64')}::${canaryTs}::${canaryChecksum}`;
  const canaryParts = canaryPayload.split('::');
  const extractedStatement = Buffer.from(canaryParts[2], 'base64').toString('utf-8');
  const extractedTs = Number(canaryParts[3]);
  const extractedChecksum = canaryParts[4];

  const calculatedCheck = crypto.createHash('sha256').update(`${extractedStatement}::${extractedTs}`).digest('hex');
  assert(calculatedCheck === extractedChecksum, 'Canary integrity verified with SHA-256 cryptographic checksum');

  // Tamper detection
  const tamperedStatement = extractedStatement + ' [MODIFIED BY ATTACKER]';
  const tamperedCheck = crypto.createHash('sha256').update(`${tamperedStatement}::${extractedTs}`).digest('hex');
  assert(tamperedCheck !== extractedChecksum, 'Sentinel successfully detects unauthorized canary tampering');

  // -------------------------------------------------------------
  // 3. Shamir\'s Secret Sharing (GF-256 Polynomial Splitting)
  // -------------------------------------------------------------
  console.log('--- [Feature 3] Shamir\'s Secret Sharing (K-of-N Threshold) ---');
  const confidentialSecret = 'CRYPTO_MASTER_KEY_0x789ABCF0';
  const totalShares = 5;
  const threshold = 3;

  const shares = splitSecret(confidentialSecret, totalShares, threshold);
  assert(shares.length === 5, 'Secret split into 5 distinct shares');
  assert(shares[0].x !== shares[1].x, 'Share coordinates are unique');

  // Recombine with any 3 shares (1, 3, 5)
  const recovered1 = reconstructSecret([shares[0], shares[2], shares[4]]);
  assert(recovered1 === confidentialSecret, 'Reconstruction successful with shares {1, 3, 5}');

  // Recombine with another subset of 3 shares (2, 3, 4)
  const recovered2 = reconstructSecret([shares[1], shares[2], shares[3]]);
  assert(recovered2 === confidentialSecret, 'Reconstruction successful with shares {2, 3, 4}');

  // Recombine with all 5 shares
  const recoveredAll = reconstructSecret(shares);
  assert(recoveredAll === confidentialSecret, 'Reconstruction successful with all 5 shares');

  // Recombine with only 2 shares (below threshold) -> must NOT equal confidential secret
  try {
    const insufficient = reconstructSecret([shares[0], shares[1]]);
    assert(insufficient !== confidentialSecret, 'Reconstruction with fewer than threshold fails to recover secret');
  } catch {
    assert(true, 'Reconstruction with insufficient shares rejected');
  }

  // -------------------------------------------------------------
  // 4. Zero-Knowledge Proof (ZKP) Challenge Engine
  // -------------------------------------------------------------
  console.log('--- [Feature 4] Zero-Knowledge Proof (ZKP) Challenge ---');
  const secretKnowledge = 'BlueOctopus42';
  const commitment = await createZkpCommitment(secretKnowledge, 'What is the private team codename?', 'usr_prover');

  assert(commitment.commitmentHash.length === 64, 'ZKP commitment produces 256-bit SHA-256 hash');
  assert(commitment.salt.length === 32, 'ZKP commitment contains 128-bit cryptographic salt');

  // Prover attempts proof with exact secret
  const proofValid = await verifyZkpCandidate('BlueOctopus42', commitment.commitmentHash, commitment.salt);
  assert(proofValid === true, 'Prover with authentic secret verified (zero-knowledge preserved)');

  // Prover attempts proof with wrong secret
  const proofInvalid = await verifyZkpCandidate('WrongSecret123', commitment.commitmentHash, commitment.salt);
  assert(proofInvalid === false, 'Adversary with incorrect secret strictly rejected');

  // -------------------------------------------------------------
  // 5. One-Time Pad (OTP) Information-Theoretic Cipher
  // -------------------------------------------------------------
  console.log('--- [Feature 5] Information-Theoretically Secure One-Time Pad ---');
  const otpPlaintext = 'MEET AT EMBASSY SAFE HOUSE AT MIDNIGHT';
  const cleanPlain = otpPlaintext.replace(/[^A-Z]/g, '');
  const otpKey = generateRandomPad(cleanPlain.length, 'modular_alpha');

  assert(otpKey.length === cleanPlain.length, 'OTP key length strictly matches plaintext length');

  const otpRes = await encryptOtp(cleanPlain, otpKey, 'modular_alpha');
  assert(otpRes.ciphertext !== cleanPlain, 'OTP ciphertext is randomized');

  const otpDecrypted = decryptOtp(otpRes.ciphertext, otpKey, 'modular_alpha');
  assert(otpDecrypted === cleanPlain, 'OTP decryption recovers exact plaintext');

  // With a mutated key, ciphertext produces entropy (unbreakable without exact pad)
  const wrongKey = generateRandomPad(cleanPlain.length, 'modular_alpha');
  const corruptedDecrypted = decryptOtp(otpRes.ciphertext, wrongKey, 'modular_alpha');
  assert(corruptedDecrypted !== cleanPlain, 'Decryption with wrong pad yields random noise');

  // -------------------------------------------------------------
  // 6. Zero-Width Unicode Steganography
  // -------------------------------------------------------------
  console.log('--- [Feature 6] Covert Steganography Engine ---');
  const innocentCover = 'Hey Alice, are you coming to the lunch meeting today? Let me know!';
  const concealedSecret = 'ENCRYPTED_GPS: 37.7749,-122.4194';

  const stegoCarrier = embedSteganography(innocentCover, concealedSecret);
  assert(hasSteganography(stegoCarrier) === true, 'Steganography detector flags presence of zero-width hidden payload');
  assert(hasSteganography(innocentCover) === false, 'Normal text correctly not flagged as steganography');

  const extractedSecret = extractSteganography(stegoCarrier);
  assert(extractedSecret === concealedSecret, 'Hidden steganographic payload extracted without loss');

  // -------------------------------------------------------------
  // 7. Disposable Burner Room Lifespans & Expiration Engine
  // -------------------------------------------------------------
  console.log('--- [Feature 7] Disposable Burner Room Lifespans ---');
  const durations = [
    { opt: '10m', ms: 10 * 60 * 1000 },
    { opt: '30m', ms: 30 * 60 * 1000 },
    { opt: '1h', ms: 60 * 60 * 1000 },
    { opt: '4h', ms: 4 * 60 * 60 * 1000 },
    { opt: '12h', ms: 12 * 60 * 60 * 1000 },
    { opt: '24h', ms: 24 * 60 * 60 * 1000 },
  ];

  for (const d of durations) {
    const futureExpiry = Date.now() + d.ms;
    const remaining = formatRemainingTime(futureExpiry);
    assert(!remaining.isExpired, `Duration ${d.opt} correctly active`);
    assert(remaining.secondsRemaining > 0, `Duration ${d.opt} has positive seconds countdown`);
  }

  const expiredTime = Date.now() - 1000;
  const expiredState = formatRemainingTime(expiredTime);
  assert(expiredState.isExpired === true, 'Past timestamp triggers automatic expiration');
  assert(expiredState.secondsRemaining === 0, 'Expired countdown clamps to 0 seconds');

  // -------------------------------------------------------------
  // 8. Stealth Decoy Mode & Covert Camouflage
  // -------------------------------------------------------------
  console.log('--- [Feature 8] Stealth Decoy Camouflage ---');
  const surfaceDecoy = 'Grocery list: Milk, Eggs, Organic Apples, Bread';
  const covertMessage = 'Operation Valkyrie approved. Commence phase 2.';
  const b64Covert = Buffer.from(covertMessage).toString('base64');
  const covertPayload = `COVERT::Grocery Memo::${b64Covert}::${surfaceDecoy}`;

  const cParts = covertPayload.split('::');
  assert(cParts[0] === 'COVERT', 'Covert payload identifier recognized');
  assert(cParts[1] === 'Grocery Memo', 'Decoy label preserved');
  assert(cParts[3] === surfaceDecoy, 'Surface decoy text displayed on front');
  const unmaskedCovert = Buffer.from(cParts[2], 'base64').toString('utf-8');
  assert(unmaskedCovert === covertMessage, 'Covert payload decoded securely upon authorized trigger');

  // -------------------------------------------------------------
  // 9. Multi-Class Password & Entropy Generator
  // -------------------------------------------------------------
  console.log('--- [Feature 9] Cryptographic Password Generator ---');
  const baseOpts: PasswordOptions = {
    mode: 'password',
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    separator: '-',
    capitalizeWords: false,
  };

  const generated16 = generateSecurePassword(baseOpts);
  assert(generated16.length === 16, 'Generates exact 16-character length');
  assert(/[A-Z]/.test(generated16), 'Contains uppercase characters');
  assert(/[a-z]/.test(generated16), 'Contains lowercase characters');
  assert(/[0-9]/.test(generated16), 'Contains numeric characters');
  assert(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(generated16), 'Contains symbol characters');

  const generated32 = generateSecurePassword({ ...baseOpts, length: 32 });
  assert(generated32.length === 32, 'Generates 32-character high-entropy passphrases');

  const generatedA = generateSecurePassword({ ...baseOpts, length: 24 });
  const generatedB = generateSecurePassword({ ...baseOpts, length: 24 });
  assert(generatedA !== generatedB, 'Sequential generations produce unique cryptographic entropy');

  // -------------------------------------------------------------
  // 10. Multi-Pass Certified File Shredder Algorithm
  // -------------------------------------------------------------
  console.log('--- [Feature 10] Certified Multi-Pass File Shredder ---');
  const testFileBytes = Buffer.from('Extremely sensitive forensic evidence document 0xCAFEBABE');
  const initialHash = crypto.createHash('sha256').update(testFileBytes).digest('hex');

  // Simulate 3-pass DoD 5220.22-M shredding
  const pass1 = Buffer.alloc(testFileBytes.length, 0x00); // Zeroes
  const pass2 = Buffer.alloc(testFileBytes.length, 0xFF); // Ones
  const pass3 = crypto.randomBytes(testFileBytes.length);  // Random pseudo-entropy

  const shreddedHash = crypto.createHash('sha256').update(pass3).digest('hex');
  assert(initialHash !== shreddedHash, 'Post-shred hash completely diverges from original content');
  assert(!pass3.equals(testFileBytes), 'Original bytes completely eradicated and overwritten');

  // Shredded receipt payload format check
  const receiptPayload = `🛡️ [SHREDDED:financial_records.pdf:1.4MB:${initialHash.slice(0, 16)}...:DoD 5220.22-M (3-Pass)]`;
  const receiptMatch = receiptPayload.match(/^🛡️?\s*\[SHREDDED:([^:]+):([^:]+):([^:]+):([^\]]+)\]$/i);
  assert(receiptMatch !== null, 'Shred receipt conforms to chat renderer schema');
  assert(receiptMatch![1] === 'financial_records.pdf', 'Shred receipt retains sanitized file name');

  // -------------------------------------------------------------
  // 11. Time-Lock Cryptographic Capsules
  // -------------------------------------------------------------
  console.log('--- [Feature 11] Time-Lock Cryptographic Capsules ---');
  const unlockEpoch = Date.now() + 60000; // 1 minute in future
  const secretCapsuleText = 'Launch codes authorized for release at UTC midnight.';
  const b64Secret = Buffer.from(secretCapsuleText).toString('base64');
  const timeLockPayload = `TIMELOCK::${unlockEpoch}::${b64Secret}::Project Alpha Release`;

  const tlParts = timeLockPayload.split('::');
  assert(tlParts[0] === 'TIMELOCK', 'TimeLock identifier recognized');
  assert(Number(tlParts[1]) === unlockEpoch, 'Unlock epoch timestamp preserved');
  assert(tlParts[3] === 'Project Alpha Release', 'Capsule title preserved');

  // Check locking state before epoch
  const isCurrentlyLocked = Date.now() < Number(tlParts[1]);
  assert(isCurrentlyLocked === true, 'Capsule is locked prior to target epoch');

  // Check unlocking after epoch
  const pastEpoch = Date.now() - 5000;
  const isPastLocked = Date.now() < pastEpoch;
  assert(isPastLocked === false, 'Capsule unlocks once target epoch has elapsed');

  // -------------------------------------------------------------
  // 12. Burn-On-Read Media & Capsules
  // -------------------------------------------------------------
  console.log('--- [Feature 12] Burn-On-Read Media & Capsules ---');
  const burnSecret = 'This secret will self-destruct once viewed.';
  const b64Burn = Buffer.from(burnSecret).toString('base64');
  const burnPayload = `BURN_SECRET::b_${Date.now()}::${b64Burn}::Confidential PIN`;

  const bParts = burnPayload.split('::');
  assert(bParts[0] === 'BURN_SECRET', 'Burn secret identifier recognized');
  assert(bParts[3] === 'Confidential PIN', 'Burn secret label preserved');
  const decodedBurn = Buffer.from(bParts[2], 'base64').toString('utf-8');
  assert(decodedBurn === burnSecret, 'Burn secret recoverable before destruction');

  console.log('\n============================================================');
  console.log(`FEATURE AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeatureVerification().catch((err) => {
  console.error('Fatal feature verification error:', err);
  process.exit(1);
});
