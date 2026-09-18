import { Loader2, UploadCloud, X } from 'lucide-react';
import { formatBytes } from '../lib/file-compression';

interface FileCompressProgressModalProps {
  fileName: string;
  fileSize: number;
  progressStep: string;
  progressPercent: number;
  onCancel?: () => void;
}

export default function FileCompressProgressModal({
  fileName,
  fileSize,
  progressStep,
  progressPercent,
  onCancel,
}: FileCompressProgressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl flex flex-col gap-4 relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-100 truncate">{fileName}</h3>
            <p className="text-xs text-neutral-400">
              Original size: <span className="text-neutral-300 font-medium">{formatBytes(fileSize)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-neutral-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              {progressStep || 'Compressing for real-time delivery...'}
            </span>
            <span className="text-amber-400">{Math.round(progressPercent)}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Large files are automatically compressed and packaged to transfer instantly across the peer connection.
          </p>
        </div>
      </div>
    </div>
  );
}
