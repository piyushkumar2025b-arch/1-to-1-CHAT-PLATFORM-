import { useState, FormEvent } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Flame, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PrivacyLockGuardProps {
  isLocked: boolean;
  onUnlock: (enteredPassword?: string) => Promise<boolean> | boolean;
  onBurnRoom?: () => Promise<void>;
  activeRoomId: string;
  expectedPassword?: string;
  autoLockReason?: string;
}

export function PrivacyLockGuard({
  isLocked,
  onUnlock,
  onBurnRoom,
  activeRoomId,
  expectedPassword,
  autoLockReason = 'Session locked for security & privacy',
}: PrivacyLockGuardProps) {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  if (!isLocked) return null;

  const handleUnlockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // If expectedPassword is provided, verify it directly
    if (expectedPassword) {
      if (inputPassword.trim() !== expectedPassword.trim()) {
        setError('Incorrect password. Please re-enter the room password to unlock.');
        return;
      }
    }

    setIsVerifying(true);
    try {
      const success = await onUnlock(inputPassword);
      if (!success && !expectedPassword) {
        setError('Verification failed. Please re-enter the room password.');
      } else {
        setInputPassword('');
      }
    } catch {
      setError('Could not unlock session. Please check credentials.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickUnlock = async () => {
    // If the room key is still securely resident in memory and verified
    setIsVerifying(true);
    try {
      await onUnlock();
      setInputPassword('');
    } catch {
      setError('Please enter room password.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-screen-title"
      className="fixed inset-0 z-[150] bg-neutral-950/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        id="privacy-lock-card"
        className="relative w-full max-w-md bg-neutral-900/90 border border-neutral-750/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 z-10"
      >
        {/* Shield / Lock Emblem */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Reason */}
        <div>
          <h2 id="lock-screen-title" className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Chat Session Locked
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
            {autoLockReason}. Your messages and cryptographic keys remain sealed in memory.
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-white/10 text-[11px] font-mono text-amber-300">
            Room: {activeRoomId}
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlockSubmit} className="w-full flex flex-col gap-3">
          <div className="relative w-full text-left">
            <label htmlFor="unlock-password" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Room Password
            </label>
            <div className="relative">
              <input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password to unlock..."
                autoFocus
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 text-white placeholder-neutral-500 text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs text-left animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              disabled={isVerifying || !inputPassword.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock with Password'}</span>
            </button>

            {/* Quick Unlock Button if in-memory credentials verified */}
            <button
              type="button"
              onClick={handleQuickUnlock}
              disabled={isVerifying}
              className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Unlock (Resident Session)</span>
            </button>
          </div>
        </form>

        {/* Emergency Burn Panic Section */}
        {onBurnRoom && (
          <div className="w-full pt-3 border-t border-white/10 flex flex-col items-center gap-2">
            {!showBurnConfirm ? (
              <button
                type="button"
                onClick={() => setShowBurnConfirm(true)}
                className="text-[11px] text-neutral-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400/80" />
                <span>Panic Eradicate: Self-destruct room now</span>
              </button>
            ) : (
              <div className="w-full p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Confirm: Erase entire room & purge all data immediately?</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBurnConfirm(false)}
                    className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onBurnRoom}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
                  >
                    Yes, Burn Room
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
