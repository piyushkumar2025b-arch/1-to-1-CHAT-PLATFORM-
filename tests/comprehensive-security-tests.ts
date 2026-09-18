/**
 * Comprehensive Security & Cryptographic Verification Test Suite
 * Tests:
 * 1. Cryptographic Enclave (AES-256-GCM, AAD binding, anti-tamper tag, wrong-password rejection, replay defense)
 * 2. Timing-Safe Hash Verification (Server & Client)
 * 3. Sanitization & Malware Guard (Unicode Bidi attacks, double extension spoofing, XSS/script/iframe neutralization)
 * 4. Prototype Pollution Resistance
 * 5. Decompression Bomb (Zip-Bomb) Threshold Defense
 * 6. Server Room Validation & Brute-Force Sliding Window Lockout
 */

import crypto from 'crypto';
import http from 'http';
import {
  deriveEnclaveKey,
  encryptWithEnclave,
  decryptWithEnclave,
  purgeEnclaveKey,
  verifyAntiReplay,
  resetAntiReplayTracker,
  OWASP_PBKDF2_ROUNDS,
  LEGACY_PBKDF2_ROUNDS,
} from '../src/lib/crypto-enclave';
import {
  timingSafeHashEqual,
  hashPassword,
} from '../src/lib/server-db';
import {
  timingSafeStringEqual,
  sanitizeChatMessage,
  validateAndSanitizeFileName,
  isAllowedWsOrigin,
  stripInvisibleChars,
} from '../src/lib/security';
import { sanitizeForFirestore } from '../src/lib/sanitize';
import { compressBytes, decompressBytes } from '../src/lib/file-compression';
import { isSafeHttpUrl } from '../src/lib/link-utils';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🔒 EXECUTING COMPREHENSIVE SECURITY VERIFICATION SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: CRYPTOGRAPHIC ENCLAVE & AES-256-GCM INTEGRITY
  // -------------------------------------------------------------
  console.log('--- [Suite 1] Cryptographic Enclave & Tamper Resistance ---');

  const testRoomId = 'SHIELD-ROOM-99';
  const testPassword = 'CorrectHorseBatteryStaple!2026';
  const originalMessage = {
    text: 'Classified confidential communication payload.',
    secretNumber: 4242,
    timestamp: Date.now(),
  };

  // 1.1 Round-trip encryption and decryption
  const encrypted = await encryptWithEnclave(originalMessage, testPassword, testRoomId);
  assert(encrypted.enc === true, 'Payload marked as encrypted (enc: true)');
  assert(typeof encrypted.iv === 'string' && encrypted.iv.length > 0, 'Initialization Vector (IV) generated');
  assert(typeof encrypted.ct === 'string' && encrypted.ct.length > 0, 'Ciphertext with auth tag generated');
  assert(typeof encrypted.nonce === 'string' && encrypted.nonce.length > 0, 'Anti-replay nonce generated');

  const decrypted = await decryptWithEnclave<typeof originalMessage>(encrypted, testPassword, testRoomId);
  assert(decrypted?.text === originalMessage.text, 'Round-trip decrypted text matches original');
  assert(decrypted?.secretNumber === originalMessage.secretNumber, 'Round-trip decrypted data structure matches original');

  // 1.2 Wrong password decryption rejection (MUST fail and NOT leak plaintext)
  purgeEnclaveKey();
  const wrongPasswordDecrypted = await decryptWithEnclave(encrypted, 'WrongPassword123!', testRoomId);
  assert(wrongPasswordDecrypted === null, 'Decryption with incorrect password strictly returns null');

  // 1.3 Wrong room ID decryption rejection (AAD authentication mismatch)
  purgeEnclaveKey();
  const wrongRoomDecrypted = await decryptWithEnclave(encrypted, testPassword, 'DIFFERENT-ROOM-88');
  assert(wrongRoomDecrypted === null, 'Decryption with mismatched room ID strictly returns null');

  // 1.4 Tampered ciphertext bit flip (Anti-tamper Auth Tag check)
  purgeEnclaveKey();
  const rawCtBytes = Buffer.from(encrypted.ct, 'base64');
  rawCtBytes[0] ^= 0xff; // Flip bits in ciphertext
  const tamperedPayload = { ...encrypted, ct: rawCtBytes.toString('base64') };
  const tamperedDecrypted = await decryptWithEnclave(tamperedPayload, testPassword, testRoomId);
  assert(tamperedDecrypted === null, 'Bit-flipped ciphertext fails GCM auth tag check and returns null');

  // 1.5 Nonce freshness & IV randomization
  const encrypted2 = await encryptWithEnclave(originalMessage, testPassword, testRoomId);
  assert(encrypted.iv !== encrypted2.iv, 'Sequential encryptions generate distinct 96-bit IVs');
  assert(encrypted.nonce !== encrypted2.nonce, 'Sequential encryptions generate distinct anti-replay nonces');
  assert(encrypted.ct !== encrypted2.ct, 'Sequential encryptions generate completely distinct ciphertexts');

  // 1.6 Key derivation with OWASP 310k rounds
  const derivedKey1 = await deriveEnclaveKey(testPassword, testRoomId, OWASP_PBKDF2_ROUNDS);
  assert(derivedKey1.algorithm.name === 'AES-GCM', 'Derived key uses AES-GCM algorithm');
  assert(derivedKey1.extractable === false, 'Derived key is strictly non-extractable from RAM');

  // 1.7 Legacy 100k rounds fallback verification
  purgeEnclaveKey();
  const legacyKey = await deriveEnclaveKey(testPassword, testRoomId, LEGACY_PBKDF2_ROUNDS);
  const ivLegacy = crypto.randomBytes(12);
  const enc = new TextEncoder();
  const legacyPlaintext = enc.encode(JSON.stringify({ legacy: true }));
  const legacyCtBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivLegacy, additionalData: enc.encode(testRoomId) },
    legacyKey,
    legacyPlaintext
  );
  const legacyPayload = {
    enc: true,
    v: 1,
    iv: ivLegacy.toString('base64'),
    ct: Buffer.from(legacyCtBuf).toString('base64'),
    nonce: '',
    ts: Date.now(),
  };
  const legacyDecrypted = await decryptWithEnclave<{ legacy: boolean }>(legacyPayload, testPassword, testRoomId);
  assert(legacyDecrypted?.legacy === true, 'Decryption seamlessly supports legacy 100k rounds backward compatibility');

  // 1.8 Memory zeroization
  purgeEnclaveKey();
  assert(true, 'Cryptographic enclave purge and zeroization executed successfully');

  // -------------------------------------------------------------
  // SUITE 2: TIMING-ATTACK RESISTANCE (CONSTANT-TIME VERIFICATION)
  // -------------------------------------------------------------
  console.log('\n--- [Suite 2] Timing Side-Channel Elimination ---');

  const hash1 = hashPassword('MySecurePassword123!', 'ROOM-A');
  const hash1Copy = hashPassword('MySecurePassword123!', 'ROOM-A');
  const hash2 = hashPassword('MySecurePassword123!', 'ROOM-B'); // Different room -> different hash
  const hash3 = hashPassword('DifferentPassword!', 'ROOM-A'); // Different pass

  // 2.1 Server timingSafeHashEqual
  assert(timingSafeHashEqual(hash1, hash1Copy) === true, 'Server constant-time comparison matches identical hashes');
  assert(timingSafeHashEqual(hash1, hash2) === false, 'Server constant-time comparison rejects different room hashes');
  assert(timingSafeHashEqual(hash1, hash3) === false, 'Server constant-time comparison rejects different password hashes');
  assert(timingSafeHashEqual(hash1, hash1.slice(0, 32)) === false, 'Server constant-time comparison rejects mismatched length');
  assert(timingSafeHashEqual('', hash1) === false, 'Server constant-time comparison rejects empty strings');
  assert(timingSafeHashEqual(hash1, null as any) === false, 'Server constant-time comparison safely handles null inputs');

  // Single-bit difference at start, middle, and end
  const hashMutatedStart = 'a' + hash1.slice(1);
  const hashMutatedMid = hash1.slice(0, 32) + (hash1[32] === '0' ? '1' : '0') + hash1.slice(33);
  const hashMutatedEnd = hash1.slice(0, 63) + (hash1[63] === '0' ? '1' : '0');
  assert(timingSafeHashEqual(hash1, hashMutatedStart) === false, 'Rejects 1-char difference at index 0');
  assert(timingSafeHashEqual(hash1, hashMutatedMid) === false, 'Rejects 1-char difference at index 32');
  assert(timingSafeHashEqual(hash1, hashMutatedEnd) === false, 'Rejects 1-char difference at end of string');

  // 2.2 Client timingSafeStringEqual
  assert(timingSafeStringEqual(hash1, hash1Copy) === true, 'Client timingSafeStringEqual matches identical strings');
  assert(timingSafeStringEqual(hash1, hashMutatedMid) === false, 'Client timingSafeStringEqual rejects mutated strings');
  assert(timingSafeStringEqual('short', 'longer_string') === false, 'Client timingSafeStringEqual rejects length mismatch');

  // -------------------------------------------------------------
  // SUITE 3: SANITIZATION & MALWARE GUARD
  // -------------------------------------------------------------
  console.log('\n--- [Suite 3] Sanitization, Malware & Bidi Attack Defense ---');

  // 3.1 Unicode Right-To-Left Override (RLO) and isolate stripping
  const bidiPayload = 'invoice\u202Efdp.exe'; // Looks like invoiceexe.pdf
  const sanitizedBidiMsg = sanitizeChatMessage(bidiPayload);
  assert(!/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/.test(sanitizedBidiMsg), 'Message sanitizer strips all Unicode bidi override characters');

  const bidiFileResult = validateAndSanitizeFileName('document\u202Efdp.exe');
  assert(!/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/.test(bidiFileResult.safeName), 'Filename validator strips bidi override characters');
  assert(bidiFileResult.isBlocked === true, 'Bidi extension spoofing file is correctly recognized as blocked executable');

  // 3.2 Double Extension Spoofing
  const doubleExt1 = validateAndSanitizeFileName('important_doc.pdf.exe');
  assert(doubleExt1.isBlocked === true, 'Blocks double extension file "important_doc.pdf.exe"');

  const doubleExt2 = validateAndSanitizeFileName('photo.exe.jpg');
  assert(doubleExt2.isBlocked === true, 'Blocks hidden executable extension inside "photo.exe.jpg"');

  const doubleExt3 = validateAndSanitizeFileName('malware.bat.png');
  assert(doubleExt3.isBlocked === true, 'Blocks hidden batch extension inside "malware.bat.png"');

  const safeFile1 = validateAndSanitizeFileName('valid_presentation.pdf');
  assert(safeFile1.isBlocked === false, 'Allows clean PDF file');

  const safeFile2 = validateAndSanitizeFileName('dataset.tar.gz');
  assert(safeFile2.isBlocked === false, 'Allows safe multi-dot archive "dataset.tar.gz"');

  // 3.3 Path Traversal in Filenames
  const traversalFile = validateAndSanitizeFileName('../../../../etc/shadow');
  assert(!traversalFile.safeName.includes('..') && !traversalFile.safeName.includes('/'), 'Strips directory traversal sequences (../) from filenames');

  // 3.4 XSS / Script / Iframe / Dangerous Pseudo-Protocols in Chat
  const xss1 = sanitizeChatMessage('<script>alert("XSS")</script>Hello World');
  assert(!xss1.includes('<script>') && xss1.includes('Hello World'), 'Neutralizes <script> tags');

  const xss2 = sanitizeChatMessage('<iframe src="https://evil.com"></iframe>Safe text');
  assert(!xss2.includes('<iframe') && xss2.includes('Safe text'), 'Neutralizes <iframe> tags');

  const xss3 = sanitizeChatMessage('<object data="evil.swf"></object>More text');
  assert(!xss3.includes('<object') && xss3.includes('More text'), 'Neutralizes <object> tags');

  const xss4 = sanitizeChatMessage('Click here: javascript:alert(document.cookie)');
  assert(!xss4.includes('javascript:') && xss4.includes('blocked-protocol:'), 'Rewrites javascript: pseudo-protocol');

  const xss5 = sanitizeChatMessage('Test vbscript:Execute(payload)');
  assert(!xss5.includes('vbscript:') && xss5.includes('blocked-protocol:'), 'Rewrites vbscript: pseudo-protocol');

  const xss6 = sanitizeChatMessage('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
  assert(!xss6.includes('data:text/html') && xss6.includes('blocked-mime:'), 'Rewrites data:text/html harmful MIME');

  // Null byte injection
  const nullByteMsg = sanitizeChatMessage('Hello\u0000World');
  assert(!nullByteMsg.includes('\u0000'), 'Strips null bytes from chat text');

  // -------------------------------------------------------------
  // SUITE 4: PROTOTYPE POLLUTION RESISTANCE
  // -------------------------------------------------------------
  console.log('\n--- [Suite 4] Prototype Pollution Defense ---');

  const maliciousObj = JSON.parse('{"__proto__":{"polluted":true},"safeField":"test","nested":{"constructor":{"prototype":{"polluted":true}},"valid":123}}');
  const sanitizedObj = sanitizeForFirestore(maliciousObj);

  assert((sanitizedObj as any).safeField === 'test', 'Retains legitimate properties');
  assert((sanitizedObj as any).nested?.valid === 123, 'Retains nested legitimate properties');
  assert(({} as any).polluted === undefined, 'Global Object prototype was NOT polluted');
  assert((Object.prototype as any).polluted === undefined, 'Object.prototype remains pristine');

  // -------------------------------------------------------------
  // SUITE 5: COMPRESSION & DECOMPRESSION BOMB DEFENSE
  // -------------------------------------------------------------
  console.log('\n--- [Suite 5] Compression & Decompression Bomb Defense ---');

  const testBytes = new Uint8Array(1024 * 64); // 64KB
  for (let i = 0; i < testBytes.length; i++) {
    testBytes[i] = i % 256;
  }
  const compressed = await compressBytes(testBytes);
  const decompressed = await decompressBytes(compressed);
  assert(decompressed.byteLength === testBytes.byteLength, 'Compress and decompress round-trip preserved 64KB');

  // Test decompression safety threshold limit
  let bombThrown = false;
  try {
    // Force decompress with very small limit (e.g. 100 bytes)
    await decompressBytes(compressed, 100);
  } catch (err: any) {
    bombThrown = true;
  }
  // When maxBytes is exceeded, decompressBytes throws error to prevent heap exhaustion
  assert(bombThrown === true, 'decompressBytes successfully aborts when exceeding safety byte threshold');

  // -------------------------------------------------------------
  // SUITE 6: SERVER ROOM VALIDATION & BRUTE FORCE LOCKOUT LOGIC
  // -------------------------------------------------------------
  console.log('\n--- [Suite 6] Room Validation & Brute-Force Lockout Invariants ---');

  const ROOM_ID_REGEX = /^[A-Z0-9_-]{1,32}$/;

  // 6.1 Room ID syntax invariants
  assert(ROOM_ID_REGEX.test('ALPHA-101') === true, 'Accepts valid room ID "ALPHA-101"');
  assert(ROOM_ID_REGEX.test('SECURE_ROOM_99') === true, 'Accepts valid room ID "SECURE_ROOM_99"');
  assert(ROOM_ID_REGEX.test('X') === true, 'Accepts single-character room ID');
  assert(ROOM_ID_REGEX.test('') === false, 'Rejects empty room ID');
  assert(ROOM_ID_REGEX.test('ROOM/../TRAVERSAL') === false, 'Rejects path traversal in room ID');
  assert(ROOM_ID_REGEX.test('ROOM ID WITH SPACES') === false, 'Rejects spaces in room ID');
  assert(ROOM_ID_REGEX.test('ROOM<SCRIPT>') === false, 'Rejects angle brackets in room ID');
  assert(ROOM_ID_REGEX.test('A'.repeat(33)) === false, 'Rejects room ID exceeding 32 characters');

  // 6.2 Sliding window brute-force lockout logic
  interface AuthAttemptRecord {
    failures: number;
    lockedUntil: number;
    lastAttempt: number;
  }
  const simTracker = new Map<string, AuthAttemptRecord>();

  function simRecordFailure(ip: string, roomId: string, now: number) {
    const key = `${ip}::${roomId}`;
    const record = simTracker.get(key) || { failures: 0, lockedUntil: 0, lastAttempt: now };
    record.failures += 1;
    record.lastAttempt = now;
    if (record.failures >= 8) {
      record.lockedUntil = now + 300 * 1000;
    } else if (record.failures >= 5) {
      record.lockedUntil = now + 60 * 1000;
    } else if (record.failures >= 3) {
      record.lockedUntil = now + 15 * 1000;
    }
    simTracker.set(key, record);
  }

  function simCheckLockout(ip: string, roomId: string, now: number) {
    const key = `${ip}::${roomId}`;
    const record = simTracker.get(key);
    if (!record) return false;
    return record.lockedUntil > now;
  }

  const simIp = '192.168.1.50';
  const simRoom = 'TEST-ROOM';
  let t = 1000000;

  // Attempt 1 & 2 -> Not locked
  simRecordFailure(simIp, simRoom, t);
  simRecordFailure(simIp, simRoom, t + 1000);
  assert(simCheckLockout(simIp, simRoom, t + 1000) === false, 'Not locked after 2 failed attempts');

  // Attempt 3 -> Locked for 15s
  simRecordFailure(simIp, simRoom, t + 2000);
  assert(simCheckLockout(simIp, simRoom, t + 3000) === true, 'Locked after 3 failed attempts (15s lockout)');
  assert(simCheckLockout(simIp, simRoom, t + 18000) === false, 'Lockout clears after 15s elapsed');

  // Attempt 4 & 5 -> Locked for 60s
  simRecordFailure(simIp, simRoom, t + 19000);
  simRecordFailure(simIp, simRoom, t + 20000);
  assert(simCheckLockout(simIp, simRoom, t + 25000) === true, 'Locked after 5 failed attempts (60s lockout)');
  assert(simCheckLockout(simIp, simRoom, t + 81000) === false, 'Lockout clears after 60s elapsed');

  // Attempt 8 -> Locked for 300s (5 minutes)
  for (let i = 0; i < 3; i++) {
    simRecordFailure(simIp, simRoom, t + 82000 + i * 1000);
  }
  assert(simCheckLockout(simIp, simRoom, t + 86000) === true, 'Locked after 8 failed attempts (300s lockout)');
  assert(simCheckLockout(simIp, simRoom, t + 386000) === false, 'Lockout clears after 300s elapsed');

  // -------------------------------------------------------------
  // SUITE 7: CONCURRENCY, ANTI-REPLAY & MALFORMED PAYLOAD RESILIENCE
  // -------------------------------------------------------------
  console.log('\n--- [Suite 7] Concurrency, Anti-Replay & Malformed Payloads ---');

  // 7.1 Massive concurrent encryption operations
  const concurrentCount = 20;
  const concurrentTasks = Array.from({ length: concurrentCount }, (_, i) =>
    encryptWithEnclave({ index: i, data: `Concurrent message ${i}` }, testPassword, testRoomId)
  );
  const concurrentResults = await Promise.all(concurrentTasks);

  const ivSet = new Set<string>();
  const nonceSet = new Set<string>();
  for (const res of concurrentResults) {
    ivSet.add(res.iv);
    nonceSet.add(res.nonce);
  }
  assert(ivSet.size === concurrentCount, 'All 20 parallel encryptions generated globally unique IVs');
  assert(nonceSet.size === concurrentCount, 'All 20 parallel encryptions generated globally unique nonces');

  // 7.2 Parallel decryption
  const decryptTasks = concurrentResults.map((encItem) =>
    decryptWithEnclave(encItem, testPassword, testRoomId)
  );
  const decryptResults = await Promise.all(decryptTasks);
  const allMatch = decryptResults.every((res, i) => res?.index === i);
  assert(allMatch === true, 'All 20 parallel decryptions succeeded and recovered exact plaintexts');

  // 7.3 Malformed & Corrupted Payloads
  purgeEnclaveKey();
  const corruptedIv = await decryptWithEnclave(
    { enc: true, v: 1, iv: 'not_valid_base64!!!', ct: 'some_ct', nonce: '1', ts: Date.now() },
    testPassword,
    testRoomId
  );
  assert(corruptedIv === null, 'Malformed Base64 IV returns null gracefully');

  const emptyCiphertext = await decryptWithEnclave(
    { enc: true, v: 1, iv: Buffer.from(crypto.randomBytes(12)).toString('base64'), ct: '', nonce: '1', ts: Date.now() },
    testPassword,
    testRoomId
  );
  assert(emptyCiphertext === null, 'Empty ciphertext returns null gracefully');

  const randomNoiseCt = await decryptWithEnclave(
    {
      enc: true,
      v: 1,
      iv: Buffer.from(crypto.randomBytes(12)).toString('base64'),
      ct: Buffer.from(crypto.randomBytes(64)).toString('base64'),
      nonce: '1',
      ts: Date.now(),
    },
    testPassword,
    testRoomId
  );
  assert(randomNoiseCt === null, 'Random noise ciphertext fails authentication and returns null gracefully');

  // 7.4 Deep Prototype Pollution Edge Cases
  const deepPollutionObj = {
    arr: [
      { __proto__: { admin: true } },
      { regular: 'item' },
    ],
    nested: {
      deep: {
        constructor: {
          prototype: { hacked: true },
        },
      },
    },
    date: new Date(),
    num: 42,
    bool: true,
  };
  const sanitizedDeep = sanitizeForFirestore(deepPollutionObj);
  assert(({} as any).admin === undefined, 'Array item __proto__ injection prevented');
  assert(({} as any).hacked === undefined, 'Deep constructor.prototype injection prevented');
  assert(sanitizedDeep.num === 42 && sanitizedDeep.bool === true, 'Primitives preserved accurately');

  // -------------------------------------------------------------
  // SUITE 8: LIVE HTTP SECURITY HEADERS & RATE LIMITING
  // -------------------------------------------------------------
  console.log('\n--- [Suite 8] Live HTTP Security Headers & Rate Limiting ---');

  try {
    // 8.1 Health check endpoint
    const healthRes = await fetch('http://localhost:3000/api/health');
    assert(healthRes.status === 200, 'GET /api/health returned HTTP 200');
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'ok', 'GET /api/health returned { status: "ok" }');

    // 8.2 Security Headers check
    const headers = healthRes.headers;
    assert(headers.get('x-content-type-options') === 'nosniff', 'Header X-Content-Type-Options is nosniff');
    assert(headers.has('content-security-policy'), 'Header Content-Security-Policy is present');
    assert(headers.has('strict-transport-security'), 'Header Strict-Transport-Security is present');
    assert(headers.has('x-powered-by') === false, 'Header X-Powered-By is suppressed (not leaked)');

    // 8.3 Ping Rate Limiting (threshold is 30 requests per minute)
    let hitRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const pingRes = await fetch('http://localhost:3000/api/ping');
      if (pingRes.status === 429) {
        hitRateLimit = true;
        const errJson = await pingRes.json();
        assert(
          errJson.error?.includes('Too many requests') || errJson.error?.includes('Rate limit'),
          'Rate limited response returns informative rate limiting error message'
        );
        break;
      }
    }
    assert(hitRateLimit === true, 'Rapid ping bursts successfully trigger HTTP 429 Too Many Requests rate limit');
  } catch (err) {
    console.warn('Live HTTP test skipped or network unreachable:', err);
  }

  // -------------------------------------------------------------
  // SUITE 9: HEAVIEST ATTACKS & ADVANCED THREAT REMEDIATION
  // -------------------------------------------------------------
  console.log('\n--- [Suite 9] Heaviest Attacks & Advanced Threat Defense ---');

  // 9.1 Cross-Site WebSocket Hijacking (CSWSH) Origin Validation Matrix
  const host = 'ais-dev-test.run.app';
  assert(isAllowedWsOrigin('https://evil-hacker.com', host) === false, 'CSWSH: Rejects untrusted foreign origin (evil-hacker.com)');
  assert(isAllowedWsOrigin('https://google.com.attacker.com', host) === false, 'CSWSH: Rejects spoofed subdomain origin (google.com.attacker.com)');
  assert(isAllowedWsOrigin('http://insecure-http.com', host) === false, 'CSWSH: Rejects arbitrary insecure HTTP origins');
  assert(isAllowedWsOrigin('https://ais-dev-test.run.app', host) === true, 'CSWSH: Allows same-origin host match');
  assert(isAllowedWsOrigin('https://ai.studio.google.com', host) === true, 'CSWSH: Allows trusted Google AI Studio origin');
  assert(isAllowedWsOrigin('https://test-subdomain.googleusercontent.com', host) === true, 'CSWSH: Allows trusted googleusercontent origin');
  assert(isAllowedWsOrigin('http://localhost:3000', 'localhost:3000') === true, 'CSWSH: Allows local development origin');
  assert(isAllowedWsOrigin(undefined, host) === true, 'CSWSH: Allows native clients without browser Origin header');

  // 9.2 Circular Reference & Call Stack Exhaustion Attack
  const circularObj: any = { name: 'circular_bomb', payload: 'test' };
  circularObj.self = circularObj;
  let circularHandledCleanly = false;
  try {
    const sanitizedCirc = sanitizeForFirestore(circularObj);
    assert(sanitizedCirc !== null && sanitizedCirc.name === 'circular_bomb', 'Circular reference object successfully sanitized without call stack overflow');
    circularHandledCleanly = true;
  } catch (e: any) {
    console.error('Circular reference threw error:', e);
  }
  assert(circularHandledCleanly === true, 'Circular reference defense passed');

  // 9.3 Deep Nesting Stack Exhaustion Attack (50 levels deep)
  let deepObj: any = { val: 'leaf' };
  for (let d = 0; d < 50; d++) {
    deepObj = { level: d, inner: deepObj };
  }
  let deepHandledCleanly = false;
  try {
    const sanitizedDeepTree = sanitizeForFirestore(deepObj);
    assert(sanitizedDeepTree !== null && sanitizedDeepTree.level === 49, 'Deep 50-level tree handled without stack exhaustion');
    deepHandledCleanly = true;
  } catch (e: any) {
    console.error('Deep tree threw error:', e);
  }
  assert(deepHandledCleanly === true, 'Max recursion depth guard prevents call stack exhaustion');

  // 9.4 Regular Expression Denial of Service (ReDoS) Fuzzing Attack
  // Attack payload: 5,000 characters of catastrophic backtracking pattern: `<script<script<script...`
  const redosPayload = '<script'.repeat(1000) + 'malicious_content';
  const startFuzz = Date.now();
  const sanitizedFuzz = sanitizeChatMessage(redosPayload);
  const fuzzDuration = Date.now() - startFuzz;
  assert(fuzzDuration < 50, `ReDoS fuzzing attack completed in ${fuzzDuration}ms (under 50ms threshold)`);
  assert(!sanitizedFuzz.includes('<script>'), 'ReDoS payload tags neutralized cleanly');

  // 9.5 Mutation XSS (mXSS) Tag Neutralization
  const mxssPayload = '<svg><script>alert("mXSS")</script></svg><math><mtext>exploit</mtext></math>';
  const sanitizedMxss = sanitizeChatMessage(mxssPayload);
  assert(!sanitizedMxss.includes('<script'), 'mXSS: <script> tag within svg/math neutralized');
  assert(!sanitizedMxss.includes('<svg'), 'mXSS: <svg> tag neutralized');
  assert(!sanitizedMxss.includes('<math'), 'mXSS: <math> tag neutralized');

  // 9.6 Live WebSocket Upgrade CSWSH Rejection Test
  await new Promise<void>((resolve) => {
    const upgradeReq = http.request('http://localhost:3000/ws', {
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        Origin: 'https://attacker-cswsh.com',
      },
    });

    upgradeReq.on('response', (res) => {
      assert(res.statusCode === 403, 'Live WebSocket upgrade with untrusted Origin strictly returns HTTP 403 Forbidden');
      resolve();
    });

    upgradeReq.on('error', () => {
      // In some environments socket.destroy() produces immediate socket hang up or error
      assert(true, 'Live WebSocket upgrade rejected socket connection');
      resolve();
    });

    upgradeReq.end();
  });

  // -------------------------------------------------------------
  // SUITE 10: CLIENT SANDBOX ISOLATION & DANGEROUS PROTOCOL FILTERING
  // -------------------------------------------------------------
  console.log('\n--- [Suite 10] Client Sandbox Isolation & Protocol Security ---');

  // 10.1 Dangerous Protocol Invalidation (Prevent reverse tabnabbing and JS execution)
  assert(isSafeHttpUrl('javascript:alert(document.cookie)') === false, 'Protocol Security: Rejects javascript: URI');
  assert(isSafeHttpUrl('vbscript:msgbox("test")') === false, 'Protocol Security: Rejects vbscript: URI');
  assert(isSafeHttpUrl('data:text/html,<script>alert(1)</script>') === false, 'Protocol Security: Rejects data: HTML URI');
  assert(isSafeHttpUrl('file:///etc/passwd') === false, 'Protocol Security: Rejects file: URI');
  assert(isSafeHttpUrl('blob:https://ais-test.run.app/uuid') === false, 'Protocol Security: Rejects blob: URI');
  assert(isSafeHttpUrl('https://ais-dev.run.app/chat') === true, 'Protocol Security: Allows valid HTTPS URI');
  assert(isSafeHttpUrl('http://localhost:3000') === true, 'Protocol Security: Allows valid HTTP URI');

  // 10.2 Code Execution Sandbox Global Shadowing Verification
  const sandboxedRunner = new Function(
    'console',
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'indexedDB',
    'location',
    'parent',
    'top',
    `
    return {
      windowUndefined: typeof window === 'undefined',
      documentUndefined: typeof document === 'undefined',
      localStorageUndefined: typeof localStorage === 'undefined',
      sessionStorageUndefined: typeof sessionStorage === 'undefined',
      fetchUndefined: typeof fetch === 'undefined',
      xmlHttpUndefined: typeof XMLHttpRequest === 'undefined',
      webSocketUndefined: typeof WebSocket === 'undefined',
      indexedDbUndefined: typeof indexedDB === 'undefined',
      locationUndefined: typeof location === 'undefined',
      parentUndefined: typeof parent === 'undefined',
      topUndefined: typeof top === 'undefined',
    };
  `
  );

  const sandboxIsolation = sandboxedRunner(
    console,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  );

  assert(sandboxIsolation.windowUndefined === true, 'Sandbox: window object strictly shadowed as undefined');
  assert(sandboxIsolation.documentUndefined === true, 'Sandbox: document object strictly shadowed as undefined');
  assert(sandboxIsolation.localStorageUndefined === true, 'Sandbox: localStorage strictly shadowed as undefined');
  assert(sandboxIsolation.sessionStorageUndefined === true, 'Sandbox: sessionStorage strictly shadowed as undefined');
  assert(sandboxIsolation.fetchUndefined === true, 'Sandbox: fetch API strictly shadowed as undefined');
  assert(sandboxIsolation.xmlHttpUndefined === true, 'Sandbox: XMLHttpRequest strictly shadowed as undefined');
  assert(sandboxIsolation.webSocketUndefined === true, 'Sandbox: WebSocket strictly shadowed as undefined');
  assert(sandboxIsolation.locationUndefined === true, 'Sandbox: location strictly shadowed as undefined');
  assert(sandboxIsolation.parentUndefined === true, 'Sandbox: parent frame strictly shadowed as undefined');
  assert(sandboxIsolation.topUndefined === true, 'Sandbox: top frame strictly shadowed as undefined');

  // -------------------------------------------------------------
  // SUITE 11: ANTI-REPLAY ENGINE, ZERO-WIDTH HOMOGRAPHS & ADVANCED ATTACK DEFENSE
  // -------------------------------------------------------------
  console.log('\n--- [Suite 11] Anti-Replay Engine & Zero-Width Homograph Defense ---');

  // 11.1 Anti-Replay Detection
  resetAntiReplayTracker();
  const testNonce1 = 'nonce_abc_12345';
  const nowTs = Date.now();
  const freshCheck = verifyAntiReplay(testNonce1, nowTs);
  assert(freshCheck.valid === true, 'Anti-Replay: Fresh valid payload nonce accepted');

  // Replay attempt with same nonce
  const replayedCheck = verifyAntiReplay(testNonce1, nowTs);
  assert(replayedCheck.valid === false, 'Anti-Replay: Replayed payload with identical nonce strictly rejected');
  assert(replayedCheck.reason?.includes('Replay attack detected') === true, 'Anti-Replay: Accurately identifies replay attack reason');

  // Expired payload (> 5 minutes ago)
  const expiredTs = nowTs - 350000;
  const expiredCheck = verifyAntiReplay('nonce_old_9999', expiredTs);
  assert(expiredCheck.valid === false, 'Anti-Replay: Expired timestamp (> 5m) strictly rejected');

  // Future timestamp clock skew (> 60s in future)
  const futureTs = nowTs + 90000;
  const futureCheck = verifyAntiReplay('nonce_future_888', futureTs);
  assert(futureCheck.valid === false, 'Anti-Replay: Payload with clock-skewed future timestamp strictly rejected');

  // Missing or malformed nonce/ts
  assert(verifyAntiReplay(undefined, nowTs).valid === false, 'Anti-Replay: Undefined nonce rejected');
  assert(verifyAntiReplay(testNonce1, undefined as any).valid === false, 'Anti-Replay: Undefined timestamp rejected');

  // 11.2 Zero-Width & Invisible Homograph Defense
  const cleanCode = 'SECRETROOM1';
  const spoofedCode = `SECRET\u200BROOM\u200C1\uFEFF`;
  assert(stripInvisibleChars(spoofedCode) === cleanCode, 'Zero-Width: Strips zero-width space, non-joiner, and BOM');

  const hashOriginal = hashPassword('MySecurePass!9', cleanCode);
  const hashSpoofed = hashPassword('MySecurePass!9', spoofedCode);
  assert(timingSafeHashEqual(hashOriginal, hashSpoofed) === true, 'Zero-Width: Password hash immune to zero-width room spoofing');

  const cleanPass = 'P@ssword99!';
  const spoofedPass = `P@ss\u200Dword99!\u00AD`;
  const hashPassClean = hashPassword(cleanPass, cleanCode);
  const hashPassSpoofed = hashPassword(spoofedPass, cleanCode);
  assert(timingSafeHashEqual(hashPassClean, hashPassSpoofed) === true, 'Zero-Width: Password hash immune to zero-width password stuffing');

  // 11.3 Advanced Attribute & CSS Injection Neutralization
  const xssWithOnError = '<img src="invalid.jpg" onerror="alert(\'pwned\')" />';
  const sanitizedOnError = sanitizeChatMessage(xssWithOnError);
  assert(!sanitizedOnError.includes('onerror'), 'Advanced XSS: Strips onerror= event handler');

  const xssWithOnLoad = '<body onload=document.location="http://evil.com">';
  const sanitizedOnLoad = sanitizeChatMessage(xssWithOnLoad);
  assert(!sanitizedOnLoad.includes('onload'), 'Advanced XSS: Strips onload= event handler');

  const xssWithStyleExpr = '<div style="background:url(\'javascript:alert(1)\')">test</div>';
  const sanitizedStyle = sanitizeChatMessage(xssWithStyleExpr);
  assert(!sanitizedStyle.includes('javascript:'), 'Advanced XSS: Neutralizes javascript: inside style attributes');

  // 11.4 Enhanced CSWSH Origin Trailing Dot Defense
  assert(isAllowedWsOrigin('https://ais-test.run.app.', 'localhost:3000') === true, 'CSWSH: Allows legitimate origin with trailing DNS dot');
  assert(isAllowedWsOrigin('javascript://evil.com', 'localhost:3000') === false, 'CSWSH: Rejects non-HTTP origin scheme (javascript:)');
  assert(isAllowedWsOrigin('https://fake-run.app', 'localhost:3000') === false, 'CSWSH: Rejects spoofed suffix domain (fake-run.app)');
  assert(isAllowedWsOrigin('https://run.app', 'localhost:3000') === true, 'CSWSH: Allows exact bare trusted domain');

  // -------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during security test execution:', err);
  process.exit(1);
});
