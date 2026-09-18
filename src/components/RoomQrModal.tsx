import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  Lock,
  Unlock,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { generateRoomQrDataUrl } from '../lib/qr-helper';

interface RoomQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  password?: string;
}

export function RoomQrModal({ isOpen, onClose, roomId, password }: RoomQrModalProps) {
  const [includePassword, setIncludePassword] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !roomId) return;

    let isMounted = true;
    setLoading(true);

    generateRoomQrDataUrl(roomId, password, includePassword)
      .then(({ qrDataUrl: dataUrl, joinUrl: url }) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setJoinUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render QR Code:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, roomId, password, includePassword]);

  if (!isOpen || !roomId) return null;

  const handleCopyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share && joinUrl) {
      try {
        await navigator.share({
          title: `Join Private Chat Room ${roomId}`,
          text: password
            ? `Join my private, encrypted 1-to-1 chat room (${roomId}, Password: ${password}):`
            : `Join my private, encrypted 1-to-1 chat room (${roomId}):`,
          url: joinUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-qr-modal-title"
      className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-200 select-none"
    >
      <div
        id="room-qr-modal"
        className="relative w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center gap-5 text-center"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="room-qr-modal-title" className="text-base font-bold text-white tracking-tight">
                Scan to Join Room
              </h2>
              <p className="text-xs text-neutral-400">1-scan instant peer connection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Modal"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="relative z-10 p-3 bg-white rounded-2xl shadow-xl border border-white/20 transition-transform duration-200">
          {loading ? (
            <div className="w-56 h-56 flex items-center justify-center bg-neutral-100 rounded-xl">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrDataUrl ? (
            <div className="relative">
              <img
                src={qrDataUrl}
                alt={`QR code for Room ${roomId}`}
                className="w-56 h-56 rounded-xl block pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 border-2 border-emerald-400/80 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Redirect Target URL info */}
        <div className="w-full z-10 px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-left">
          <div className="truncate pr-2">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 block">
              Redirects Directly To
            </span>
            <span className="text-xs font-mono text-emerald-200 truncate block">
              https://ai.studio/apps/00442c1b-abc3-4bb8-8929-0feb1d748cba
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs text-emerald-300 font-medium transition-colors cursor-pointer shrink-0"
            title="Copy Redirect URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Room Code Badge & Copy */}
        <div className="w-full z-10 flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl">
          <div className="text-left">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
              Room Identifier
            </span>
            <span className="text-sm font-mono font-bold tracking-wider text-emerald-400">
              {roomId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyRoomId}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy Room ID"
          >
            {copiedRoomId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Room Password Badge & Copy (if room has password) */}
        {password && (
          <div className="w-full z-10 flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl">
            <div className="text-left">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                Room Password
              </span>
              <span className="text-sm font-mono font-bold tracking-wider text-amber-300">
                {password}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              title="Copy Password"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pass</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full z-10 grid grid-cols-2 gap-2.5">
          {/* Copy Link */}
          <button
            type="button"
            id="copy-qr-link-button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-white/5"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-300" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Download QR Code Image */}
          {qrDataUrl && (
            <a
              id="download-qr-button"
              href={qrDataUrl}
              download={`privatechat-qr-${roomId}.png`}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-white/5"
            >
              <Download className="w-4 h-4 text-neutral-300" />
              <span>Save Image</span>
            </a>
          )}
        </div>

        {/* Device Native Share (if available) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleShare}
            className="w-full z-10 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 className="w-4 h-4 text-neutral-950" />
            <span>Share Invite via Apps</span>
          </button>
        )}

        <div className="text-[11px] text-neutral-400 z-10">
          Point any phone camera or QR scanner at this code to open the app directly.
        </div>
      </div>
    </div>
  );
}
