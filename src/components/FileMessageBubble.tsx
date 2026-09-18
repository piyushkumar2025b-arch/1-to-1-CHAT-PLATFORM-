import { useState, useRef } from 'react';
import {
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileImage,
  FileCode,
  File,
  Download,
  Loader2,
  Check,
  Eye,
  X,
  Play,
  Flame,
} from 'lucide-react';
import { FileAttachment } from '../types';
import {
  formatBytes,
  downloadAttachmentFromBase64,
  triggerBlobDownload,
} from '../lib/file-compression';
import { getRoomFileBlob } from '../lib/file-retrieval';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import ImageLightboxModal from './ImageLightboxModal';
import InlineVideoPlayer from './InlineVideoPlayer';
import InlineAudioPlayer from './InlineAudioPlayer';
import ViewOnceMediaModal from './ViewOnceMediaModal';

interface FileMessageBubbleProps {
  file: FileAttachment;
  roomId: string;
  isMe: boolean;
  accentColor?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  roomPassword?: string;
  messageId?: string;
  onBurnMedia?: (messageId: string, fileId: string) => void;
}

function getFileTypeInfo(mimeType: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext)) {
    return {
      category: 'image',
      label: ext.toUpperCase() || 'IMAGE',
      icon: <FileImage className="w-5 h-5 text-amber-400" />,
    };
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return {
      category: 'video',
      label: ext.toUpperCase() || 'VIDEO',
      icon: <FileVideo className="w-5 h-5 text-purple-400" />,
    };
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'opus'].includes(ext)) {
    return {
      category: 'audio',
      label: ext.toUpperCase() || 'AUDIO',
      icon: <FileAudio className="w-5 h-5 text-emerald-400" />,
    };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'].includes(ext)) {
    return {
      category: 'archive',
      label: ext.toUpperCase() || 'ARCHIVE',
      icon: <FileArchive className="w-5 h-5 text-amber-500" />,
    };
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'rs', 'go', 'sh', 'yml', 'yaml'].includes(ext)) {
    return {
      category: 'code',
      label: ext.toUpperCase() || 'CODE',
      icon: <FileCode className="w-5 h-5 text-cyan-400" />,
    };
  }
  if (['pdf'].includes(ext)) {
    return {
      category: 'pdf',
      label: 'PDF',
      icon: <FileText className="w-5 h-5 text-red-400" />,
    };
  }
  if (['doc', 'docx', 'rtf'].includes(ext)) {
    return {
      category: 'document',
      label: 'WORD',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
    };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return {
      category: 'presentation',
      label: 'SLIDES',
      icon: <FileText className="w-5 h-5 text-orange-400" />,
    };
  }
  if (['txt', 'md', 'csv', 'log'].includes(ext)) {
    return {
      category: 'text',
      label: ext.toUpperCase() || 'TEXT',
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
    };
  }
  return {
    category: 'binary',
    label: ext.toUpperCase() || 'FILE',
    icon: <File className="w-5 h-5 text-neutral-400" />,
  };
}

function isSafePreviewUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image/') || url.startsWith('blob:') || url.startsWith('https://');
}

export default function FileMessageBubble({
  file,
  roomId,
  isMe,
  accentColor = '#f59e0b',
  isUploading = false,
  uploadProgress = 0,
  roomPassword,
  messageId,
  onBurnMedia,
}: FileMessageBubbleProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [viewOnceModalOpen, setViewOnceModalOpen] = useState(false);
  const [viewOnceMediaUrl, setViewOnceMediaUrl] = useState<string | null>(null);

  const downloadedBytesRef = useRef<Uint8Array | null>(null);

  const fileInfo = getFileTypeInfo(file.mimeType, file.fileName);

  const savingsPercent =
    file.isCompressed && file.fileSize > file.compressedSize
      ? Math.round((1 - file.compressedSize / file.fileSize) * 100)
      : 0;

  // Generic file fetch & decompression helper
  const getFileBytes = async (): Promise<Uint8Array> => {
    if (downloadedBytesRef.current) return downloadedBytesRef.current;

    const blob = await getRoomFileBlob(roomId, file, setDownloadProgress, roomPassword);
    const arrayBuffer = await blob.arrayBuffer();
    const finalBytes = new Uint8Array(arrayBuffer);
    downloadedBytesRef.current = finalBytes;
    return finalBytes;
  };

  // If file was burned on read
  if (file.burned) {
    return (
      <div className="w-full max-w-sm p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-400 text-xs flex items-center gap-2 select-none italic shadow-sm">
        <Flame className="w-4 h-4 text-neutral-500 shrink-0" />
        <span>Media expired • Burned on read</span>
      </div>
    );
  }

  // Handle View-Once Tap to View
  const handleOpenViewOnce = async () => {
    if (viewOnceMediaUrl) {
      setViewOnceModalOpen(true);
      return;
    }
    setDownloading(true);
    setDownloadProgress('Decrypting view-once payload...');
    try {
      const blob = await getRoomFileBlob(roomId, file, setDownloadProgress, roomPassword);
      const url = URL.createObjectURL(blob);
      setViewOnceMediaUrl(url);
      setViewOnceModalOpen(true);
    } catch (err) {
      console.error('Failed to open view-once media:', err);
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  const handleBurnAndCloseViewOnce = () => {
    setViewOnceModalOpen(false);
    if (viewOnceMediaUrl && viewOnceMediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(viewOnceMediaUrl);
    }
    setViewOnceMediaUrl(null);
    if (onBurnMedia && messageId) {
      onBurnMedia(messageId, file.fileId);
    }
  };

  // If View-Once media
  if (file.viewOnce) {
    if (isMe) {
      return (
        <div className="w-full max-w-sm p-3 rounded-xl bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 flex items-center gap-2.5 text-xs select-none">
          <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-amber-300">View Once {fileInfo.label}</span>
            <span className="text-[10px] text-neutral-400">
              {file.viewed ? 'Opened & burned by recipient' : 'Delivered • Burns after peer opens'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-sm p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-neutral-200 flex flex-col gap-2.5 select-none shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>View Once {fileInfo.label}</span>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">
            {formatBytes(file.fileSize)}
          </span>
        </div>
        <p className="text-[11px] text-neutral-300">
          This encrypted media burns and disappears permanently after viewing.
        </p>
        <button
          type="button"
          onClick={handleOpenViewOnce}
          disabled={downloading}
          className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          <span>{downloading ? 'Decrypting...' : 'Tap to View (Burns on Read)'}</span>
        </button>

        {viewOnceModalOpen && (
          <ViewOnceMediaModal
            isOpen={viewOnceModalOpen}
            file={file}
            mediaUrl={viewOnceMediaUrl}
            onBurnAndClose={handleBurnAndCloseViewOnce}
            isVoice={file.isVoice}
          />
        )}
      </div>
    );
  }

  // If voice message, render VoiceMessagePlayer
  if (file.isVoice) {
    return (
      <VoiceMessagePlayer
        file={file}
        roomId={roomId}
        isMe={isMe}
        accentColor={accentColor}
        roomPassword={roomPassword}
      />
    );
  }

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress('Preparing...');

    try {
      if (file.inlineData) {
        setDownloadProgress('Decompressing...');
        await downloadAttachmentFromBase64(file.inlineData, file);
      } else {
        const finalBytes = await getFileBytes();
        const blob = new Blob([finalBytes], { type: file.mimeType || 'application/octet-stream' });
        triggerBlobDownload(blob, file.fileName);
      }

      setDownloadSuccess(true);
      setDownloadError(null);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError('Download failed. Check network.');
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // Quick view for text / markdown / code files
  const handleQuickViewText = async () => {
    if (textContent) {
      setTextModalOpen(true);
      return;
    }
    setDownloading(true);
    setDownloadProgress('Loading text content...');
    try {
      const bytes = await getFileBytes();
      const text = new TextDecoder().decode(bytes);
      setTextContent(text);
      setTextModalOpen(true);
    } catch (err) {
      console.error('Error reading text file:', err);
      handleDownload();
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // Video preview player
  const handleOpenVideo = async () => {
    if (videoUrl) {
      setVideoModalOpen(true);
      return;
    }
    setDownloading(true);
    setDownloadProgress('Loading video...');
    try {
      const bytes = await getFileBytes();
      const blob = new Blob([bytes], { type: file.mimeType || 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoModalOpen(true);
    } catch (err) {
      console.error('Error opening video:', err);
      handleDownload();
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      {/* Uploading Progress Banner on Sender's Side */}
      {isUploading && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 space-y-1.5 animate-pulse">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Transmitting File...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${uploadProgress}%` }}
              className="h-full bg-amber-400 transition-all duration-200 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Inline Video Player for video files */}
      {fileInfo.category === 'video' && (
        <InlineVideoPlayer
          file={file}
          roomId={roomId}
          roomPassword={roomPassword}
          accentColor={accentColor}
        />
      )}

      {/* Inline Audio Player for audio files */}
      {fileInfo.category === 'audio' && (
        <InlineAudioPlayer
          file={file}
          roomId={roomId}
          roomPassword={roomPassword}
          accentColor={accentColor}
        />
      )}

      {/* Inline Image Thumbnail if applicable */}
      {fileInfo.category === 'image' && isSafePreviewUrl(file.previewUrl) && (
        <div className="relative group overflow-hidden rounded-lg bg-neutral-950/60 border border-neutral-800/80">
          <img
            src={file.previewUrl}
            alt={file.fileName}
            className="w-full max-h-52 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5 backdrop-blur-[2px] cursor-pointer"
          >
            <Eye className="w-4 h-4" /> View Full Photo
          </button>
        </div>
      )}

      {/* Main File Details Card */}
      <div
        className={`flex items-center gap-3 p-2.5 rounded-lg border ${
          isMe
            ? 'bg-neutral-900/90 border-neutral-700/60 text-neutral-200'
            : 'bg-neutral-800/95 border-neutral-700/60 text-neutral-100'
        }`}
      >
        <div className="p-2 rounded-md bg-neutral-950/80 border border-neutral-800 shrink-0">
          {fileInfo.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-neutral-700 text-neutral-300">
              {fileInfo.label}
            </span>
            <p
              className="text-xs font-semibold truncate tracking-tight text-neutral-100"
              title={file.fileName}
            >
              {file.fileName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-neutral-400 mt-1">
            <span>{formatBytes(file.fileSize)}</span>
            {file.isCompressed && savingsPercent > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Compressed -{savingsPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Preview button for text/code/md */}
          {['text', 'code'].includes(fileInfo.category) && (
            <button
              type="button"
              onClick={handleQuickViewText}
              disabled={downloading}
              title="Quick read file content"
              className="p-2 rounded-md bg-neutral-700/80 hover:bg-neutral-600 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {/* Quick Video Player button */}
          {fileInfo.category === 'video' && (
            <button
              type="button"
              onClick={handleOpenVideo}
              disabled={downloading}
              title="Watch video"
              className="p-2 rounded-md bg-neutral-700/80 hover:bg-purple-600 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || isUploading}
            className={`p-2 rounded-md transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-700/80 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200'
            }`}
            title={downloading ? downloadProgress : 'Download file'}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {downloading && (
        <span className="text-[10px] text-amber-400/90 italic animate-pulse px-1">
          {downloadProgress || 'Processing...'}
        </span>
      )}

      {downloadError && (
        <span className="text-[10px] text-rose-400/90 font-medium px-1 flex items-center gap-1">
          {downloadError}
        </span>
      )}

      {/* Full Photo Lightbox Modal with Zoom, Rotation & Download */}
      {file.previewUrl && (
        <ImageLightboxModal
          isOpen={previewOpen}
          imageUrl={file.previewUrl}
          fileName={file.fileName}
          fileSize={file.fileSize}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
          accentColor={accentColor}
        />
      )}

      {/* Video Player Modal */}
      {videoModalOpen && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-200">
              <span className="truncate">{file.fileName}</span>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="max-h-[70vh] w-full rounded-xl bg-black"
            />
            <div className="mt-3 flex justify-end w-full">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download ({formatBytes(file.fileSize)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text / Code Quick View Modal */}
      {textModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setTextModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-sm font-semibold text-neutral-200 truncate">{file.fileName}</span>
              <button
                type="button"
                onClick={() => setTextModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto my-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 whitespace-pre-wrap select-text">
              {textContent || 'No text content.'}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Original ({formatBytes(file.fileSize)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
