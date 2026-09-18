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

const SERVER_PEPPER = 'PRIVATE_SHIELD_V2_PEPPER_9921_X!';
const SERVER_SESSION_SECRET = process.env.SESSION_SECRET || 'pv_secret_session_key_928174_z!';

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
  return Buffer.from(payload).toString('base64url') + '.' + hmac;
}

/**
 * Cryptographically validates a session token
 */
export function verifyRoomSessionToken(token: string, requiredRoomId?: string): SessionTokenData | null {
  if (!token || typeof token !== 'string') return null;
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

/**
 * Validates or creates a room in Firestore based on user's chosen password.
 * Fail-closed: returns error if database is unavailable.
 */
export async function authenticateOrCreateRoom(
  roomId: string,
  password: string,
  currentActiveParticipants: number
): Promise<{ ok: boolean; error?: string; isNewRoom?: boolean }> {
  const cleanRoom = stripInvisibleChars(roomId || '').trim().toUpperCase();
  if (!isValidRoomId(cleanRoom)) {
    return { ok: false, error: 'Room code must be 3-32 letters, numbers, hyphens, or underscores.' };
  }

  if (!isValidPassword(password)) {
    return { ok: false, error: 'Password must be between 1 and 128 characters.' };
  }

  const db = getDatabase();
  if (!db) {
    // Fail closed: Never grant authentication bypass when database is unavailable (Fix Bug 13)
    return { ok: false, error: 'Database service unavailable. Please try again shortly.' };
  }

  try {
    const roomRef = doc(db, 'rooms', cleanRoom);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      // Room does not exist yet -> creator sets the password using PBKDF2
      const pbkdf2Hash = hashPasswordPBKDF2(password);
      await setDoc(roomRef, {
        roomId: cleanRoom,
        passwordHash: pbkdf2Hash,
        participantCount: 1,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
      return { ok: true, isNewRoom: true };
    }

    const data = snap.data();
    const storedHash = data?.passwordHash;
    const storedCount = data?.participantCount || 0;

    // If room is completely idle (0 active participants in memory and in db),
    // allow the new session creator to claim or update it
    if (currentActiveParticipants === 0 && storedCount === 0) {
      const pbkdf2Hash = hashPasswordPBKDF2(password);
      await updateDoc(roomRef, {
        passwordHash: pbkdf2Hash,
        participantCount: 1,
        lastActiveAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
      return { ok: true, isNewRoom: true };
    }

    // Room is active -> password MUST match using constant-time PBKDF2/legacy verification
    const isValid = verifyPasswordHash(password, storedHash, cleanRoom);
    if (!isValid) {
      return {
        ok: false,
        error: 'Incorrect password for this room. Make sure both of you use the exact same password.'
      };
    }

    return { ok: true };
  } catch (err) {
    console.warn('Error verifying room in Firestore:', err);
    return { ok: false, error: 'Database verification failed. Please try again shortly.' };
  }
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

/**
 * Zero-Knowledge Room Self-Destruct executed privileged on backend (Fix Bug 12)
 */
export async function burnRoomAndDestroyAllDataServer(roomId: string): Promise<{ ok: boolean; deletedCount: number }> {
  const db = getDatabase();
  if (!db) return { ok: false, deletedCount: 0 };
  let count = 0;

  try {
    const cleanRoom = roomId.trim().toUpperCase();
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
        }
        await deleteDoc(d.ref);
        count++;
      }
    }

    await deleteDoc(doc(db, 'rooms', cleanRoom));
    count++;
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
  if (!db) return { ok: false, error: 'Database unavailable' };

  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return { ok: false, error: 'Message not found' };

    const data = snap.data();
    if (data.senderId !== userId) {
      return { ok: false, error: 'Unauthorized: only the message sender can delete this message' };
    }

    if (deleteForEveryone) {
      await updateDoc(msgRef, {
        isDeleted: true,
        deletedForEveryone: true,
        deletedAt: new Date().toISOString(),
        text: '',
        ct: '',
        file: null,
      });
    } else {
      await deleteDoc(msgRef);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Deletion failed' };
  }
}

/**
 * Server-authorized message editing with strict 15-minute window check (Fix Bug 8)
 */
export async function editMessageServer(
  roomId: string,
  messageId: string,
  userId: string,
  newCt: string,
  newIv: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDatabase();
  if (!db) return { ok: false, error: 'Database unavailable' };

  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return { ok: false, error: 'Message not found' };

    const data = snap.data();
    if (data.senderId !== userId) {
      return { ok: false, error: 'Unauthorized: only the original sender can edit this message' };
    }
    if (data.isDeleted) {
      return { ok: false, error: 'Cannot edit a deleted message' };
    }

    const createdTime = data.createdAt ? new Date(data.createdAt).getTime() : data.ts;
    if (Date.now() - createdTime > 15 * 60 * 1000) {
      return { ok: false, error: 'Message editing window expired (15-minute limit)' };
    }

    await updateDoc(msgRef, {
      ct: newCt,
      iv: newIv,
      isEdited: true,
      editedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Edit failed' };
  }
}

/**
 * Server-authorized view-once media burning (Fix Bug 9)
 */
export async function burnMediaServer(
  roomId: string,
  messageId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDatabase();
  if (!db) return { ok: false, error: 'Database unavailable' };

  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return { ok: false, error: 'Message not found' };

    await updateDoc(msgRef, {
      viewed: true,
      burned: true,
      burnedAt: new Date().toISOString(),
      'file.burned': true,
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Burn failed' };
  }
}

/**
 * Persists an end-to-end encrypted payload relayed over WebSocket into Firestore
 * with idempotent deduplication via document ID.
 */
export async function recordEncryptedPayload(
  roomId: string,
  senderId: string,
  payload: any
): Promise<void> {
  const db = getDatabase();
  if (!db || !payload || typeof payload !== 'object') return;

  try {
    const cleanRoom = roomId.trim().toUpperCase();
    if (!isValidRoomId(cleanRoom)) return;

    const docId = payload.messageId || payload.id || (payload.nonce ? `nonce_${String(payload.nonce).replace(/[^a-zA-Z0-9]/g, '')}` : null);
    const messagesCol = collection(db, 'rooms', cleanRoom, 'messages');

    const messageData = {
      roomId: cleanRoom,
      senderId,
      enc: Boolean(payload.enc),
      v: payload.v || 1,
      iv: payload.iv || '',
      ct: payload.ct || '',
      nonce: payload.nonce || '',
      ts: payload.ts || Date.now(),
      createdAt: payload.createdAt || new Date().toISOString(),
      time: payload.time || '',
      isEphemeral: Boolean(payload.isEphemeral),
      ephemeralDuration: payload.ephemeralDuration || 0,
      expiresAt: payload.expiresAt || null,
      serverTimestamp: serverTimestamp(),
    };

    if (docId) {
      await setDoc(doc(db, 'rooms', cleanRoom, 'messages', docId), messageData, { merge: true });
    } else {
      await addDoc(messagesCol, messageData);
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

