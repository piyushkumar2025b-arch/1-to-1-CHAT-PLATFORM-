import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { stripInvisibleChars } from './security';

let dbInstance: Firestore | null = null;

export function getDatabase(): Firestore | null {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;

    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(rawConfig);

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    return dbInstance;
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
    return null;
  }
}

// Canonical room ID validation regex (3-32 alphanumeric, dash, underscore)
export const ROOM_ID_REGEX = /^[A-Z0-9_-]{3,32}$/;

export function isValidRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== 'string') return false;
  return ROOM_ID_REGEX.test(roomId);
}

export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 1 && password.length <= 128;
}

const SERVER_PEPPER = process.env.SERVER_PEPPER || 'PRIVATE_SHIELD_V2_PEPPER_9921_X!';
const SERVER_SESSION_SECRET = process.env.SESSION_SECRET || 'pv_secret_session_key_928174_z!';

// In-memory revocation registry for invalidated tokens
const revokedTokens = new Set<string>();
const roomSessionTokens = new Map<string, Set<string>>();

export function registerRoomSessionToken(token: string, roomId: string): void {
  const cleanRoom = roomId.trim().toUpperCase();
  let set = roomSessionTokens.get(cleanRoom);
  if (!set) {
    set = new Set<string>();
    roomSessionTokens.set(cleanRoom, set);
  }
  set.add(token);
}

export function revokeRoomSessionToken(token: string): void {
  if (!token) return;
  revokedTokens.add(token);
  // Cap revoked set size to 10,000 to avoid unbounded memory growth
  if (revokedTokens.size > 10000) {
    const iter = revokedTokens.values();
    for (let i = 0; i < 2000; i++) {
      const next = iter.next();
      if (!next.done) revokedTokens.delete(next.value);
    }
  }
}

export function revokeAllTokensForRoom(roomId: string): void {
  const cleanRoom = roomId.trim().toUpperCase();
  const set = roomSessionTokens.get(cleanRoom);
  if (set) {
    for (const t of set) {
      revokedTokens.add(t);
    }
    roomSessionTokens.delete(cleanRoom);
  }
}

/**
 * Legacy hash function for backward-compatibility with tests
 */
export function hashPassword(password: string, roomId?: string): string {
  const cleanPass = stripInvisibleChars(password || '');
  const cleanRoom = stripInvisibleChars(roomId || '').trim().toUpperCase();
  const payload = cleanRoom ? `${SERVER_PEPPER}::${cleanRoom}::${cleanPass}` : cleanPass;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Strong password hashing using PBKDF2 with unique cryptographic salt
 */
export function hashPasswordPBKDF2(password: string, saltHex?: string): string {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `pbkdf2:100000:${salt}:${hash}`;
}

/**
 * Constant-time comparison for digests and secrets to prevent timing side-channels
 */
export function timingSafeHashEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Constant-time verification of password against stored PBKDF2 or legacy hash
 */
export function verifyPasswordHash(password: string, storedHash: string, roomId: string): boolean {
  if (!storedHash || typeof storedHash !== 'string' || typeof password !== 'string') return false;

  // 1. Check modern PBKDF2 format: pbkdf2:<iterations>:<salt>:<hash>
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || 100000;
      // Guard against attacker-controlled iteration count DoS (BUG-019)
      if (iterations < 10000 || iterations > 500000) {
        return false;
      }
      const salt = parts[2];
      const expected = parts[3];
      const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
      return timingSafeHashEqual(actual, expected);
    }
  }

  // 2. Legacy support: salted SHA-256 with server pepper
  const cleanRoom = stripInvisibleChars(roomId || '').trim().toUpperCase();
  const legacySalted = crypto.createHash('sha256').update(`${SERVER_PEPPER}::${cleanRoom}::${password}`).digest('hex');
  if (timingSafeHashEqual(storedHash, legacySalted)) return true;

  // 3. Legacy support: raw SHA-256
  const legacyRaw = crypto.createHash('sha256').update(password).digest('hex');
  return timingSafeHashEqual(storedHash, legacyRaw);
}

export interface SessionTokenData {
  roomId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Issues an HMAC-SHA256 authenticated short-lived session token
 */
export function createRoomSessionToken(roomId: string, userId: string): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 24 * 60 * 60 * 1000; // 24-hour lifetime
  const payload = JSON.stringify({ roomId, userId, issuedAt, expiresAt });
  const hmac = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64url') + '.' + hmac;
  registerRoomSessionToken(token, roomId);
  return token;
}

/**
 * Cryptographically validates a session token
 */
export function verifyRoomSessionToken(token: string, requiredRoomId?: string): SessionTokenData | null {
  if (!token || typeof token !== 'string') return null;
  // Check revocation registry (BUG-010)
  if (revokedTokens.has(token)) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  try {
    const payloadStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(payloadStr).digest('hex');
    if (!timingSafeHashEqual(parts[1], expectedHmac)) return null;

    const data = JSON.parse(payloadStr) as SessionTokenData;
    if (!data.roomId || !data.userId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    if (requiredRoomId && data.roomId !== requiredRoomId) return null;

    return data;
  } catch {
    return null;
  }
}

export interface RoomRecord {
  roomId: string;
  passwordHash: string;
  participantCount: number;
  createdAt: string;
  lastActiveAt: string;
}

// In-memory mutex per roomId to serialize concurrent first-joins atomically (BUG-008)
const roomAuthLocks = new Map<string, Promise<void>>();
async function withRoomLock<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
  while (roomAuthLocks.has(roomId)) {
    try {
      await roomAuthLocks.get(roomId);
    } catch {}
  }
  let release!: () => void;
  const lockPromise = new Promise<void>((resolve) => { release = resolve; });
  roomAuthLocks.set(roomId, lockPromise);
  try {
    return await fn();
  } finally {
    if (roomAuthLocks.get(roomId) === lockPromise) {
      roomAuthLocks.delete(roomId);
    }
    release();
  }
}

export interface RoomOptions {
  roomType?: 'direct' | 'organization';
  organizationName?: string;
  maxCapacity?: number;
}

/**
 * Validates or creates a room in Firestore based on user's chosen password.
 * Fail-closed: returns error if database is unavailable.
 */
export async function authenticateOrCreateRoom(
  roomId: string,
  password: string,
  currentActiveParticipants: number,
  options?: RoomOptions
): Promise<{
  ok: boolean;
  error?: string;
  isNewRoom?: boolean;
  roomType?: 'direct' | 'organization';
  organizationName?: string;
  maxCapacity?: number;
}> {
  const cleanRoom = stripInvisibleChars(roomId || '').trim().toUpperCase();
  if (!isValidRoomId(cleanRoom)) {
    return { ok: false, error: 'Room code must be 3-32 letters, numbers, hyphens, or underscores.' };
  }

  if (!isValidPassword(password)) {
    return { ok: false, error: 'Password must be between 1 and 128 characters.' };
  }

  return withRoomLock(cleanRoom, async () => {
    const db = getDatabase();
    if (!db) {
      // Fail closed: Never grant authentication bypass when database is unavailable (Fix Bug 13)
      return { ok: false, error: 'Database service unavailable. Please try again shortly.' };
    }

    try {
      const roomRef = doc(db, 'rooms', cleanRoom);
      const snap = await getDoc(roomRef);

      const targetRoomType = options?.roomType === 'organization' ? 'organization' : 'direct';
      const targetOrgName = (options?.organizationName || '').slice(0, 100);
      const targetMaxCap = targetRoomType === 'organization'
        ? Math.max(2, Math.min(options?.maxCapacity || 50, 100))
        : 2;

      if (!snap.exists()) {
        // Room does not exist yet -> creator sets the password using PBKDF2
        const pbkdf2Hash = hashPasswordPBKDF2(password);
        await setDoc(roomRef, {
          roomId: cleanRoom,
          passwordHash: pbkdf2Hash,
          participantCount: currentActiveParticipants,
          roomType: targetRoomType,
          organizationName: targetOrgName,
          maxCapacity: targetMaxCap,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
        });
        return {
          ok: true,
          isNewRoom: true,
          roomType: targetRoomType,
          organizationName: targetOrgName,
          maxCapacity: targetMaxCap,
        };
      }

      const data = snap.data();
      const storedHash = data?.passwordHash;
      const storedCount = data?.participantCount || 0;
      const storedRoomType: 'direct' | 'organization' = data?.roomType === 'organization' ? 'organization' : 'direct';
      const storedOrgName = data?.organizationName || '';
      const storedMaxCap = typeof data?.maxCapacity === 'number' ? data.maxCapacity : (storedRoomType === 'organization' ? 50 : 2);

      // 1. Verify password using constant-time PBKDF2/legacy verification
      const isValid = verifyPasswordHash(password, storedHash, cleanRoom);
      if (isValid) {
        return {
          ok: true,
          roomType: storedRoomType,
          organizationName: storedOrgName,
          maxCapacity: storedMaxCap,
        };
      }

      // 2. If password does NOT match and room is idle, allow re-claiming by deleting stale doc and re-creating
      if (currentActiveParticipants === 0 && storedCount === 0) {
        const pbkdf2Hash = hashPasswordPBKDF2(password);
        try {
          await deleteDoc(roomRef);
          await setDoc(roomRef, {
            roomId: cleanRoom,
            passwordHash: pbkdf2Hash,
            participantCount: 0,
            roomType: targetRoomType,
            organizationName: targetOrgName,
            maxCapacity: targetMaxCap,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            serverTimestamp: serverTimestamp(),
          });
          return {
            ok: true,
            isNewRoom: true,
            roomType: targetRoomType,
            organizationName: targetOrgName,
            maxCapacity: targetMaxCap,
          };
        } catch {}
      }

      return {
        ok: false,
        error: 'Incorrect password for this room. Make sure everyone uses the exact same password.'
      };
    } catch (err) {
      console.warn('Error verifying room in Firestore:', err);
      return { ok: false, error: 'Database verification failed. Please try again shortly.' };
    }
  });
}

export async function syncRoomState(roomId: string, count: number): Promise<void> {
  const db = getDatabase();
  if (!db) return;

  try {
    const cleanRoom = roomId.trim().toUpperCase();
    if (!isValidRoomId(cleanRoom)) return;
    const roomRef = doc(db, 'rooms', cleanRoom);
    const snap = await getDoc(roomRef);

    if (snap.exists()) {
      await updateDoc(roomRef, {
        participantCount: count,
        lastActiveAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Error recording room state to Firestore:', err);
  }
}

// In-memory cache of recently relayed messages to eliminate race conditions between real-time WebSocket relay and Firestore commits
export const recentMessagesCache = new Map<string, any>();

/**
 * Zero-Knowledge Room Self-Destruct executed privileged on backend (Fix Bug 12)
 */
export async function burnRoomAndDestroyAllDataServer(roomId: string): Promise<{ ok: boolean; deletedCount: number }> {
  const db = getDatabase();
  const cleanRoom = roomId.trim().toUpperCase();

  // Clear in-memory recent messages cache for this room
  for (const key of recentMessagesCache.keys()) {
    if (key.startsWith(`${cleanRoom}::`)) {
      recentMessagesCache.delete(key);
    }
  }

  if (!db) return { ok: false, deletedCount: 0 };
  let count = 0;

  try {
    if (!isValidRoomId(cleanRoom)) return { ok: false, deletedCount: 0 };

    const subcollections = ['messages', 'files', 'calls', 'scratchpad'];
    for (const sub of subcollections) {
      const colRef = collection(db, 'rooms', cleanRoom, sub);
      const snaps = await getDocs(colRef);
      for (const d of snaps.docs) {
        if (sub === 'files') {
          const chunkCol = collection(db, 'rooms', cleanRoom, 'files', d.id, 'chunks');
          const chunkSnaps = await getDocs(chunkCol);
          for (const c of chunkSnaps.docs) {
            await deleteDoc(c.ref);
            count++;
          }
        } else if (sub === 'calls') {
          // Recursively delete WebRTC candidate subcollections (BUG-009)
          const candidateSubs = ['candidates', 'callerCandidates', 'calleeCandidates'];
          for (const cSub of candidateSubs) {
            try {
              const cCol = collection(db, 'rooms', cleanRoom, 'calls', d.id, cSub);
              const cSnaps = await getDocs(cCol);
              for (const cd of cSnaps.docs) {
                await deleteDoc(cd.ref);
                count++;
              }
            } catch {}
          }
        }
        await deleteDoc(d.ref);
        count++;
      }
    }

    await deleteDoc(doc(db, 'rooms', cleanRoom));
    count++;
    revokeAllTokensForRoom(cleanRoom);
    return { ok: true, deletedCount: count };
  } catch (err) {
    console.warn('Error burning room in Firestore:', err);
    return { ok: false, deletedCount: count };
  }
}

/**
 * Server-authorized message deletion / delete for everyone (Fix Bug 6 & 7)
 */
export async function deleteMessageServer(
  roomId: string,
  messageId: string,
  userId: string,
  deleteForEveryone: boolean
): Promise<{ ok: boolean; error?: string }> {
  const db = getDatabase();
  const cleanRoom = roomId.trim().toUpperCase();
  const cacheKey = `${cleanRoom}::${messageId}`;
  let cached = recentMessagesCache.get(cacheKey);

  let msgData: any = cached;
  let snap: any = null;

  if (db) {
    try {
      const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
      snap = await getDoc(msgRef);
      if (snap.exists()) {
        msgData = snap.data();
      } else if (!msgData) {
        // Retry once after 75ms in case asynchronous Firestore write is in-flight
        await new Promise((r) => setTimeout(r, 75));
        snap = await getDoc(msgRef);
        if (snap.exists()) {
          msgData = snap.data();
        }
      }
    } catch {}
  }

  if (!msgData) return { ok: false, error: 'Message not found' };

  if (msgData.senderId !== userId) {
    return { ok: false, error: 'Unauthorized: only the message sender can delete this message' };
  }

  if (deleteForEveryone) {
    if (cached) {
      cached.isDeleted = true;
      cached.deletedForEveryone = true;
      cached.deletedAt = new Date().toISOString();
      cached.text = '';
      cached.ct = '';
      cached.file = null;
      recentMessagesCache.set(cacheKey, cached);
    }
    if (db) {
      try {
        const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
        await setDoc(
          msgRef,
          {
            ...msgData,
            isDeleted: true,
            deletedForEveryone: true,
            deletedAt: new Date().toISOString(),
            text: '',
            ct: '',
            file: null,
          },
          { merge: true }
        );
      } catch (err: any) {
        return { ok: false, error: err.message || 'Deletion failed' };
      }
    }
  } else {
    recentMessagesCache.delete(cacheKey);
    if (db && snap?.exists?.()) {
      try {
        const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
        await deleteDoc(msgRef);
      } catch (err: any) {
        return { ok: false, error: err.message || 'Deletion failed' };
      }
    }
  }

  return { ok: true };
}

/**
 * Server-authorized message editing with strict 15-minute window check (Fix Bug 8 & 13)
 */
export async function editMessageServer(
  roomId: string,
  messageId: string,
  userId: string,
  newCt: string,
  newIv: string,
  newNonce?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDatabase();
  const cleanRoom = roomId.trim().toUpperCase();
  const cacheKey = `${cleanRoom}::${messageId}`;
  let cached = recentMessagesCache.get(cacheKey);

  let msgData: any = cached;
  let snap: any = null;

  if (db) {
    try {
      const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
      snap = await getDoc(msgRef);
      if (snap.exists()) {
        msgData = snap.data();
      } else if (!msgData) {
        // Retry once after 75ms in case asynchronous Firestore write is in-flight
        await new Promise((r) => setTimeout(r, 75));
        snap = await getDoc(msgRef);
        if (snap.exists()) {
          msgData = snap.data();
        }
      }
    } catch {}
  }

  if (!msgData) return { ok: false, error: 'Message not found' };

  if (msgData.senderId !== userId) {
    return { ok: false, error: 'Unauthorized: only the original sender can edit this message' };
  }
  if (msgData.isDeleted) {
    return { ok: false, error: 'Cannot edit a deleted message' };
  }

  const createdTime = msgData.createdAt ? new Date(msgData.createdAt).getTime() : (msgData.ts || Date.now());
  if (Date.now() - createdTime > 15 * 60 * 1000) {
    return { ok: false, error: 'Message editing window expired (15-minute limit)' };
  }

  if (cached) {
    cached.ct = newCt;
    cached.iv = newIv;
    if (newNonce) cached.nonce = newNonce;
    cached.isEdited = true;
    cached.editedAt = new Date().toISOString();
    recentMessagesCache.set(cacheKey, cached);
  }

  if (db) {
    try {
      const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
      const updatePayload: Record<string, any> = {
        ...msgData,
        ct: newCt,
        iv: newIv,
        isEdited: true,
        editedAt: new Date().toISOString(),
      };
      if (newNonce) updatePayload.nonce = newNonce;
      await setDoc(msgRef, updatePayload, { merge: true });
    } catch (err: any) {
      return { ok: false, error: err.message || 'Edit failed' };
    }
  }

  return { ok: true };
}

/**
 * Server-authorized view-once media burning (Fix Bug 9 & 12)
 */
export async function burnMediaServer(
  roomId: string,
  messageId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDatabase();
  const cleanRoom = roomId.trim().toUpperCase();
  const cacheKey = `${cleanRoom}::${messageId}`;
  let cached = recentMessagesCache.get(cacheKey);

  let msgData: any = cached;

  if (db) {
    try {
      const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
      let snap = await getDoc(msgRef);
      if (snap.exists()) {
        msgData = snap.data();
      } else if (!msgData) {
        await new Promise((r) => setTimeout(r, 75));
        snap = await getDoc(msgRef);
        if (snap.exists()) {
          msgData = snap.data();
        }
      }
    } catch {}
  }

  if (!msgData) return { ok: false, error: 'Message not found' };

  if (cached) {
    cached.viewed = true;
    cached.burned = true;
    cached.burnedAt = new Date().toISOString();
    if (cached.file) cached.file.burned = true;
    recentMessagesCache.set(cacheKey, cached);
  }

  if (db) {
    try {
      const msgRef = doc(db, 'rooms', cleanRoom, 'messages', messageId);
      await setDoc(
        msgRef,
        {
          viewed: true,
          burned: true,
          burnedAt: new Date().toISOString(),
          'file.burned': true,
        },
        { merge: true }
      );

      // Destroy underlying file document and chunk records physically (BUG-012)
      const fileId = msgData?.file?.id || msgData?.fileId || msgData?.attachmentId;
      if (fileId && isValidRoomId(cleanRoom)) {
        try {
          const chunkCol = collection(db, 'rooms', cleanRoom, 'files', fileId, 'chunks');
          const chunkSnaps = await getDocs(chunkCol);
          for (const c of chunkSnaps.docs) {
            await deleteDoc(c.ref).catch(() => {});
          }
          await deleteDoc(doc(db, 'rooms', cleanRoom, 'files', fileId)).catch(() => {});
        } catch (err) {
          console.warn('Error purging view-once file chunks:', err);
        }
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Burn failed' };
    }
  }

  return { ok: true };
}

/**
 * Persists an end-to-end encrypted payload relayed over WebSocket into Firestore
 * with idempotent deduplication via document ID and updates in-memory cache.
 */
export async function recordEncryptedPayload(
  roomId: string,
  senderId: string,
  payload: any
): Promise<void> {
  if (!payload || typeof payload !== 'object') return;

  const cleanRoom = roomId.trim().toUpperCase();
  if (!isValidRoomId(cleanRoom)) return;

  const docId = payload.messageId || payload.id || (payload.nonce ? `nonce_${String(payload.nonce).replace(/[^a-zA-Z0-9]/g, '')}` : null);

  const messageData = {
    roomId: cleanRoom,
    senderId,
    enc: Boolean(payload.enc || payload.encryptedData?.enc),
    v: payload.v || payload.encryptedData?.v || 1,
    iv: payload.iv || payload.encryptedData?.iv || '',
    ct: payload.ct || payload.encryptedData?.ct || '',
    nonce: payload.nonce || payload.encryptedData?.nonce || '',
    ts: payload.ts || payload.encryptedData?.ts || Date.now(),
    createdAt: payload.createdAt || new Date().toISOString(),
    time: payload.time || '',
    isEphemeral: Boolean(payload.isEphemeral),
    ephemeralDuration: payload.ephemeralDuration || 0,
    expiresAt: payload.expiresAt || null,
  };

  if (docId) {
    recentMessagesCache.set(`${cleanRoom}::${docId}`, messageData);
  }

  const db = getDatabase();
  if (!db) return;

  try {
    const messagesCol = collection(db, 'rooms', cleanRoom, 'messages');
    if (docId) {
      await setDoc(doc(db, 'rooms', cleanRoom, 'messages', docId), {
        ...messageData,
        serverTimestamp: serverTimestamp(),
      }, { merge: true });
    } else {
      await addDoc(messagesCol, {
        ...messageData,
        serverTimestamp: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Error recording relayed encrypted message to Firestore:', err);
  }
}

/**
 * Encrypts chat messages server-side with AES-256-GCM before writing to Firestore
 * so that absolutely zero plaintext text is ever stored in the database.
 */
export async function recordMessage(
  roomId: string,
  senderId: string,
  senderType: 'user1' | 'user2' | 'system',
  text: string,
  roomPassword?: string
): Promise<void> {
  const db = getDatabase();
  if (!db) return;

  try {
    const cleanRoom = roomId.trim().toUpperCase();
    if (!isValidRoomId(cleanRoom)) return;
    if (!text || typeof text !== 'string' || text.length > 8000) return;

    const messagesCol = collection(db, 'rooms', cleanRoom, 'messages');

    // Generate AES-256-GCM key derived from room password & pepper
    const secretSeed = roomPassword
      ? `${SERVER_PEPPER}::${cleanRoom}::${roomPassword}`
      : `${SERVER_PEPPER}::${cleanRoom}`;
    const key = crypto.createHash('sha256').update(secretSeed).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const nonce = crypto.randomBytes(8).toString('base64');
    cipher.setAAD(Buffer.from(`${cleanRoom}:${nonce}`, 'utf8'));

    const serialized = JSON.stringify({ text, senderType });
    const encryptedBuf = Buffer.concat([
      cipher.update(serialized, 'utf8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    await addDoc(messagesCol, {
      roomId: cleanRoom,
      senderId,
      enc: true,
      v: 1,
      iv: iv.toString('base64'),
      ct: encryptedBuf.toString('base64'),
      nonce,
      ts: Date.now(),
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error recording encrypted message to Firestore:', err);
  }
}

/**
 * Server-authorized retrieval of encrypted room messages (Fix Bug 1)
 */
export async function getRoomMessagesServer(roomId: string): Promise<any[]> {
  const db = getDatabase();
  if (!db) return [];

  const cleanRoom = roomId.trim().toUpperCase();
  if (!isValidRoomId(cleanRoom)) return [];

  try {
    const messagesCol = collection(db, 'rooms', cleanRoom, 'messages');
    const snap = await getDocs(messagesCol);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.warn('Error fetching messages from Firestore:', err);
    return [];
  }
}

