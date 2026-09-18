import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Flame,
  AlertTriangle,
  X,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoomId?: string;
  onBurnRoom?: () => Promise<void>;
  isLockedOut?: boolean;
  lockoutRemaining?: number;
}

export function SecurityShieldModal({
  isOpen,
  onClose,
  activeRoomId,
  onBurnRoom,
  isLockedOut,
  lockoutRemaining,
}: SecurityShieldModalProps) {
  const [confirmBurn, setConfirmBurn] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  if (!isOpen) return null;

  const handleBurnClick = async () => {
    if (!confirmBurn) {
      setConfirmBurn(true);
      return;
    }

    if (onBurnRoom) {
      try {
        setIsBurning(true);
        await onBurnRoom();
        setIsBurning(false);
        setConfirmBurn(false);
        onClose();
      } catch {
        setIsBurning(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-shield-title"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-white select-none animate-in fade-in duration-200"
    >
      <div
        id="security-shield-modal"
        className="relative w-full max-w-xl bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col gap-5"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="security-shield-title" className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Privacy & Safety Shield
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                How we protect your conversations and keep your data safe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close security modal"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lockout Warning if actively locked */}
        {isLockedOut && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block text-rose-200">Password Guessing Cooldown</span>
              <span>Too many attempts. You can try entering your password again in {lockoutRemaining}s.</span>
            </div>
          </div>
        )}

        {/* Security Features Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 z-10 max-h-[50vh] overflow-y-auto pr-1">
          {/* Right-click & Inspection */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Private Screen Shield
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Blocks accidental context menus and unauthorized copying to protect your view.
              </p>
            </div>
          </div>

          {/* Salted Key Derivation with OWASP Standard */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Strong Key Protection
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Uses 310,000 rounds of PBKDF2 to turn your password into an unbreakable cipher key.
              </p>
            </div>
          </div>

          {/* Anti-Brute Force Rate Limiting */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-start gap-2.5">
            <Fingerprint className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Anti-Guessing Guard
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Automatic cooldowns stop automated bots from guessing your room password.
              </p>
            </div>
          </div>

          {/* Strict 2-Peer Isolation */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Two-Person Only Rooms
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Strict limit of 2 participants per room. No third parties or unexpected guests can enter.
              </p>
            </div>
          </div>

          {/* Inactivity Auto-Lock & Privacy Blur */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-amber-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Auto-Blur & Screen Lock
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Blurs the chat when you switch tabs or step away, so nobody nearby can read your screen.
              </p>
            </div>
          </div>

          {/* AES-GCM-256 Cryptographic Enclave */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-emerald-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                End-to-End Encryption
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Scrambled with AES-GCM-256 directly in your browser. We can never read your messages.
              </p>
            </div>
          </div>

          {/* Anti-Replay & Anti-Tamper Nonces */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-teal-500/20 flex items-start gap-2.5">
            <Fingerprint className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Tamper Proofing
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Every message is cryptographically stamped so altered or repeated messages are rejected.
              </p>
            </div>
          </div>

          {/* Clipboard Auto-Wipe Protection */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-sky-500/20 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Clipboard Protection
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Sensitive keys and links copied to your clipboard are automatically wiped afterwards.
              </p>
            </div>
          </div>

          {/* Automated Backend TTL Hygiene */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-amber-500/20 flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Automatic Clean-Up
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Stale sessions and closed rooms are cleanly wiped so no digital footprint remains.
              </p>
            </div>
          </div>

          {/* Token-Bucket Flood Limiter */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-purple-500/20 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Spam & Flood Prevention
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Shields your chat from spam bots and rapid-fire requests to keep the app lightning fast.
              </p>
            </div>
          </div>

          {/* CSWSH Origin Protection */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-emerald-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Safe Connection Verification
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Ensures only authentic connections from this app can communicate with your chat.
              </p>
            </div>
          </div>

          {/* ReDoS & Malware Tag Neutralizer */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-teal-500/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                Safe Message Scanner
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Automatically strips malicious scripts or deceptive tags from formatted text.
              </p>
            </div>
          </div>

          {/* Stack Exhaustion & Circular Reference Defense */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-sky-500/20 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                App Stability Guard
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Prevents app slowdowns and keeps your chats running smoothly on any phone or computer.
              </p>
            </div>
          </div>
        </div>

        {/* Self-Destruct / Burn Room Section (If Active in Room) */}
        {activeRoomId && onBurnRoom && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col gap-3 z-10">
            <div className="flex items-start gap-2.5">
              <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-300 block">
                  Clear & Delete This Room
                </span>
                <span className="text-[11px] text-neutral-400 leading-relaxed">
                  Permanently erase room #{activeRoomId}, wiping all messages, photos, files, and voice notes for both of you immediately.
                </span>
              </div>
            </div>

            {confirmBurn && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Are you sure? This will delete all messages and files immediately for both people.</span>
              </div>
            )}

            <div className="flex items-center gap-2 self-end">
              {confirmBurn && (
                <button
                  type="button"
                  onClick={() => setConfirmBurn(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                id="burn-room-button"
                onClick={handleBurnClick}
                disabled={isBurning}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>
                  {isBurning
                    ? 'Deleting Room...'
                    : confirmBurn
                    ? 'Yes, Delete Everything'
                    : 'Clear & Delete Room'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400 z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Privacy Shield Active
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              All Protections Working
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
