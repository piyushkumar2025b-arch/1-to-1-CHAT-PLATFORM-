import { useState, MouseEvent } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { ExtractedLink, isSafeHttpUrl } from '../lib/link-utils';
import { copyToClipboardSafe } from '../lib/security';

interface LinkPreviewCardProps {
  key?: string | number;
  link: ExtractedLink;
  isMe: boolean;
  accentColor?: string;
}

export function LinkPreviewCard({ link, isMe, accentColor = '#f59e0b' }: LinkPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboardSafe(link.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleOpen = (e: MouseEvent) => {
    e.stopPropagation();
    if (isSafeHttpUrl(link.url)) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleOpen}
      className={`mt-1.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none group/link ${
        isMe
          ? 'bg-black/30 hover:bg-black/40 border-white/15'
          : 'bg-black/40 hover:bg-black/50 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
          >
            <Globe className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white/90 truncate">
                {link.domain}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1 rounded border border-emerald-800/40 shrink-0">
                LINK
              </span>
            </div>
            <p className="text-[11px] text-white/60 truncate hover:text-white/80 transition-colors">
              {link.displayUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy URL"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpen}
            title="Open link in new tab"
            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>
    </div>
  );
}
