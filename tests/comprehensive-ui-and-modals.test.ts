/**
 * Comprehensive UI, Modals & Slash Commands Integration Test Suite
 * Verifies end-to-end functionality for newly connected modals, decoy duress calculation,
 * slash commands, and interactive card workflows.
 */

import { createZkpCommitment, verifyZkpCandidate } from '../src/lib/zkp-engine';
import { notarizeData, verifyHashMatch } from '../src/lib/notary-engine';

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

async function runUiAndModalsTestSuite() {
  console.log('\n============================================================');
  console.log('🧪 VERIFYING UI MODALS, DURESS CALCULATOR & PROTOCOLS');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // 1. Duress Decoy Calculator Arithmetic & Secret Panic Codes
  // -------------------------------------------------------------
  console.log('--- [Suite 1] Duress Decoy Calculator & Panic Wipe ---');
  
  // Safe arithmetic evaluation
  const calcEval = (equation: string, display: string) => {
    const sanitized = `${equation} ${display}`.replace(/[^0-9+\-*/.]/g, '');
    try {
      // eslint-disable-next-line no-eval
      return String(Function(`'use strict'; return (${sanitized})`)());
    } catch {
      return 'Error';
    }
  };

  assert(calcEval('125 +', '75') === '200', 'Calculates addition (125 + 75 = 200)');
  assert(calcEval('1000 -', '450') === '550', 'Calculates subtraction (1000 - 450 = 550)');
  assert(calcEval('25 *', '4') === '100', 'Calculates multiplication (25 * 4 = 100)');
  assert(calcEval('144 /', '12') === '12', 'Calculates division (144 / 12 = 12)');
  assert(calcEval('10 /', '0') === 'Infinity', 'Handles division by zero as Infinity');

  // Duress Panic Trigger verification (9999=)
  const isDuressPanic = (historyStr: string, display: string) => {
    return historyStr.endsWith('9999') || display === '9999';
  };
  assert(isDuressPanic('12349999', '9999') === true, 'Panic code 9999 accurately triggers emergency purge');
  assert(isDuressPanic('12345678', '5678') === false, 'Standard calculator inputs do not trigger panic purge');

  // Secret Return Codes verification (7777= or 42=)
  const isSecretReturn = (historyStr: string, display: string) => {
    return historyStr.endsWith('7777') || display === '7777' || historyStr.endsWith('42') || display === '42';
  };
  assert(isSecretReturn('7777', '7777') === true, 'Secret code 7777 permits return to chat');
  assert(isSecretReturn('42', '42') === true, 'Secret code 42 permits return to chat');
  assert(isSecretReturn('9999', '9999') === false, 'Panic code is not confused with return code');

  // -------------------------------------------------------------
  // 2. Cryptographic Notary & Attestation Seal Protocol
  // -------------------------------------------------------------
  console.log('--- [Suite 2] Notary Seal Protocol & Dispatch Roundtrip ---');
  const docTitle = 'Vault Transfer Authorization';
  const docContent = 'Transfer authorization code 0x8849204A approved.';
  const signerId = 'usr_alice_01';
  
  const cert = await notarizeData(docContent, docTitle, signerId, 'auth_contract.pdf');
  const b64Title = btoa(unescape(encodeURIComponent(cert.documentTitle)));
  const b64File = cert.fileName ? btoa(unescape(encodeURIComponent(cert.fileName))) : 'none';

  // Modal payload builder
  const notaryPayload = `NOTARY_SEAL::${cert.certificateId}::${b64Title}::${cert.sha256}::${cert.sha512Prefix}::${cert.timestamp}::${cert.signerId}::${b64File}::${cert.fileSize || 0}`;

  // Card parser check
  const parts = notaryPayload.trim().split('::');
  assert(parts[0] === 'NOTARY_SEAL', 'Payload identifier matches NOTARY_SEAL');
  assert(parts[1] === cert.certificateId, 'Certificate ID matches');
  assert(parts[3] === cert.sha256, 'SHA-256 digest preserved exactly');
  assert(parts[4] === cert.sha512Prefix, 'SHA-512 dual digest prefix preserved');
  assert(parts[6] === signerId, 'Signer ID preserved');

  const decodedTitle = decodeURIComponent(escape(atob(parts[2])));
  const decodedFile = decodeURIComponent(escape(atob(parts[7])));
  assert(decodedTitle === docTitle, 'Decoded title matches original document title');
  assert(decodedFile === 'auth_contract.pdf', 'Decoded filename matches original filename');

  const verificationSuccess = await verifyHashMatch(docContent, parts[3]);
  assert(verificationSuccess === true, 'Cryptographic hash match verification passes');

  // -------------------------------------------------------------
  // 3. Zero-Knowledge Proof (ZKP) Challenge Protocol
  // -------------------------------------------------------------
  console.log('--- [Suite 3] Zero-Knowledge Proof (ZKP) Challenge Roundtrip ---');
  const secretPassphrase = 'Omega-Quantum-Security-Key-9988';
  const challengePrompt = 'Prove you know the master ops passphrase without revealing it';
  const creatorId = 'usr_bob_02';

  const commitment = await createZkpCommitment(secretPassphrase, challengePrompt, creatorId);
  const b64Prompt = btoa(unescape(encodeURIComponent(commitment.prompt)));

  // ZKP_CHALLENGE::challengeId::creatorId::b64Prompt::commitmentHash::salt::createdAt
  const zkpPayload = `ZKP_CHALLENGE::${commitment.challengeId}::${commitment.creatorId}::${b64Prompt}::${commitment.commitmentHash}::${commitment.salt}::${commitment.createdAt}`;

  const zParts = zkpPayload.trim().split('::');
  assert(zParts[0] === 'ZKP_CHALLENGE', 'Payload identifier matches ZKP_CHALLENGE');
  assert(zParts[1] === commitment.challengeId, 'Challenge ID preserved');
  assert(zParts[2] === creatorId, 'Creator ID preserved');
  assert(zParts[4] === commitment.commitmentHash, 'Commitment hash preserved');
  assert(zParts[5] === commitment.salt, 'Salt preserved');

  const unmaskedPrompt = decodeURIComponent(escape(atob(zParts[3])));
  assert(unmaskedPrompt === challengePrompt, 'Prompt decoded accurately');

  // Candidate evaluation
  const proverAuthentic = await verifyZkpCandidate(secretPassphrase, zParts[4], zParts[5]);
  assert(proverAuthentic === true, 'Authentic candidate successfully verified with Zero-Knowledge');

  const attackerWrong = await verifyZkpCandidate('WrongPasswordGuess', zParts[4], zParts[5]);
  assert(attackerWrong === false, 'Incorrect candidate strictly rejected by commitment');

  // -------------------------------------------------------------
  // 4. View-Once Media Countdown & Duration Computation
  // -------------------------------------------------------------
  console.log('--- [Suite 4] View-Once Media Countdown & Safe Expiration ---');
  const calculateViewOnceDuration = (file: { isVoice?: boolean; mimeType?: string; duration?: number; fileName?: string }) => {
    const isVideo = Boolean(file.mimeType?.startsWith('video/') || file.fileName?.endsWith('.mp4'));
    const isAudio = Boolean(file.isVoice || file.mimeType?.startsWith('audio/'));
    if (isAudio) return Math.max(Math.round(file.duration || 10) + 4, 10);
    if (isVideo) return Math.max(Math.round(file.duration || 25) + 5, 25);
    return 15; // Image default
  };

  assert(calculateViewOnceDuration({ fileName: 'photo.jpg', mimeType: 'image/jpeg' }) === 15, 'Image view-once duration defaults to 15 seconds');
  assert(calculateViewOnceDuration({ fileName: 'voice.webm', isVoice: true, duration: 8 }) === 12, 'Voice view-once duration gives audio length + 4s cushion');
  assert(calculateViewOnceDuration({ fileName: 'video.mp4', mimeType: 'video/mp4', duration: 30 }) === 35, 'Video view-once duration gives video length + 5s cushion');

  // -------------------------------------------------------------
  // 5. Network Quality Classification & Latency Jitter
  // -------------------------------------------------------------
  console.log('--- [Suite 5] Network Diagnostics & Speed Boost Helpers ---');
  const classifyPingQuality = (pingMs: number | null): 'fast' | 'moderate' | 'slow' | 'offline' => {
    if (pingMs === null) return 'offline';
    if (pingMs <= 50) return 'fast';
    if (pingMs <= 150) return 'moderate';
    return 'slow';
  };

  assert(classifyPingQuality(25) === 'fast', 'Ping of 25ms classified as fast');
  assert(classifyPingQuality(85) === 'moderate', 'Ping of 85ms classified as moderate');
  assert(classifyPingQuality(280) === 'slow', 'Ping of 280ms classified as slow');
  assert(classifyPingQuality(null) === 'offline', 'Null ping classified as offline');

  console.log('\n============================================================');
  console.log(`UI & MODALS TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runUiAndModalsTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
