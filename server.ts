import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import compression from 'compression';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  authenticateOrCreateRoom,
  syncRoomState,
  recordEncryptedPayload,
  verifyPasswordHash,
  hashPasswordPBKDF2,
  timingSafeHashEqual,
  isValidRoomId,
  isValidPassword,
  createRoomSessionToken,
  verifyRoomSessionToken,
  burnRoomAndDestroyAllDataServer,
  deleteMessageServer,
  editMessageServer,
  burnMediaServer,
  getRoomMessagesServer,
  ROOM_ID_REGEX,
} from './src/lib/server-db';
import { isAllowedWsOrigin, stripInvisibleChars } from './src/lib/security';

dotenv.config();

const PORT = 3000;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

interface ChatUser {
  id: string;
  ws: WebSocket;
  roomId: string;
  ip: string;
}

interface Room {
  id: string;
  passwordHash: string;
  users: ChatUser[];
}

// Map room strictly by normalized Room ID: string (roomId) -> Room
const rooms = new Map<string, Room>();

// Track concurrent WebSocket connections per IP to prevent socket exhaustion
const ipConnectionCounts = new Map<string, number>();
const MAX_CONCURRENT_WS_PER_IP = 10;

// Track failed authentication attempts per (IP + RoomId) to prevent brute-force attacks
interface AuthAttemptRecord {
  failures: number;
  lockedUntil: number;
  lastAttempt: number;
}
const authAttemptTracker = new Map<string, AuthAttemptRecord>();

function getAuthLockout(ip: string, roomId: string): { isLocked: boolean; remainingSec: number } {
  const key = `${ip}::${roomId}`;
  const record = authAttemptTracker.get(key);
  if (!record) return { isLocked: false, remainingSec: 0 };
  const now = Date.now();
  if (record.lockedUntil > now) {
    return { isLocked: true, remainingSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  return { isLocked: false, remainingSec: 0 };
}

function recordAuthFailure(ip: string, roomId: string): void {
  const key = `${ip}::${roomId}`;
  const now = Date.now();
  const record = authAttemptTracker.get(key) || { failures: 0, lockedUntil: 0, lastAttempt: now };
  record.failures += 1;
  record.lastAttempt = now;
  // Progressive lockout: 3 failures = 15s, 5 failures = 60s, 8+ failures = 300s
  if (record.failures >= 8) {
    record.lockedUntil = now + 300 * 1000;
  } else if (record.failures >= 5) {
    record.lockedUntil = now + 60 * 1000;
  } else if (record.failures >= 3) {
    record.lockedUntil = now + 15 * 1000;
  }
  authAttemptTracker.set(key, record);
}

function clearAuthFailures(ip: string, roomId: string): void {
  const key = `${ip}::${roomId}`;
  authAttemptTracker.delete(key);
}

// Ping rate limiter tracking (IP -> timestamps array)
const pingRequestTracker = new Map<string, number[]>();

function checkPingRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = pingRequestTracker.get(ip) || [];
  const windowStart = now - 10000; // 10 seconds sliding window
  const recent = timestamps.filter((t) => t > windowStart);
  if (recent.length >= 30) {
    return false; // Rate limit exceeded (30 req / 10s)
  }
  recent.push(now);
  pingRequestTracker.set(ip, recent);
  return true;
}

// Anti-replay sliding window tracking per room (Fix Bug 23)
const roomSeenNonces = new Map<string, Map<string, number>>();

function checkAndRecordNonce(roomId: string, nonce: string | undefined, timestamp: number): boolean {
  if (!nonce || typeof nonce !== 'string' || nonce.length > 64) {
    // If no nonce provided on encrypted envelope, reject to enforce anti-replay guarantee
    return false;
  }
  const now = Date.now();
  // Reject timestamps outside 5-minute skew window
  if (Math.abs(now - timestamp) > 300000) {
    return false;
  }
  let nonces = roomSeenNonces.get(roomId);
  if (!nonces) {
    nonces = new Map<string, number>();
    roomSeenNonces.set(roomId, nonces);
  }
  if (nonces.has(nonce)) {
    return false; // Replay attempt detected!
  }
  nonces.set(nonce, now);
  return true;
}

// Strict schema validation for all incoming WebSocket frames (Fix Bug 18)
function validateWebSocketMessage(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Malformed message: frame must be a JSON object.' };
  }
  if (typeof data.type !== 'string') {
    return { valid: false, error: 'Malformed message: missing type field.' };
  }

  const allowedTypes = [
    'auth',
    'ping',
    'encrypted_message',
    'message',
    'typing',
    'read_receipt',
    'reaction',
    'whiteboard',
    'webrtc_signal',
    'ack',
    'delivery_ack'
  ];
  if (!allowedTypes.includes(data.type)) {
    return { valid: false, error: `Invalid message type: ${data.type}` };
  }

  if (data.type === 'auth') {
    if (typeof data.roomId !== 'string' || !isValidRoomId(data.roomId)) {
      return { valid: false, error: 'Room code must be between 3 and 32 alphanumeric characters.' };
    }
    if (typeof data.password !== 'string' || !isValidPassword(data.password)) {
      return { valid: false, error: 'Password must be between 1 and 128 characters.' };
    }
    if (data.userId !== undefined && (typeof data.userId !== 'string' || data.userId.length > 64)) {
      return { valid: false, error: 'Invalid user ID format.' };
    }
  } else if (data.type === 'encrypted_message' || data.type === 'message') {
    let p = data.payload || data.envelope || data.message;
    if (typeof p === 'string') {
      try {
        p = JSON.parse(p);
      } catch {}
    }
    if (!p || typeof p !== 'object') {
      return { valid: false, error: 'Missing encrypted message payload.' };
    }
    if (p.enc !== true && !p.isDeleted) {
      return { valid: false, error: 'Unencrypted plaintext messages are strictly rejected.' };
    }
    if (p.ct && (typeof p.ct !== 'string' || p.ct.length > 1048576)) {
      return { valid: false, error: 'Message ciphertext exceeds 1MB limit.' };
    }
    if (p.iv && (typeof p.iv !== 'string' || p.iv.length > 64)) {
      return { valid: false, error: 'Invalid IV format.' };
    }
    if (p.nonce && (typeof p.nonce !== 'string' || p.nonce.length > 64)) {
      return { valid: false, error: 'Invalid nonce format.' };
    }
  } else if (data.type === 'typing') {
    if (typeof data.isTyping !== 'boolean' && typeof data.typing !== 'boolean') {
      return { valid: false, error: 'Typing status must be a boolean.' };
    }
  } else if (data.type === 'read_receipt') {
    if (data.timestamp !== undefined && (typeof data.timestamp !== 'number' || !Number.isFinite(data.timestamp))) {
      return { valid: false, error: 'Read receipt timestamp must be a valid number.' };
    }
  } else if (data.type === 'reaction') {
    if (!data.payload || typeof data.payload !== 'object') {
      return { valid: false, error: 'Missing reaction payload.' };
    }
    if (typeof data.payload.messageId !== 'string' || data.payload.messageId.length > 64) {
      return { valid: false, error: 'Invalid reaction messageId.' };
    }
    if (typeof data.payload.emoji !== 'string' || data.payload.emoji.length > 16) {
      return { valid: false, error: 'Reaction emoji exceeds maximum length.' };
    }
  } else if (data.type === 'whiteboard') {
    if (data.data && typeof data.data !== 'object') {
      return { valid: false, error: 'Invalid whiteboard data payload.' };
    }
  } else if (data.type === 'webrtc_signal') {
    if (!data.signal || typeof data.signal !== 'object') {
      return { valid: false, error: 'Invalid WebRTC signal format.' };
    }
  }

  return { valid: true };
}

// Periodic cleanup of stale rate-limiting and nonce maps (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of authAttemptTracker.entries()) {
    if (record.lockedUntil < now && now - record.lastAttempt > 600000) {
      authAttemptTracker.delete(key);
    }
  }
  for (const [ip, timestamps] of pingRequestTracker.entries()) {
    const active = timestamps.filter((t) => t > now - 30000);
    if (active.length === 0) {
      pingRequestTracker.delete(ip);
    } else {
      pingRequestTracker.set(ip, active);
    }
  }
  for (const [room, nonces] of roomSeenNonces.entries()) {
    for (const [nonce, time] of nonces.entries()) {
      if (now - time > 300000) nonces.delete(nonce);
    }
    if (nonces.size === 0) roomSeenNonces.delete(room);
  }
}, 300000);

function normalizeIp(rawIp: string): string {
  let ip = rawIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip;
}

function getClientIp(req: http.IncomingMessage): string {
  if (TRUST_PROXY) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor).split(',');
      const clientIp = ips[0].trim();
      if (clientIp) {
        return normalizeIp(clientIp);
      }
    }
  }
  const remoteAddr = req.socket?.remoteAddress;
  if (remoteAddr) {
    return normalizeIp(remoteAddr);
  }
  return '127.0.0.1';
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // Fast gzip/deflate compression for static assets and API payloads > 512 bytes
  app.use(compression({ threshold: 512 }));

  // Enforce strict bounded JSON and URL-encoded payloads to prevent body allocation memory exhaustion attacks
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  const server = http.createServer(app);

  // Disable Nagle's algorithm on all incoming HTTP/TCP connections to eliminate 40ms delayed-ACK packet latency
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
  });

  // Security Headers Middleware (Strict Zero-Exposure & Clickjacking Protection)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://*.google.com https://*.run.app https://*.googleusercontent.com"
    );
    next();
  });

  // Standalone WebSocket server with strictly bounded 256KB max frame payload
  // perMessageDeflate disabled to eliminate compression context overhead and CPU context-switch delay on real-time chat frames
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 256 * 1024,
    perMessageDeflate: false,
  });

  server.on('upgrade', (request, socket, head) => {
    // Disable Nagle's algorithm immediately on upgrading socket for instantaneous frame delivery
    if ('setNoDelay' in socket && typeof (socket as any).setNoDelay === 'function') {
      (socket as any).setNoDelay(true);
    }

    const parsedUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

    if (parsedUrl.pathname === '/ws') {
      // 1. Validate Origin to prevent Cross-Site WebSocket Hijacking (CSWSH)
      if (!isAllowedWsOrigin(request.headers.origin, request.headers.host)) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      // 2. Enforce per-IP connection limits
      const clientIp = getClientIp(request);
      const currentIpConns = ipConnectionCounts.get(clientIp) || 0;
      if (currentIpConns >= MAX_CONCURRENT_WS_PER_IP) {
        socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    if (req.socket && typeof req.socket.setNoDelay === 'function') {
      req.socket.setNoDelay(true);
    }
    const clientIp = getClientIp(req);
    // Track connection count for this IP
    ipConnectionCounts.set(clientIp, (ipConnectionCounts.get(clientIp) || 0) + 1);

    let ipSlotReleased = false;
    const releaseIpSlot = () => {
      if (ipSlotReleased) return;
      ipSlotReleased = true;
      const cur = ipConnectionCounts.get(clientIp) || 1;
      if (cur <= 1) {
        ipConnectionCounts.delete(clientIp);
      } else {
        ipConnectionCounts.set(clientIp, cur - 1);
      }
    };

    ws.on('error', () => {
      releaseIpSlot();
    });

    let isAuthenticated = false;
    let assignedUserId: string | null = null;
    let assignedRoomId: string | null = null;
    let assignedPassword = '';

    // 15-second unauthenticated handshake timeout (mitigates Slowloris / socket starvation DoS)
    const authTimeout = setTimeout(() => {
      if (!isAuthenticated && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication handshake timed out.' }));
          ws.close(4001, 'Handshake timeout');
        } catch {}
      }
    }, 15000);

    // Heartbeat tracking to clean up ghost/dead connections
    let isAlive = true;
    ws.on('pong', () => {
      isAlive = true;
    });

    const heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(heartbeatInterval);
        releaseIpSlot();
        return ws.terminate();
      }
      isAlive = false;
      try {
        ws.ping();
      } catch {
        clearInterval(heartbeatInterval);
        releaseIpSlot();
        ws.terminate();
      }
    }, 30000);

    // Per-connection token bucket rate limiter for messages
    let msgTokens = 15;
    const maxMsgTokens = 15;
    let lastTokenRefill = Date.now();
    const tokenRefillRate = 3; // refills 3 tokens/sec

    const checkMsgRateLimit = (): boolean => {
      const now = Date.now();
      const elapsed = (now - lastTokenRefill) / 1000;
      msgTokens = Math.min(maxMsgTokens, msgTokens + elapsed * tokenRefillRate);
      lastTokenRefill = now;
      if (msgTokens >= 1) {
        msgTokens -= 1;
        return true;
      }
      return false;
    };

    ws.on('message', async (rawData) => {
      try {
        // Enforce maximum text frame size of 64KB
        const rawBuf = Buffer.isBuffer(rawData)
          ? rawData
          : Array.isArray(rawData)
          ? Buffer.concat(rawData)
          : Buffer.from(rawData as ArrayBuffer);

        if (rawBuf.length > 65536) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Message payload exceeds maximum allowed frame size (64KB).',
            })
          );
          return;
        }

        const text = rawBuf.toString('utf-8');
        const data = JSON.parse(text);

        // Universal per-connection rate limit to block DoS/flooding attacks before processing
        if (!checkMsgRateLimit()) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Rate limit exceeded. Please slow down your requests.',
            })
          );
          return;
        }

        // Enforce strict frame schema validation (Fix Bug 18)
        const frameValidation = validateWebSocketMessage(data);
        if (!frameValidation.valid) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: frameValidation.error || 'Invalid message schema.',
            })
          );
          return;
        }

        // Step 1: Authentication & Room Joining via WebSocket
        if (data.type === 'auth') {
          if (isAuthenticated) return;

          // Preserve whitespace in passphrases (Fix Bug 17)
          const providedPassword = typeof data.password === 'string' ? stripInvisibleChars(data.password) : '';
          const rawRoomId = typeof data.roomId === 'string' ? stripInvisibleChars(data.roomId).trim().toUpperCase() : '';

          // Canonical room ID validation (Fix Bug 16)
          if (!isValidRoomId(rawRoomId)) {
            ws.send(
              JSON.stringify({
                type: 'auth_error',
                message: 'Room code must be between 3 and 32 alphanumeric characters.',
              })
            );
            ws.close(4002, 'Invalid room code');
            return;
          }

          if (!isValidPassword(providedPassword)) {
            ws.send(
              JSON.stringify({
                type: 'auth_error',
                message: 'Please enter a valid password (1 to 128 characters).',
              })
            );
            ws.close(4001, 'Invalid password length');
            return;
          }

          // Check server-side anti-brute-force rate limiter
          const lockout = getAuthLockout(clientIp, rawRoomId);
          if (lockout.isLocked) {
            ws.send(
              JSON.stringify({
                type: 'auth_error',
                message: `Too many failed password attempts. Room is locked for ${lockout.remainingSec}s.`,
              })
            );
            ws.close(4001, 'Brute force lockout');
            return;
          }

          // Check existing in-memory room
          let room = rooms.get(rawRoomId);
          if (room && room.users.length >= 2) {
            ws.send(
              JSON.stringify({
                type: 'status',
                status: 'room_full',
                message: 'Room is full (maximum 2 participants).',
                roomId: rawRoomId,
              })
            );
            ws.close(4003, 'Room is full');
            return;
          }

          // Check in-memory password first if room active
          if (room && room.users.length > 0) {
            const matches = verifyPasswordHash(providedPassword, room.passwordHash, rawRoomId);
            if (!matches) {
              recordAuthFailure(clientIp, rawRoomId);
              ws.send(
                JSON.stringify({
                  type: 'auth_error',
                  message: 'Incorrect password for this room. Make sure both participants use the exact same password.',
                })
              );
              ws.close(4001, 'Incorrect password');
              return;
            }
          } else {
            // Check Firestore database record using live participant count
            const liveActiveCount = rooms.get(rawRoomId)?.users.length || 0;
            const authResult = await authenticateOrCreateRoom(rawRoomId, providedPassword, liveActiveCount);
            if (!authResult.ok) {
              recordAuthFailure(clientIp, rawRoomId);
              ws.send(
                JSON.stringify({
                  type: 'auth_error',
                  message: authResult.error || 'Incorrect password for this room.',
                })
              );
              ws.close(4001, 'Incorrect password');
              return;
            }
          }

          // Password matched: clear failed attempt tracker for this IP + room
          clearAuthFailures(clientIp, rawRoomId);
          clearTimeout(authTimeout);

          // Re-verify room capacity after async Firestore operation to prevent race condition
          room = rooms.get(rawRoomId);
          if (room && room.users.length >= 2) {
            ws.send(
              JSON.stringify({
                type: 'status',
                status: 'room_full',
                message: 'Room is full (maximum 2 participants).',
                roomId: rawRoomId,
              })
            );
            ws.close(4003, 'Room is full');
            return;
          }

          isAuthenticated = true;
          assignedRoomId = rawRoomId;
          assignedPassword = providedPassword;

          // Initialize or update in-memory room
          const modernPbkdf2Hash = hashPasswordPBKDF2(providedPassword);
          if (!room) {
            if (rooms.size >= 5000) {
              ws.send(
                JSON.stringify({
                  type: 'auth_error',
                  message: 'Server room capacity reached. Please try again later.',
                })
              );
              ws.close(4003, 'Room capacity reached');
              return;
            }
            room = { id: assignedRoomId, passwordHash: modernPbkdf2Hash, users: [] };
            rooms.set(assignedRoomId, room);
          } else {
            room.passwordHash = modernPbkdf2Hash;
          }

          // Final safety check on room capacity
          if (room.users.length >= 2) {
            ws.send(
              JSON.stringify({
                type: 'status',
                status: 'room_full',
                message: 'Room is full.',
                roomId: assignedRoomId,
              })
            );
            ws.close(4003, 'Room is full');
            return;
          }

          assignedUserId = (typeof data.userId === 'string' && data.userId.trim().length > 0 && data.userId.length <= 64)
            ? stripInvisibleChars(data.userId).trim()
            : crypto.randomBytes(8).toString('hex');
          const user: ChatUser = {
            id: assignedUserId,
            ws,
            roomId: assignedRoomId,
            ip: clientIp,
          };
          room.users.push(user);

          // Generate cryptographic session token (Fix Bug 1, 2 & 14)
          const sessionToken = createRoomSessionToken(assignedRoomId, assignedUserId);

          // Update active count in Firestore
          syncRoomState(assignedRoomId, room.users.length).catch((err) =>
            console.warn('Failed to sync room to Firestore:', err)
          );

          // Acknowledge successful authentication with assigned user ID, room state, and session token
          ws.send(
            JSON.stringify({
              type: 'auth_ok',
              userId: assignedUserId,
              roomId: assignedRoomId,
              sessionToken,
              participantCount: room.users.length,
              timestamp: Date.now(),
            })
          );

          // Notify connection status
          if (room.users.length === 1) {
            ws.send(
              JSON.stringify({
                type: 'status',
                status: 'waiting',
                message: 'Waiting for another person to join...',
                roomId: assignedRoomId,
              })
            );
          } else if (room.users.length === 2) {
            for (const u of room.users) {
              if (u.ws.readyState === WebSocket.OPEN) {
                u.ws.send(
                  JSON.stringify({
                    type: 'status',
                    status: 'connected',
                    action: 'peer_joined',
                    message: 'Connected',
                    roomId: assignedRoomId,
                  })
                );
              }
            }
          }
          return;
        }

        // Fast physical round-trip ping measurement (no auth required for latency diagnostics)
        if (data.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'pong',
                clientTime: data.clientTime || 0,
                serverTime: Date.now(),
              })
            );
          }
          return;
        }

        // All subsequent real-time relays require authenticated session
        if (!isAuthenticated || !assignedUserId || !assignedRoomId) {
          return;
        }

        const currentRoom = rooms.get(assignedRoomId);
        if (!currentRoom) return;

        // Step 2: Instant 0ms-relay for Encrypted Messages (E2EE payload)
        if (data.type === 'encrypted_message' || data.type === 'message') {
          let rawPayload = data.payload || data.envelope || data.message;
          if (typeof rawPayload === 'string') {
            try {
              rawPayload = JSON.parse(rawPayload);
            } catch {}
          }
          const nonce = rawPayload?.nonce;
          const msgTs = rawPayload?.ts || data.timestamp || Date.now();

          // Anti-replay protection check (Fix Bug 23)
          if (!checkAndRecordNonce(assignedRoomId, nonce, msgTs)) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Message rejected: duplicate nonce or timestamp outside allowed window.',
              })
            );
            return;
          }

          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: data.type,
                senderId: assignedUserId,
                payload: rawPayload,
                message: typeof data.message === 'string' ? data.message : JSON.stringify(rawPayload),
                timestamp: Date.now(),
              })
            );
          }

          // Immediate server delivery acknowledgement back to sender (Fix Bug 19)
          const messageId = rawPayload?.messageId || rawPayload?.id || data.messageId;
          if (messageId) {
            ws.send(
              JSON.stringify({
                type: 'delivery_ack',
                messageId,
                timestamp: Date.now(),
              })
            );
          }

          // Persist the encrypted envelope in Firestore for robust synchronization
          if (rawPayload && typeof rawPayload === 'object') {
            recordEncryptedPayload(assignedRoomId, assignedUserId, rawPayload).catch((err) => {
              console.warn('Failed to record relayed message to Firestore:', err);
            });
          }
          return;
        }

        // Step 3: Instant Typing Indicator Relay (0ms delay, no DB write needed)
        if (data.type === 'typing') {
          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: 'typing',
                senderId: assignedUserId,
                isTyping: Boolean(data.isTyping),
                timestamp: Date.now(),
              })
            );
          }
          return;
        }

        // Step 4: Instant Read Receipt Relay (0ms confirmation)
        if (data.type === 'read_receipt') {
          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: 'read_receipt',
                senderId: assignedUserId,
                timestamp: data.timestamp || Date.now(),
              })
            );
          }
          return;
        }

        // Step 5: Instant Collaborative Whiteboard / Scratchpad Stroke Relay
        if (data.type === 'whiteboard') {
          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: 'whiteboard',
                senderId: assignedUserId,
                data: data.data,
                timestamp: Date.now(),
              })
            );
          }
          return;
        }

        // Step 6: Low-Latency WebRTC Call Signaling (Offers, Answers, ICE candidates)
        if (data.type === 'webrtc_signal') {
          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: 'webrtc_signal',
                senderId: assignedUserId,
                signal: data.signal,
                timestamp: Date.now(),
              })
            );
          }
          return;
        }

        // Step 7: Instant Emoji Reaction Relay (<2ms)
        if (data.type === 'reaction') {
          const peer = currentRoom.users.find((u) => u.id !== assignedUserId);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(
              JSON.stringify({
                type: 'reaction',
                senderId: assignedUserId,
                payload: data.payload,
                timestamp: Date.now(),
              })
            );
          }
          return;
        }
      } catch {
        // Ignore invalid message formatting
      }
    });

    // Clean disconnect handling
    ws.on('close', () => {
      clearTimeout(authTimeout);
      clearInterval(heartbeatInterval);
      releaseIpSlot();

      if (isAuthenticated && assignedUserId && assignedRoomId) {
        const currentRoom = rooms.get(assignedRoomId);
        if (currentRoom) {
          currentRoom.users = currentRoom.users.filter((u) => u.id !== assignedUserId);

          // Update Firestore with new active participant count
          syncRoomState(assignedRoomId, currentRoom.users.length).catch((err) =>
            console.warn('Failed to update room count in Firestore:', err)
          );

          if (currentRoom.users.length === 1) {
            const remaining = currentRoom.users[0];
            if (remaining.ws.readyState === WebSocket.OPEN) {
              remaining.ws.send(
                JSON.stringify({
                  type: 'status',
                  status: 'waiting',
                  message: 'The other user disconnected.',
                  roomId: assignedRoomId,
                })
              );
            }
          } else if (currentRoom.users.length === 0) {
            rooms.delete(assignedRoomId);
          }
        }
      }
    });

    ws.on('error', () => {
      ws.close();
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Dedicated low-latency ping endpoints for real network latency measurement
  app.options('/api/ping', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
    res.status(204).end();
  });

  app.get('/api/ping', (req, res) => {
    const clientIp = getClientIp(req);
    if (!checkPingRateLimit(clientIp)) {
      res.status(429).json({ error: 'Too many requests. Please slow down.' });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const clientTime = req.query.t ? Number(req.query.t) : null;
    const now = Date.now();
    res.json({
      status: 'ok',
      pong: true,
      serverTime: now,
      echo: clientTime,
      delta: clientTime ? now - clientTime : null,
    });
  });

  app.head('/api/ping', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).end();
  });

  // REST Room Authentication & Token Issuance (Fix Bug 1, 2, 14)
  app.post('/api/rooms/auth', async (req, res) => {
    const clientIp = getClientIp(req);
    const { roomId, password, userId } = req.body || {};
    const cleanRoom = typeof roomId === 'string' ? stripInvisibleChars(roomId).trim().toUpperCase() : '';
    const cleanPassword = typeof password === 'string' ? stripInvisibleChars(password) : '';

    if (!isValidRoomId(cleanRoom)) {
      return res.status(400).json({ ok: false, error: 'Room code must be between 3 and 32 alphanumeric characters.' });
    }
    if (!isValidPassword(cleanPassword)) {
      return res.status(400).json({ ok: false, error: 'Password must be between 1 and 128 characters.' });
    }

    const lockout = getAuthLockout(clientIp, cleanRoom);
    if (lockout.isLocked) {
      return res.status(429).json({ ok: false, error: `Too many failed password attempts. Room is locked for ${lockout.remainingSec}s.` });
    }

    const liveActiveCount = rooms.get(cleanRoom)?.users.length || 0;
    const authResult = await authenticateOrCreateRoom(cleanRoom, cleanPassword, liveActiveCount);
    if (!authResult.ok) {
      recordAuthFailure(clientIp, cleanRoom);
      return res.status(401).json({ ok: false, error: authResult.error || 'Authentication failed' });
    }

    clearAuthFailures(clientIp, cleanRoom);
    const effectiveUserId = (typeof userId === 'string' && userId.length > 0 && userId.length <= 64)
      ? stripInvisibleChars(userId).trim()
      : crypto.randomBytes(8).toString('hex');

    const sessionToken = createRoomSessionToken(cleanRoom, effectiveUserId);
    return res.json({
      ok: true,
      sessionToken,
      roomId: cleanRoom,
      userId: effectiveUserId,
      isNewRoom: Boolean(authResult.isNewRoom),
    });
  });

  // Query brute-force lockout status for room (Fix Bug 15)
  app.get('/api/rooms/lockout', (req, res) => {
    const clientIp = getClientIp(req);
    const cleanRoom = typeof req.query.roomId === 'string' ? stripInvisibleChars(req.query.roomId).trim().toUpperCase() : '';
    const lockout = getAuthLockout(clientIp, cleanRoom);
    res.json(lockout);
  });

  // Zero-Knowledge Room Self-Destruct Server Operation (Fix Bug 12)
  app.post('/api/rooms/burn', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.sessionToken;
    const session = verifyRoomSessionToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: valid room session token required.' });
    }

    const result = await burnRoomAndDestroyAllDataServer(session.roomId);

    // Broadcast self-destruct notice to active sockets and close them
    const memRoom = rooms.get(session.roomId);
    if (memRoom) {
      for (const u of memRoom.users) {
        if (u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify({ type: 'status', status: 'room_burned', message: 'Room has been burned and destroyed.' }));
          u.ws.close(4000, 'Room burned');
        }
      }
      rooms.delete(session.roomId);
    }

    return res.json(result);
  });

  // Server-authorized message deletion (Fix Bug 6 & 7)
  app.post('/api/rooms/delete-message', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.sessionToken;
    const session = verifyRoomSessionToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { messageId, deleteForEveryone } = req.body || {};
    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid messageId' });
    }

    const result = await deleteMessageServer(session.roomId, messageId, session.userId, Boolean(deleteForEveryone));
    return res.status(result.ok ? 200 : 400).json(result);
  });

  // Server-authorized message editing within 15 minutes (Fix Bug 8)
  app.post('/api/rooms/edit-message', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.sessionToken;
    const session = verifyRoomSessionToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { messageId, ct, iv } = req.body || {};
    if (!messageId || typeof messageId !== 'string' || !ct || typeof ct !== 'string' || !iv || typeof iv !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid edit parameters' });
    }

    const result = await editMessageServer(session.roomId, messageId, session.userId, ct, iv);
    return res.status(result.ok ? 200 : 400).json(result);
  });

  // Server-authorized view-once media burning (Fix Bug 9)
  app.post('/api/rooms/burn-media', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.sessionToken;
    const session = verifyRoomSessionToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { messageId } = req.body || {};
    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid messageId' });
    }

    const result = await burnMediaServer(session.roomId, messageId);
    return res.status(result.ok ? 200 : 400).json(result);
  });

  // Server-authorized message history retrieval (Fix Bug 1)
  app.get('/api/rooms/messages', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);
    const session = verifyRoomSessionToken(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    try {
      const messages = await getRoomMessagesServer(session.roomId);
      return res.json({ ok: true, messages });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message || 'Failed to retrieve messages' });
    }
  });

  // Serve Vite in development, compiled static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : __dirname;
    // Set 1-year immutable caching for content-hashed assets, no-cache for index.html
    app.use(
      express.static(distPath, {
        dotfiles: 'ignore',
        index: false,
        fallthrough: true,
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
