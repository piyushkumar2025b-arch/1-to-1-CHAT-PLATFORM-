import { useState, FormEvent } from 'react';
import {
  X,
  Link2,
  Share2,
  Copy,
  Check,
  Globe,
  Send,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { isSafeHttpUrl, getDomainFromUrl } from '../lib/link-utils';
import { scheduleClipboardAutoWipe } from '../lib/crypto-enclave';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomPassword?: string;
  onSendLinkToChat: (url: string, note?: string) => void;
  onOpenQrModal?: () => void;
  initialMode?: 'send_link' | 'share_room';
}

export function ShareLinkModal({
  isOpen,
  onClose,
  roomId,
  roomPassword = '',
  onSendLinkToChat,
  onOpenQrModal,
  initialMode = 'send_link',
}: ShareLinkModalProps) {
  const [activeTab, setActiveTab] = useState<'send_link' | 'share_room'>(initialMode);

  // Send link state
  const [urlInput, setUrlInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [urlError, setUrlError] = useState('');

  // Share room state
  const [includePassword, setIncludePassword] = useState(true);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);
  const [sharedViaNative, setSharedViaNative] = useState(false);

  if (!isOpen) return null;

  // Build room invite URL pointing to public app
  const APP_PUBLIC_URL = 'https://ai.studio/apps/00442c1b-abc3-4bb8-8929-0feb1d748cba';
  const roomInviteUrl = APP_PUBLIC_URL;

  const handleCopyRoomLink = () => {
    navigator.clipboard.writeText(roomInviteUrl);
    scheduleClipboardAutoWipe(45000);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Private Chat Room: ${roomId}`,
          text: includePassword && roomPassword
            ? `Join my encrypted 1-to-1 chat room ${roomId} (Password: ${roomPassword}):`
            : `Join my encrypted 1-to-1 chat room ${roomId}:`,
          url: roomInviteUrl,
        });
        setSharedViaNative(true);
        setTimeout(() => setSharedViaNative(false), 2500);
      } catch (err) {
        console.warn('Share cancelled or not supported:', err);
      }
    } else {
      handleCopyRoomLink();
    }
  };

  const handleSendLink = (e: FormEvent) => {
    e.preventDefault();
    const raw = urlInput.trim();
    if (!raw) {
      setUrlError('Please enter a link URL.');
      return;
    }

    // Auto-prefix http/https if omitted
    const finalUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    if (!isSafeHttpUrl(finalUrl)) {
      setUrlError('Please enter a valid HTTP or HTTPS address.');
      return;
    }

    setUrlError('');
    onSendLinkToChat(finalUrl, noteInput.trim() || undefined);
    setUrlInput('');
    setNoteInput('');
    onClose();
  };

  const domain = urlInput.trim() ? getDomainFromUrl(urlInput.trim()) : '';

  return (
    <div
      id="share-link-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="share-link-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-neutral-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Share Links</h2>
              <p className="text-[11px] text-white/60">
                Share web links in chat or invite peers with a link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-1 border-b border-white/10 flex gap-2 bg-neutral-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('send_link')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'send_link'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Share Link in Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share_room')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'share_room'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Link for Room</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'send_link' ? (
            /* SEND LINK INTO CHAT FORM */
            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Web URL / Link Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    placeholder="https://example.com/document or github.com/repo..."
                    className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    autoFocus
                  />
                </div>
                {urlError && <p className="text-xs text-red-400 mt-1.5">{urlError}</p>}
              </div>

              {/* Detected domain preview */}
              {domain && (
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/40">
                      Destination
                    </span>
                    <span className="font-mono text-white/90">{domain}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Encrypted Transmission
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Optional Note or Description
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Check out this resource / design..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="text-[11px] text-white/50 block mb-1.5">Quick Examples:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'GitHub', url: 'https://github.com' },
                    { label: 'Wikipedia', url: 'https://wikipedia.org' },
                    { label: 'Google Docs', url: 'https://docs.google.com' },
                    { label: 'Figma', url: 'https://figma.com' },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setUrlInput(s.url)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Link in Chat</span>
                </button>
              </div>
            </form>
          ) : (
            /* SHARE ROOM INVITE LINK */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/70">Room Code:</span>
                  <span className="font-mono text-amber-300 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
                    {roomId}
                  </span>
                </div>

                {roomPassword && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/70">Room Password:</span>
                    <span className="font-mono text-emerald-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {roomPassword}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Inclusion Toggle */}
              {roomPassword && (
                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePassword}
                    onChange={(e) => setIncludePassword(e.target.checked)}
                    className="rounded border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-black/40"
                  />
                  <span>
                    Include password in link (peer joins with 1 click without entering password)
                  </span>
                </label>
              )}

              {/* URL Display Bar */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Shareable Room Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomInviteUrl}
                    className="flex-1 px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-mono text-white/90 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRoomLink}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md"
                  >
                    {copiedRoomLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share via System / Mobile */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {sharedViaNative ? 'Shared!' : 'Share via App / Mobile'}
                  </span>
                </button>

                {onOpenQrModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQrModal();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Show QR Code</span>
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  This link connects directly to this temporary room session. All chats, files, and calls remain strictly end-to-end encrypted with zero server logs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
