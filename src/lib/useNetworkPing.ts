import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeSocket } from './realtime-socket';

export interface NetworkPingState {
  pingMs: number | null;
  quality: 'fast' | 'moderate' | 'slow' | 'offline';
  isOnline: boolean;
  jitterMs: number | null;
  minPingMs: number | null;
  maxPingMs: number | null;
  avgPingMs: number | null;
  target: 'server' | 'internet' | 'offline';
  targetName: string;
  lastChecked: number | null;
  history: number[];
  refreshPing: () => Promise<void>;
}

/**
 * Hook to measure real physical round-trip network latency (RTT).
 * Uses real high-resolution performance.now() HTTP packets to the backend /api/ping
 * with high-reliability zero-content internet gateway fallback.
 * Strictly NO simulated or random numbers.
 */
export function useNetworkPing(intervalMs = 5000): NetworkPingState {
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [target, setTarget] = useState<'server' | 'internet' | 'offline'>('server');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [jitterMs, setJitterMs] = useState<number | null>(null);

  const prevPingRef = useRef<number | null>(null);

  const measurePing = useCallback(async () => {
    // 1. If physical device is offline according to browser, record immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setPingMs(null);
      setTarget('offline');
      return;
    }

    let measurementSuccess = false;
    let measuredMs: number | null = null;
    let measuredTarget: 'server' | 'internet' | 'offline' = 'offline';

    // Primary attempt: Real HTTP packet to backend server /api/ping
    try {
      const clientStart = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/ping?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const clientEnd = performance.now();
        measuredMs = Math.max(1, Math.round(clientEnd - clientStart));
        measuredTarget = 'server';
        measurementSuccess = true;
      }
    } catch {
      // Primary server ping timed out or hit network error
    }

    // Secondary attempt: Real network packet to Google global CDN zero-content ping
    if (!measurementSuccess) {
      try {
        const fbStart = performance.now();
        const fbController = new AbortController();
        const fbTimeoutId = setTimeout(() => fbController.abort(), 3500);

        await fetch(`https://www.gstatic.com/generate_204?_t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: fbController.signal,
        });

        clearTimeout(fbTimeoutId);
        const fbEnd = performance.now();
        measuredMs = Math.max(1, Math.round(fbEnd - fbStart));
        measuredTarget = 'internet';
        measurementSuccess = true;
      } catch {
        // Both endpoints failed - device is genuinely offline or blocked
      }
    }

    if (measurementSuccess && measuredMs !== null) {
      setIsOnline(true);
      setPingMs(measuredMs);
      setTarget(measuredTarget);
      setLastChecked(Date.now());

      if (prevPingRef.current !== null) {
        setJitterMs(Math.abs(measuredMs - prevPingRef.current));
      }
      prevPingRef.current = measuredMs;

      setHistory((prev) => [...prev, measuredMs!].slice(-15));
    } else {
      setIsOnline(false);
      setPingMs(null);
      setTarget('offline');
      setJitterMs(null);
    }
  }, []);

  useEffect(() => {
    measurePing();

    const interval = setInterval(() => {
      measurePing();
    }, intervalMs);

    const handleOnline = () => {
      setIsOnline(true);
      measurePing();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPingMs(null);
      setTarget('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [measurePing, intervalMs]);

  // Subscribe to real-time physical WebSocket latency whenever tunnel is open
  useEffect(() => {
    const unsub = realTimeSocket.onLatency((ms) => {
      setIsOnline(true);
      setPingMs(ms);
      setTarget('server');
      setLastChecked(Date.now());
      if (prevPingRef.current !== null) {
        setJitterMs(Math.abs(ms - prevPingRef.current));
      }
      prevPingRef.current = ms;
      setHistory((prev) => [...prev, ms].slice(-15));
    });
    return unsub;
  }, []);

  // Derive statistical aggregates from real measurement history
  let quality: 'fast' | 'moderate' | 'slow' | 'offline' = 'fast';
  if (!isOnline || pingMs === null) {
    quality = 'offline';
  } else if (pingMs <= 50) {
    quality = 'fast';
  } else if (pingMs <= 180) {
    quality = 'moderate';
  } else {
    quality = 'slow';
  }

  const minPingMs = history.length > 0 ? Math.min(...history) : pingMs;
  const maxPingMs = history.length > 0 ? Math.max(...history) : pingMs;
  const avgPingMs =
    history.length > 0 ? Math.round(history.reduce((sum, v) => sum + v, 0) / history.length) : pingMs;

  const isWsTunnel = realTimeSocket.isConnected();
  const targetName =
    target === 'server'
      ? isWsTunnel
        ? 'Direct WebSocket Tunnel (/ws)'
        : 'Private Edge Server (/api/ping)'
      : target === 'internet'
      ? 'Global Gateway (gstatic.com)'
      : 'Offline (Unreachable)';

  return {
    pingMs,
    quality,
    isOnline,
    jitterMs,
    minPingMs,
    maxPingMs,
    avgPingMs,
    target,
    targetName,
    lastChecked,
    history,
    refreshPing: measurePing,
  };
}
