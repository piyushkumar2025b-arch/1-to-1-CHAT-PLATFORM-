import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';

/**
 * Enhanced Security & Anti-Tamper Shield Utility
 * Provides:
 * 1. Global right-click and dev-tools shortcut deterrence
 * 2. Brute-force rate limiting with progressive lockout
 * 3. Salted SHA-256 password hashing & entropy validation
 * 4. XSS and malicious file upload sanitization
 * 5. Complete zero-knowledge room self-destruction (burn room)
 */

// -------------------------------------------------------------
// 1. Right-Click & DevTools Deterrence Shield
// -------------------------------------------------------------
export type SecurityAlertCallback = (message: string) => void;

let activeSecurityListener: {
  onContextMenu: (e: MouseEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onDragStart: (e: DragEvent) => void;
} | null = null;

export function enableSecurityShield(onAlert?: SecurityAlertCallback): () => void {
  // If already attached, return teardown
  if (activeSecurityListener) {
    return disableSecurityShield;
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (onAlert) {
      onAlert('Right-click is disabled to protect private communications.');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Intercept F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      if (onAlert) {
        onAlert('Developer inspection tools are disabled to preserve room integrity.');
      }
      return false;
    }

    // Intercept Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
    // Intercept Ctrl+Shift+J / Cmd+Option+J (Console)
    // Intercept Ctrl+Shift+C / Cmd+Option+C (Inspect)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isModifier = isMac ? e.metaKey : e.ctrlKey;

    if (
      isModifier &&
      e.shiftKey &&
      ['I', 'J', 'C'].includes(e.key.toUpperCase())
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (onAlert) {
        onAlert('Developer inspection shortcuts are disabled to protect data privacy.');
      }
      return false;
    }

    // Intercept Ctrl+U / Cmd+Option+U (View Page Source)
    if ((isModifier && e.key.toUpperCase() === 'U') || (isMac && e.metaKey && e.altKey && e.key.toUpperCase() === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      if (onAlert) {
        onAlert('Viewing page source is restricted to safeguard active room keys.');
      }
      return false;
    }

    // Intercept Ctrl+S / Cmd+S (Save Page)
    if (isModifier && e.key.toUpperCase() === 'S') {
      e.preventDefault();
      e.stopPropagation();
      if (onAlert) {
        onAlert('Direct page saving is disabled for end-to-end secrecy.');
      }
      return false;
    }
  };

  const handleDragStart = (e: DragEvent) => {
    // Prevent dragging images or DOM out of the app window
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO')) {
      e.preventDefault();
    }
  };

  window.addEventListener('contextmenu', handleContextMenu, { capture: true });
  window.addEventListener('keydown', handleKeyDown, { capture: true });
  window.addEventListener('dragstart', handleDragStart, { capture: true });

  activeSecurityListener = {
    onContextMenu: handleContextMenu,
    onKeyDown: handleKeyDown,
    onDragStart: handleDragStart,
  };

  return disableSecurityShield;
}

export function disableSecurityShield(): void {
  if (activeSecurityListener) {
    window.removeEventListener('contextmenu', activeSecurityListener.onContextMenu, { capture: true });
    window.removeEventListener('keydown', activeSecurityListener.onKeyDown, { capture: true });
    window.removeEventListener('dragstart', activeSecurityListener.onDragStart, { capture: true });
    activeSecurityListener = null;
  }
}

// -------------------------------------------------------------
// 2. Anti-Brute-Force Rate Limiting Engine
// -------------------------------------------------------------
interface LockoutState {
  attempts: number;
  lockedUntil: number; // timestamp
}

const STORAGE_PREFIX = 'sec_lockout_';

export function getBruteForceLockout(roomId: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const cleanRoom = roomId.trim().toUpperCase();
  if (!cleanRoom) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  const raw = localStorage.getItem(`${STORAGE_PREFIX}${cleanRoom}`);
  if (!raw) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  try {
    const state: LockoutState = JSON.parse(raw);
    const now = Date.now();
    if (state.lockedUntil && state.lockedUntil > now) {
      const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        attempts: state.attempts || 0,
      };
    }
    // Expired lockout
    if (state.lockedUntil && state.lockedUntil <= now) {
      // Keep attempts count but clear lock timer
      return {
        isLocked: false,
        remainingSeconds: 0,
        attempts: state.attempts || 0,
      };
    }
    return { isLocked: false, remainingSeconds: 0, attempts: state.attempts || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

export function recordFailedAttempt(roomId: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const cleanRoom = roomId.trim().toUpperCase();
  if (!cleanRoom) {
    return { isLocked: false, remainingSeconds: 0, attempts: 1 };
  }

  const current = getBruteForceLockout(cleanRoom);
  const nextAttempts = current.attempts + 1;
  const now = Date.now();
  let lockoutDurationMs = 0;

  // Progressive lockout intervals
  if (nextAttempts >= 5) {
    lockoutDurationMs = 120 * 1000; // 2 minutes
  } else if (nextAttempts === 4) {
    lockoutDurationMs = 60 * 1000; // 1 minute
  } else if (nextAttempts >= 3) {
    lockoutDurationMs = 30 * 1000; // 30 seconds
  }

  const state: LockoutState = {
    attempts: nextAttempts,
    lockedUntil: lockoutDurationMs > 0 ? now + lockoutDurationMs : 0,
  };

  localStorage.setItem(`${STORAGE_PREFIX}${cleanRoom}`, JSON.stringify(state));

  return {
    isLocked: lockoutDurationMs > 0,
    remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
    attempts: nextAttempts,
  };
}

export function resetFailedAttempts(roomId: string): void {
  const cleanRoom = roomId.trim().toUpperCase();
  if (cleanRoom) {
    localStorage.removeItem(`${STORAGE_PREFIX}${cleanRoom}`);
  }
}

// -------------------------------------------------------------
// 3. Cryptographic Key Derivation & Multi-Layer Hashing
// -------------------------------------------------------------
const SEC_SALT_PEPPER = 'PRIVATE_SHIELD_V2_PEPPER_9921_X!';

export async function hashPasswordLegacy(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPasswordSalted(plain: string, roomId: string): Promise<string> {
  const encoder = new TextEncoder();
  const combined = `${SEC_SALT_PEPPER}::${roomId.trim().toUpperCase()}::${plain}`;
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison in browser environments to eliminate timing attacks.
 * Runs through the full length without early return to avoid leaking string lengths.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aLen = a.length;
  const bLen = b.length;
  const maxLen = Math.max(aLen, bLen, 1);
  let mismatch = aLen ^ bLen;
  for (let i = 0; i < maxLen; i++) {
    const charA = i < aLen ? a.charCodeAt(i) : 0;
    const charB = i < bLen ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

/**
 * Validates password with backward compatibility for rooms created before salted hashing.
 */
export async function verifyRoomPassword(
  inputPassword: string,
  storedHash: string,
  roomId: string
): Promise<boolean> {
  if (!storedHash || !inputPassword) return false;

  const salted = await hashPasswordSalted(inputPassword, roomId);
  if (timingSafeStringEqual(salted, storedHash)) {
    return true;
  }

  const legacy = await hashPasswordLegacy(inputPassword);
  if (timingSafeStringEqual(legacy, storedHash)) {
    return true;
  }

  return false;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Maximum';
  color: string;
  feedback: string;
}

const TRIVIAL_PASSWORDS = new Set([
  '1234',
  '12345',
  '123456',
  'password',
  'admin',
  'qwerty',
  'test',
  'letmein',
  '0000',
]);

export function evaluatePasswordStrength(pass: string): PasswordStrength {
  if (!pass) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'text-neutral-500',
      feedback: 'Enter a room password',
    };
  }

  const clean = pass.trim().toLowerCase();
  if (TRIVIAL_PASSWORDS.has(clean) || pass.length < 4) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'text-rose-500',
      feedback: 'Easily guessed. Avoid simple numbers or words.',
    };
  }

  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Weak',
      color: 'text-orange-500',
      feedback: 'Add uppercase letters, numbers, or symbols.',
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Fair',
      color: 'text-amber-400',
      feedback: 'Good, but longer phrases provide higher entropy.',
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: 'Strong',
      color: 'text-emerald-400',
      feedback: 'High entropy password. Well protected.',
    };
  }
  return {
    score: 4,
    label: 'Maximum',
    color: 'text-teal-300',
    feedback: 'Optimal cryptographic resistance against brute force.',
  };
}

// -------------------------------------------------------------
// 4. Input Sanitization & Anti-XSS / Malware Guard
// -------------------------------------------------------------
const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.js',
  '.scr',
  '.msi',
  '.php',
  '.pif',
  '.hta',
  '.jar',
  '.com',
  '.ps1',
  '.psm1',
  '.reg',
  '.vbe',
  '.wsf',
  '.cpl',
  '.iso',
  '.img',
  '.dmg',
  '.app',
  '.bin',
  '.elf',
  '.so',
  '.dll',
  '.dylib',
  '.lnk',
  '.inf',
  '.gadget',
  '.html',
  '.htm',
  '.xhtml',
  '.shtml',
  '.svg',
  '.xml',
  '.xsl',
  '.xslt',
  '.url',
  '.scf',
  '.docm',
  '.xlsm',
  '.pptm',
  '.dotm',
  '.xltm',
  '.potm',
  '.msp',
  '.mst',
  '.msc',
  '.application',
  '.ws',
  '.wsh',
]);

// Unicode Bidirectional Override and directional isolate control characters regex
// Prevents visual extension spoofing (e.g. document[RLO]fdp.exe -> documentexe.pdf)
const BIDI_OVERRIDE_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

// Invisible zero-width and control characters regex to eliminate homograph & spoofing attacks
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF\u00AD\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function stripInvisibleChars(str: string): string {
  if (!str) return '';
  return str.replace(INVISIBLE_CHARS_REGEX, '');
}

export function sanitizeChatMessage(raw: string): string {
  if (!raw) return '';
  // Truncate to maximum 8000 characters to prevent buffer overflow
  let clean = raw.slice(0, 8000);

  // Strip null bytes, control characters, and Unicode bidi/zero-width spoofing characters
  clean = clean.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '');
  clean = clean.replace(INVISIBLE_CHARS_REGEX, '');

  // Protect code block contents from HTML stripping so code snippets (HTML/JS/Bash) are preserved intact
  const codeBlocks: string[] = [];
  clean = clean.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Neutralize script/frame/mXSS tags and harmful pseudo-protocols outside code blocks
  clean = clean.replace(/<\/?(script|iframe|object|embed|applet|form|svg|math)\b[^>]*>/gi, '');
  clean = clean.replace(/javascript:/gi, 'blocked-protocol:');
  clean = clean.replace(/vbscript:/gi, 'blocked-protocol:');
  clean = clean.replace(/data:text\/(html|javascript|xml)/gi, 'blocked-mime:');
  clean = clean.replace(/data:application\/(x-javascript|javascript|xml)/gi, 'blocked-mime:');

  // Neutralize inline DOM event handlers (e.g. onerror=, onload=, onclick=)
  clean = clean.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');

  // Neutralize dangerous CSS script/expression execution inside style attributes
  clean = clean.replace(/\bstyle\s*=\s*(['"]).*?(expression|javascript:|vbscript:|data:).*?\1/gi, '');

  // Restore code block contents
  clean = clean.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
    return codeBlocks[Number(idx)] || '';
  });

  return clean;
}

export function validateAndSanitizeFileName(name: string): {
  safeName: string;
  isBlocked: boolean;
  reason?: string;
} {
  if (!name) return { safeName: 'unnamed_file', isBlocked: false };

  // Strip Unicode bidi characters that can visually spoof extensions
  let clean = name.replace(BIDI_OVERRIDE_REGEX, '');

  // Remove directory traversal patterns, path separators, and control characters
  clean = clean.replace(/(\.\.[\/\\]|[\/\\])/g, '_').trim();
  clean = clean.replace(/[\u0000-\u001F\u007F]/g, '');

  // Detect and inspect all dot segments to prevent multi-extension spoofing (e.g. photo.exe.jpg or file.pdf.exe)
  const segments = clean.toLowerCase().split('.');
  if (segments.length > 1) {
    for (let i = 1; i < segments.length; i++) {
      const ext = `.${segments[i]}`;
      if (BLOCKED_EXTENSIONS.has(ext)) {
        return {
          safeName: clean,
          isBlocked: true,
          reason: `Potentially malicious executable extension "${ext}" detected in filename.`,
        };
      }
    }
  }

  if (clean.length > 120) {
    const dotIdx = clean.lastIndexOf('.');
    const ext = dotIdx !== -1 ? clean.substring(dotIdx) : '';
    clean = clean.slice(0, 110) + ext;
  }

  return { safeName: clean || 'attachment', isBlocked: false };
}

// -------------------------------------------------------------
// 5. Zero-Knowledge Room Self-Destruction (Burn Room)
// -------------------------------------------------------------
export async function burnRoomAndDestroyAllData(
  db: Firestore,
  roomId: string,
  sessionToken?: string
): Promise<{ success: boolean; deletedCount: number }> {
  const cleanRoom = roomId.trim().toUpperCase();
  if (!cleanRoom) return { success: false, deletedCount: 0 };

  let count = 0;

  // If running in browser with session token or fetch available, call secure backend burn API (Fix Bug 12)
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const resp = await fetch('/api/rooms/burn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ sessionToken }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data.deletedCount === 'number') {
          count = data.deletedCount;
        }
      }
    } catch {
      // Continue to direct deletion if backend burn unreachable or in test environment
    }
  }

  // 1. Delete all messages
  try {
    const messagesSnap = await getDocs(collection(db, 'rooms', cleanRoom, 'messages'));
    for (const d of messagesSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
      count++;
    }
  } catch (err) {
    console.warn('Note during messages purge:', err);
  }

  // 2. Delete all files & chunk subcollections
  try {
    const filesSnap = await getDocs(collection(db, 'rooms', cleanRoom, 'files'));
    for (const fileDoc of filesSnap.docs) {
      try {
        const chunksSnap = await getDocs(
          collection(db, 'rooms', cleanRoom, 'files', fileDoc.id, 'chunks')
        );
        for (const chunkDoc of chunksSnap.docs) {
          await deleteDoc(chunkDoc.ref).catch(() => {});
          count++;
        }
      } catch {
        // Continue if chunk subcollection empty or uninitialized
      }
      await deleteDoc(fileDoc.ref).catch(() => {});
      count++;
    }
  } catch (err) {
    console.warn('Note during files purge:', err);
  }

  // 3. Delete call sessions & candidate subcollections
  try {
    const candidateSubcollections = ['candidates', 'callerCandidates', 'calleeCandidates'];
    for (const colName of candidateSubcollections) {
      try {
        const cSnap = await getDocs(
          collection(db, 'rooms', cleanRoom, 'calls', 'current', colName)
        );
        for (const c of cSnap.docs) {
          await deleteDoc(c.ref).catch(() => {});
          count++;
        }
      } catch {
        // Continue if candidate subcollection does not exist
      }
    }

    const callDoc = doc(db, 'rooms', cleanRoom, 'calls', 'current');
    await deleteDoc(callDoc).catch(() => {});
  } catch (err) {
    console.warn('Note during call session purge:', err);
  }

  // 4. Delete the room document itself
  try {
    const roomRef = doc(db, 'rooms', cleanRoom);
    await deleteDoc(roomRef);
    count++;
  } catch (err) {
    console.error('Failed deleting room document during self-destruct:', err);
  }

  // Clear local lockout records
  resetFailedAttempts(cleanRoom);

  return { success: true, deletedCount: count };
}

// -------------------------------------------------------------
// 6. Automated Backend Ephemeral Hygiene & TTL Garbage Collector
// -------------------------------------------------------------
/**
 * Silently runs in the background to purge orphaned artifacts from previous sessions
 * so that no digital exhaust accumulates in the Firestore backend.
 */
export async function cleanExpiredRoomArtifacts(
  db: Firestore,
  roomId: string
): Promise<void> {
  const cleanRoom = roomId.trim().toUpperCase();
  if (!cleanRoom) return;

  try {
    const messagesSnap = await getDocs(collection(db, 'rooms', cleanRoom, 'messages'));
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const d of messagesSnap.docs) {
      const data = d.data();
      const created = data.createdAt ? new Date(data.createdAt).getTime() : 0;
      if (created > 0 && created < oneDayAgo) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }
  } catch (err) {
    // Fail silently so the user's experience is uninterrupted
    console.debug('Background TTL cleaner note:', err);
  }
}

/**
 * Escapes HTML entities to defend against any stored XSS in decrypted text payloads.
 */
export function sanitizeDecryptedHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Robust clipboard copy utility that supports modern Clipboard API with
 * document.execCommand fallback for iframe sandboxes and mobile webviews.
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern async Clipboard API if available and document is focused
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to DOM selection method
  }

  // 2. Fallback using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Validates Origin header on WebSocket upgrade to eliminate
 * Cross-Site WebSocket Hijacking (CSWSH).
 */
export function isAllowedWsOrigin(originHeader: string | undefined, hostHeader: string | undefined): boolean {
  // If no Origin header (e.g. native client, mobile app, internal curl test), allow
  if (!originHeader) return true;

  try {
    const originUrl = new URL(originHeader);

    // Enforce valid web scheme
    if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') {
      return false;
    }

    // Strip trailing DNS dot (e.g., example.com.)
    const originHost = originUrl.host.toLowerCase().replace(/\.$/, '');
    const originHostname = originUrl.hostname.toLowerCase().replace(/\.$/, '');

    // 1. Same-origin match with Host header
    if (hostHeader) {
      const cleanHost = hostHeader.toLowerCase().replace(/\.$/, '');
      const hostWithoutPort = cleanHost.split(':')[0];
      if (originHost === cleanHost || originHostname === hostWithoutPort) {
        return true;
      }
    }

    // 2. Allow local development
    if (originHostname === 'localhost' || originHostname === '127.0.0.1') {
      return true;
    }

    // 3. Allow trusted Cloud Run, Google AI Studio, and Firebase hosting domains
    const trustedSuffixes = [
      '.run.app',
      '.google.com',
      '.googleusercontent.com',
      '.web.app',
      '.firebaseapp.com',
    ];

    for (const suffix of trustedSuffixes) {
      const bareDomain = suffix.slice(1);
      if (originHostname.endsWith(suffix) || originHostname === bareDomain) {
        return true;
      }
    }

    // Reject all untrusted foreign origins (e.g. evil-hacker.com)
    return false;
  } catch {
    return false;
  }
}

