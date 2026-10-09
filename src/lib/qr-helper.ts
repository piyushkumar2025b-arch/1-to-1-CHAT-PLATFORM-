import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface QrJoinPayload {
  roomId: string;
  password?: string;
  roomType?: 'direct' | 'organization';
  organizationName?: string;
  raw: string;
}

export const APP_PUBLIC_REDIRECT_URL = 'https://ai.studio/apps/00442c1b-abc3-4bb8-8929-0feb1d748cba';

/**
 * Builds the canonical QR redirect URL with room credentials encoded in the URL hash
 * so scanning or opening the invite link auto-populates the room & password without server leakage.
 */
export function buildJoinUrl(
  roomId?: string,
  password?: string,
  includePassword = true,
  roomType?: 'direct' | 'organization',
  organizationName?: string
): string {
  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}${window.location.pathname}`
      : APP_PUBLIC_REDIRECT_URL;
  if (!roomId || !roomId.trim()) {
    return baseUrl;
  }
  const params = new URLSearchParams();
  params.set('room', roomId.trim().toUpperCase());
  if (includePassword && password) {
    params.set('pwd', password);
  }
  if (roomType === 'organization') {
    params.set('mode', 'organization');
    if (organizationName && organizationName.trim()) {
      params.set('org', organizationName.trim());
    }
  }
  return `${baseUrl}#${params.toString()}`;
}

/**
 * Generates a high-quality QR code Data URL (PNG) that encodes the room join URL.
 */
export async function generateRoomQrDataUrl(
  roomId?: string,
  password?: string,
  includePassword = true,
  roomType?: 'direct' | 'organization',
  organizationName?: string
): Promise<{ qrDataUrl: string; joinUrl: string }> {
  const joinUrl = buildJoinUrl(roomId, password, includePassword, roomType, organizationName);

  const qrDataUrl = await QRCode.toDataURL(joinUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0a0a0a',
      light: '#ffffff',
    },
  });

  return { qrDataUrl, joinUrl };
}

/**
 * Parses any QR code text into room credentials.
 * Supports:
 * 1. Full URLs: https://domain.app/?room=ROOM123&pwd=xyz or #room=...
 * 2. JSON payloads: {"room":"ROOM123","pwd":"xyz"}
 * 3. Compact text: "ROOM123:xyz" or "ROOM123"
 */
export function parseQrJoinPayload(rawText: string): QrJoinPayload | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  // 1. Try URL parsing
  try {
    let url: URL | null = null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      url = new URL(trimmed);
    } else if (trimmed.includes('room=') || trimmed.includes('roomId=')) {
      // Relative or pseudo URL
      url = new URL(trimmed, 'https://dummy-base.local');
    }

    if (url) {
      // Check query params
      let r = url.searchParams.get('room') || url.searchParams.get('roomId') || url.searchParams.get('join');
      let p = url.searchParams.get('pwd') || url.searchParams.get('password') || url.searchParams.get('pass');
      let m = url.searchParams.get('mode') || url.searchParams.get('roomType');
      let o = url.searchParams.get('org') || url.searchParams.get('organizationName');

      // If not found in query, check hash (e.g. #room=XYZ&pwd=123)
      if (!r && url.hash) {
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        r = hashParams.get('room') || hashParams.get('roomId') || hashParams.get('join');
        p = hashParams.get('pwd') || hashParams.get('password') || hashParams.get('pass');
        m = m || hashParams.get('mode') || hashParams.get('roomType');
        o = o || hashParams.get('org') || hashParams.get('organizationName');
      }

      if (r) {
        return {
          roomId: r.trim().toUpperCase(),
          password: p ? p : undefined,
          roomType: m === 'organization' ? 'organization' : undefined,
          organizationName: o ? o.trim() : undefined,
          raw: trimmed,
        };
      }

      // If this is the public app URL without specific room params
      if (trimmed.includes('00442c1b-abc3-4bb8-8929-0feb1d748cba')) {
        return {
          roomId: '',
          raw: trimmed,
        };
      }
    }
  } catch {
    // Not a valid URL, continue to next parsers
  }

  // 2. Try JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const r = obj.room || obj.roomId || obj.id;
      const p = obj.pwd || obj.password || obj.pass;
      if (r && typeof r === 'string') {
        return {
          roomId: r.trim().toUpperCase(),
          password: typeof p === 'string' ? p.trim() : undefined,
          raw: trimmed,
        };
      }
    } catch {
      // Not valid JSON
    }
  }

  // 3. Try delimited format "ROOM_ID:PASSWORD"
  if (trimmed.includes(':') && !trimmed.includes('://')) {
    const parts = trimmed.split(':');
    if (parts.length === 2 && parts[0].trim().length > 0) {
      return {
        roomId: parts[0].trim().toUpperCase(),
        password: parts[1].trim(),
        raw: trimmed,
      };
    }
  }

  // 4. Fallback: treat as plain room ID if alphanumeric and within standard length (3-32 chars)
  const cleanId = trimmed.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (cleanId.length >= 3 && cleanId.length <= 32) {
    return {
      roomId: cleanId,
      raw: trimmed,
    };
  }

  return null;
}

/**
 * Scans a single video frame for a QR code using jsQR.
 */
export function scanQrFromVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): QrJoinPayload | null {
  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    return null;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  if (code && code.data) {
    return parseQrJoinPayload(code.data);
  }

  return null;
}

/**
 * Scans an uploaded image file (PNG, JPG, WEBP) for a QR code using jsQR.
 */
export async function scanQrFromImageFile(file: File): Promise<QrJoinPayload | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          resolve(parseQrJoinPayload(code.data));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
