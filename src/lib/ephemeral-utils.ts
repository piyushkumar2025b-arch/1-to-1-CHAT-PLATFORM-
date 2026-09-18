import { EphemeralTimerOption } from '../types';

export const EPHEMERAL_OPTIONS: { id: EphemeralTimerOption; label: string; ms: number }[] = [
  { id: 'off', label: 'Off (Keep forever)', ms: 0 },
  { id: '10s', label: '10 seconds (Instant burn)', ms: 10 * 1000 },
  { id: '30s', label: '30 seconds', ms: 30 * 1000 },
  { id: '1m', label: '1 minute', ms: 60 * 1000 },
  { id: '5m', label: '5 minutes', ms: 5 * 60 * 1000 },
  { id: '1h', label: '1 hour', ms: 60 * 60 * 1000 },
  { id: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
];

export function getDurationMs(option: EphemeralTimerOption): number {
  const match = EPHEMERAL_OPTIONS.find((o) => o.id === option);
  return match ? match.ms : 0;
}

export function formatRemainingTime(expiresAt?: number): {
  isExpired: boolean;
  text: string;
  secondsRemaining: number;
} {
  if (!expiresAt) {
    return { isExpired: false, text: '', secondsRemaining: -1 };
  }

  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) {
    return { isExpired: true, text: 'Expired', secondsRemaining: 0 };
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return { isExpired: false, text: `${seconds}s`, secondsRemaining: seconds };
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remSec = seconds % 60;
    return {
      isExpired: false,
      text: remSec > 0 ? `${minutes}m ${remSec}s` : `${minutes}m`,
      secondsRemaining: seconds,
    };
  }

  const hours = Math.floor(minutes / 60);
  return {
    isExpired: false,
    text: `${hours}h`,
    secondsRemaining: seconds,
  };
}
