import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { FileAttachment } from '../types';
import {
  base64ToUint8Array,
  decompressBytes,
  triggerBlobDownload,
} from './file-compression';
import { decryptWithEnclave } from './crypto-enclave';

/**
 * Categorize a file by its mimeType and extension
 */
export function getFileCategoryInfo(mimeType: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext)) {
    return { category: 'image' as const, label: ext.toUpperCase() || 'IMAGE', ext };
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return { category: 'video' as const, label: ext.toUpperCase() || 'VIDEO', ext };
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'opus'].includes(ext)) {
    return { category: 'audio' as const, label: ext.toUpperCase() || 'AUDIO', ext };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'].includes(ext)) {
    return { category: 'archive' as const, label: ext.toUpperCase() || 'ARCHIVE', ext };
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'rs', 'go', 'sh', 'yml', 'yaml'].includes(ext)) {
    return { category: 'code' as const, label: ext.toUpperCase() || 'CODE', ext };
  }
  if (['pdf'].includes(ext)) {
    return { category: 'pdf' as const, label: 'PDF', ext };
  }
  if (['doc', 'docx', 'rtf'].includes(ext)) {
    return { category: 'document' as const, label: 'DOC', ext };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { category: 'presentation' as const, label: 'SLIDES', ext };
  }
  if (['txt', 'md', 'csv', 'log'].includes(ext)) {
    return { category: 'text' as const, label: ext.toUpperCase() || 'TEXT', ext };
  }
  return { category: 'binary' as const, label: ext.toUpperCase() || 'FILE', ext };
}

/**
 * Fetch and decompress bytes for any file attachment in the room
 */
export async function getRoomFileBlob(
  roomId: string,
  file: FileAttachment,
  onProgress?: (msg: string) => void,
  roomPassword?: string
): Promise<Blob> {
  const cleanRoom = (roomId || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const cleanFileId = (file.fileId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');

  if (!cleanRoom || !cleanFileId) {
    throw new Error('Invalid room or file identifier.');
  }

  // Case 1: Small file stored inline
  if (file.inlineData) {
    onProgress?.('Decompressing payload...');
    const raw = base64ToUint8Array(file.inlineData);
    const finalBytes = file.isCompressed ? await decompressBytes(raw) : raw;
    return new Blob([finalBytes], { type: file.mimeType || 'application/octet-stream' });
  }

  // Case 2: Multi-chunk file in Firestore subcollection (fully encrypted with AES-256-GCM)
  onProgress?.('Fetching chunks from database...');
  const chunksRef = collection(db, 'rooms', cleanRoom, 'files', cleanFileId, 'chunks');
  const snap = await getDocs(chunksRef);

  const rawChunksList: any[] = [];
  snap.forEach((d) => {
    rawChunksList.push(d.data());
  });

  rawChunksList.sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

  onProgress?.('Decrypting zero-knowledge chunks...');
  const decryptedChunks: string[] = [];
  for (let i = 0; i < rawChunksList.length; i++) {
    const c = rawChunksList[i];
    if (c.enc && c.ct && roomPassword) {
      const dec = await decryptWithEnclave<{ chunkIndex: number; data: string }>(
        c,
        roomPassword,
        roomId
      );
      decryptedChunks.push(dec?.data || '');
    } else {
      decryptedChunks.push(c.data || '');
    }
  }

  const fullBase64 = decryptedChunks.join('');

  onProgress?.('Decompressing payload...');
  const raw = base64ToUint8Array(fullBase64);
  const finalBytes = file.isCompressed ? await decompressBytes(raw) : raw;
  return new Blob([finalBytes], { type: file.mimeType || 'application/octet-stream' });
}

/**
 * Fetch and trigger direct browser download for any file attachment in the room
 */
export async function downloadRoomFile(
  roomId: string,
  file: FileAttachment,
  onProgress?: (msg: string) => void,
  roomPassword?: string
): Promise<void> {
  const blob = await getRoomFileBlob(roomId, file, onProgress, roomPassword);
  triggerBlobDownload(blob, file.fileName);
}
