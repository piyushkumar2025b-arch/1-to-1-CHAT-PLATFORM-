import { FileAttachment } from '../types';
import { validateAndSanitizeFileName } from './security';

/**
 * Format bytes to readable string (e.g. 1.2 MB, 340 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Safe conversion of Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]
    );
  }
  return btoa(binary);
}

/**
 * Safe conversion of base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compress binary data using native CompressionStream('gzip')
 */
export async function compressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    return bytes;
  }
  try {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const arrayBuffer = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.warn('CompressionStream error, fallback to uncompressed:', err);
    return bytes;
  }
}

/**
 * Decompress binary data using native DecompressionStream('gzip') with zip-bomb limit (50MB)
 */
export async function decompressBytes(bytes: Uint8Array, maxBytes = 52428800): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    return bytes;
  }
  try {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          throw new Error('Decompressed size exceeds maximum safety limit (50MB).');
        }
        chunks.push(value);
      }
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return combined;
  } catch (err: any) {
    if (err?.message?.includes('safety limit')) {
      throw err;
    }
    console.warn('DecompressionStream error, returning original bytes:', err);
    return bytes;
  }
}

/**
 * Compress image using Canvas resize & WebP quality downscale
 */
export async function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Generate thumbnail preview
      const thumbCanvas = document.createElement('canvas');
      const thumbMax = 240;
      let tw = width;
      let th = height;
      if (tw > thumbMax || th > thumbMax) {
        if (tw > th) {
          th = Math.round((th * thumbMax) / tw);
          tw = thumbMax;
        } else {
          tw = Math.round((tw * thumbMax) / th);
          th = thumbMax;
        }
      }
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      const tctx = thumbCanvas.getContext('2d');
      if (tctx) {
        tctx.drawImage(img, 0, 0, tw, th);
      }
      const previewUrl = thumbCanvas.toDataURL('image/webp', 0.65);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve({ blob, previewUrl });
          } else {
            resolve({ blob: file, previewUrl });
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ blob: file, previewUrl: '' });
    };

    img.src = objectUrl;
  });
}

export interface PreparedFilePayload {
  attachment: FileAttachment;
  chunks: string[];
}

const MAX_INLINE_CHARS = 350000; // ~260KB limit for inline document
const CHUNK_SIZE_CHARS = 350000;

/**
 * Process any file with compression and chunking
 */
export async function prepareFileForSharing(
  file: File,
  onProgress?: (step: string, progress: number) => void
): Promise<PreparedFilePayload> {
  const originalSize = file.size;
  const isImage = file.type.startsWith('image/');
  const fileId = 'file_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

  onProgress?.('Compressing...', 20);

  let previewUrl = '';
  let processedBuffer: ArrayBuffer;

  if (isImage) {
    const { blob, previewUrl: thumb } = await compressImage(file);
    previewUrl = thumb;
    processedBuffer = await blob.arrayBuffer();
  } else {
    processedBuffer = await file.arrayBuffer();
  }

  // Compress with gzip
  const rawBytes = new Uint8Array(processedBuffer);
  onProgress?.('Optimizing package...', 45);
  const compressedBytes = await compressBytes(rawBytes);

  let finalBytes: Uint8Array;
  let isCompressed = false;

  // Use compressed version if it is smaller than original
  if (compressedBytes.byteLength < rawBytes.byteLength) {
    finalBytes = compressedBytes;
    isCompressed = true;
  } else {
    finalBytes = rawBytes;
    isCompressed = false;
  }

  onProgress?.('Encoding chunks...', 75);
  const fullBase64 = uint8ArrayToBase64(finalBytes);
  const totalLength = fullBase64.length;

  const chunks: string[] = [];
  let inlineData: string | undefined = undefined;

  if (totalLength <= MAX_INLINE_CHARS) {
    inlineData = fullBase64;
    chunks.push(fullBase64);
  } else {
    for (let i = 0; i < totalLength; i += CHUNK_SIZE_CHARS) {
      chunks.push(fullBase64.substring(i, i + CHUNK_SIZE_CHARS));
    }
  }

  onProgress?.('Ready to share', 100);

  const attachment: FileAttachment = {
    fileId,
    fileName: file.name,
    fileSize: originalSize,
    compressedSize: finalBytes.byteLength,
    mimeType: file.type || 'application/octet-stream',
    isCompressed,
    chunkCount: chunks.length,
    ...(previewUrl ? { previewUrl } : {}),
    ...(inlineData ? { inlineData } : {}),
  };

  return { attachment, chunks };
}

/**
 * Package a voice recording into a FileAttachment ready to store in Firestore
 */
export function prepareVoiceAttachment(
  blob: Blob,
  base64: string,
  durationSec: number,
  waveformData: number[]
): { attachment: FileAttachment; chunks: string[] } {
  const fileId = 'voice_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const fileName = `Voice_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}.webm`;

  const attachment: FileAttachment = {
    fileId,
    fileName,
    fileSize: blob.size,
    compressedSize: blob.size,
    mimeType: blob.type || 'audio/webm',
    isCompressed: false,
    chunkCount: 1,
    isVoice: true,
    duration: durationSec,
    waveformData,
    inlineData: base64,
  };

  return { attachment, chunks: [base64] };
}

/**
 * Triggers a browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, fileName: string) {
  const { safeName } = validateAndSanitizeFileName(fileName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName || 'attachment';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Decompresses base64 data and triggers download
 */
export async function downloadAttachmentFromBase64(
  base64String: string,
  attachment: FileAttachment
): Promise<void> {
  const bytes = base64ToUint8Array(base64String);
  const finalBytes = attachment.isCompressed ? await decompressBytes(bytes) : bytes;
  const blob = new Blob([finalBytes], { type: attachment.mimeType || 'application/octet-stream' });
  triggerBlobDownload(blob, attachment.fileName);
}

