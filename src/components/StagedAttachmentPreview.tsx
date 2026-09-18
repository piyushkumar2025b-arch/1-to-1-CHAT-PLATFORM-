import React from 'react';
import { X, FileText, Archive, Music, Film, Crop, Flame } from 'lucide-react';

interface StagedAttachmentPreviewProps {
  file: File;
  previewUrl: string | null;
  onRemove: () => void;
  accentColor?: string;
  onEditImage?: () => void;
  isViewOnce?: boolean;
  onToggleViewOnce?: () => void;
}

export const StagedAttachmentPreview: React.FC<StagedAttachmentPreviewProps> = ({
  file,
  previewUrl,
  onRemove,
  accentColor = '#f59e0b',
  onEditImage,
  isViewOnce = false,
  onToggleViewOnce,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isArchive = file.name.endsWith('.zip') || file.name.endsWith('.tar') || file.name.endsWith('.gz');

  return (
    <div
      id="staged-attachment-preview"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-750 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 select-none shadow-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Thumbnail or File Icon */}
        <div className="w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : isVideo ? (
            <Film className="w-6 h-6 text-indigo-400" />
          ) : isAudio ? (
            <Music className="w-6 h-6 text-rose-400" />
          ) : isArchive ? (
            <Archive className="w-6 h-6 text-amber-400" />
          ) : (
            <FileText className="w-6 h-6 text-sky-400" />
          )}
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-100 truncate max-w-[200px] sm:max-w-xs">
              {file.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-medium border border-amber-500/25">
              {formatSize(file.size)}
            </span>
            {isViewOnce && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" /> View Once
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Ready to send. You can add a caption below or press Send.
          </p>
        </div>
      </div>

      {/* Action Buttons: Edit/Redact & View Once Toggle & Remove */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        {isImage && onEditImage && (
          <button
            type="button"
            onClick={onEditImage}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-amber-300 border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Crop, draw arrows, or blur sensitive text on this image"
          >
            <Crop className="w-3.5 h-3.5 text-amber-400" />
            <span>Edit / Redact</span>
          </button>
        )}

        {onToggleViewOnce && (
          <button
            type="button"
            onClick={onToggleViewOnce}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
              isViewOnce
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Toggle View Once (Burns immediately after opening)"
          >
            <Flame className={`w-3.5 h-3.5 ${isViewOnce ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'}`} />
            <span>1x View Once</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors cursor-pointer shrink-0"
          title="Remove attachment"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
