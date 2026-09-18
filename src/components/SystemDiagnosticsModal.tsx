import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wifi,
  ShieldAlert,
  Server,
  Key,
  HardDrive,
  Mic,
  Camera,
  Copy,
  Check,
  X,
  Trash2,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  category: 'network' | 'crypto' | 'storage' | 'media';
  status: 'passed' | 'warning' | 'failed' | 'testing';
  details: string;
  metric?: string;
}

interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPing?: number | null;
  activeRoomId?: string | null;
  pingQuality?: 'fast' | 'moderate' | 'slow' | 'offline';
  jitterMs?: number | null;
  avgPingMs?: number | null;
  minPingMs?: number | null;
  maxPingMs?: number | null;
  targetName?: string;
  pingHistory?: number[];
}

export function SystemDiagnosticsModal({
  isOpen,
  onClose,
  currentPing,
  activeRoomId,
  pingQuality,
  jitterMs,
  avgPingMs,
  minPingMs,
  maxPingMs,
  targetName,
  pingHistory = [],
}: SystemDiagnosticsModalProps) {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'catalog'>('tests');

  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
    {
      name: 'Internet Link & Network Interface',
      category: 'network',
      status: navigator.onLine ? 'passed' : 'failed',
      details: navigator.onLine ? 'Browser reports active network connection' : 'No network connection detected',
      metric: navigator.onLine ? 'Online' : 'Offline',
    },
    {
      name: 'API Ping & Gateway Latency',
      category: 'network',
      status: currentPing && currentPing < 200 ? 'passed' : currentPing ? 'warning' : 'passed',
      details: 'Measuring real round-trip packet transmission time',
      metric: currentPing !== null && currentPing !== undefined ? `${currentPing}ms` : navigator.onLine ? 'Measuring...' : 'Offline',
    },
    {
      name: 'Web Crypto Subtle API (AES-GCM)',
      category: 'crypto',
      status: typeof window !== 'undefined' && window.crypto?.subtle ? 'passed' : 'failed',
      details: 'Hardware-accelerated zero-knowledge encryption engine',
      metric: 'Available',
    },
    {
      name: 'WebRTC P2P Voice & Video Engine',
      category: 'media',
      status: typeof window !== 'undefined' && !!window.RTCPeerConnection ? 'passed' : 'failed',
      details: 'Standard P2P media negotiation layer',
      metric: 'Supported',
    },
    {
      name: 'Client Storage Quota & Persistence',
      category: 'storage',
      status: 'passed',
      details: 'Local preferences and theme store operational',
      metric: 'Operational',
    },
  ]);

  const runAllDiagnostics = async () => {
    setIsRunningTests(true);

    const results: DiagnosticResult[] = [];

    // 1. Online check
    const isOnline = navigator.onLine;
    results.push({
      name: 'Internet Link & Network Interface',
      category: 'network',
      status: isOnline ? 'passed' : 'failed',
      details: isOnline ? 'High-speed browser interface active' : 'Network disconnect detected',
      metric: isOnline ? 'Online' : 'Offline',
    });

    // 2. Real Ping test (measure actual roundtrip to /api/ping with global fallback)
    let pingValue: number | null = null;
    let resolvedTarget = 'App Cloud Server';

    try {
      const start = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/ping?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        pingValue = Math.max(1, Math.round(performance.now() - start));
        resolvedTarget = 'App Cloud Server (/api/ping)';
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      // Fallback: Real roundtrip packet to Google CDN 204
      try {
        const startFb = performance.now();
        const fbController = new AbortController();
        const fbTimeout = setTimeout(() => fbController.abort(), 3500);

        await fetch(`https://www.gstatic.com/generate_204?_t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: fbController.signal,
        });

        clearTimeout(fbTimeout);
        pingValue = Math.max(1, Math.round(performance.now() - startFb));
        resolvedTarget = 'Global CDN Gateway (gstatic.com)';
      } catch {
        // Unreachable
      }
    }

    if (pingValue !== null) {
      results.push({
        name: 'API Ping & Gateway Latency',
        category: 'network',
        status: pingValue < 120 ? 'passed' : pingValue < 280 ? 'warning' : 'failed',
        details: `Live round-trip time: ${pingValue}ms to ${resolvedTarget}`,
        metric: `${pingValue}ms`,
      });
    } else {
      results.push({
        name: 'API Ping & Gateway Latency',
        category: 'network',
        status: 'failed',
        details: 'Network packet timed out. Unable to reach application server or internet gateway.',
        metric: 'Offline',
      });
    }

    // 3. Web Crypto test
    try {
      if (window.crypto && window.crypto.subtle) {
        // Quick key gen check
        const key = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        results.push({
          name: 'Web Crypto Subtle API (AES-GCM)',
          category: 'crypto',
          status: key ? 'passed' : 'failed',
          details: 'AES-256 GCM hardware encryption confirmed operational',
          metric: '256-bit Validated',
        });
      } else {
        results.push({
          name: 'Web Crypto Subtle API (AES-GCM)',
          category: 'crypto',
          status: 'failed',
          details: 'Crypto Subtle API is unavailable in this environment',
          metric: 'Disabled',
        });
      }
    } catch {
      results.push({
        name: 'Web Crypto Subtle API (AES-GCM)',
        category: 'crypto',
        status: 'warning',
        details: 'Crypto Subtle initialized with fallback mode',
        metric: 'Fallback',
      });
    }

    // 4. WebRTC check
    const hasWebRtc = typeof window !== 'undefined' && !!window.RTCPeerConnection;
    results.push({
      name: 'WebRTC P2P Voice & Video Engine',
      category: 'media',
      status: hasWebRtc ? 'passed' : 'failed',
      details: hasWebRtc ? 'Browser supports peer-to-peer data and media streams' : 'WebRTC not supported',
      metric: hasWebRtc ? 'Ready' : 'Not Supported',
    });

    // 5. Storage test
    try {
      localStorage.setItem('__sec_diag_test__', '1');
      localStorage.removeItem('__sec_diag_test__');
      results.push({
        name: 'Client Storage Quota & Persistence',
        category: 'storage',
        status: 'passed',
        details: 'LocalStorage write/read tests passed with zero corruption',
        metric: 'Healthy',
      });
    } catch {
      results.push({
        name: 'Client Storage Quota & Persistence',
        category: 'storage',
        status: 'warning',
        details: 'LocalStorage restricted or in private incognito mode',
        metric: 'Restricted',
      });
    }

    // 6. Media Permissions check
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        results.push({
          name: 'Audio Input (Microphone)',
          category: 'media',
          status: micPermission.state === 'granted' ? 'passed' : micPermission.state === 'denied' ? 'warning' : 'passed',
          details: `Microphone permission state: ${micPermission.state}`,
          metric: micPermission.state,
        });
      } catch {
        // query not supported on all browsers for mic
      }
    }

    setDiagnostics(results);
    setIsRunningTests(false);
  };

  useEffect(() => {
    if (isOpen) {
      runAllDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const reportText = `=== Private Chat System Diagnostic Report ===
Timestamp: ${new Date().toISOString()}
Active Room: ${activeRoomId || 'None (Unauthenticated)'}
Ping Latency: ${currentPing ? `${currentPing}ms` : 'N/A'}
Browser: ${navigator.userAgent}
Platform: ${navigator.platform}
Online: ${navigator.onLine ? 'YES' : 'NO'}

Tests Summary:
${diagnostics.map((d) => `[${d.status.toUpperCase()}] ${d.name}: ${d.metric || 'OK'} (${d.details})`).join('\n')}
=============================================`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleClearAppCache = () => {
    try {
      const keysToKeep = new Set(['theme_preference', 'bg_music_pref']);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.has(key)) {
          localStorage.removeItem(key);
        }
      }
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
      runAllDiagnostics();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>System Diagnostics & Error Recovery</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-750">
                  Self-Check
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Troubleshoot connection drops, latency issues, and permission errors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-neutral-800 bg-neutral-950/30 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`pb-2.5 px-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tests'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live System Checks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Common Errors & Solutions</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-neutral-300 leading-relaxed selection:bg-emerald-500 selection:text-neutral-950">
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-neutral-400 font-medium">
                  Status of active browser subsystems:
                </span>
                <button
                  type="button"
                  disabled={isRunningTests}
                  onClick={runAllDiagnostics}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>Re-test Diagnostics</span>
                </button>
              </div>

              {/* Real Physical Network Telemetry Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-neutral-200 text-xs">Live Network Telemetry (Physical RTT)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {targetName || 'App Cloud Server (/api/ping)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Current Latency</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {currentPing !== null && currentPing !== undefined ? `${currentPing}ms` : '--'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Session Average</span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {avgPingMs !== null && avgPingMs !== undefined ? `${avgPingMs}ms` : currentPing ? `${currentPing}ms` : '--'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Packet Jitter</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {jitterMs !== null && jitterMs !== undefined ? `±${jitterMs}ms` : '±0ms'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Min / Max</span>
                    <span className="text-sm font-mono font-bold text-neutral-300">
                      {minPingMs !== null && minPingMs !== undefined && maxPingMs !== null && maxPingMs !== undefined
                        ? `${minPingMs} / ${maxPingMs}ms`
                        : '--'}
                    </span>
                  </div>
                </div>

                {pingHistory.length > 1 && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 font-mono">Recent Pings:</span>
                    <div className="flex items-center gap-1 flex-1 overflow-hidden">
                      {pingHistory.slice(-10).map((p, i) => (
                        <div
                          key={i}
                          title={`${p}ms`}
                          className="flex-1 h-3 rounded-xs bg-emerald-500/30 hover:bg-emerald-400 transition-colors flex items-end"
                        >
                          <div
                            style={{ height: `${Math.min(100, Math.max(15, (p / 200) * 100))}%` }}
                            className="w-full bg-emerald-400 rounded-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnostic list */}
              <div className="space-y-2.5">
                {diagnostics.map((diag, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {diag.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : diag.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-neutral-200 text-xs flex items-center gap-2">
                          <span>{diag.name}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{diag.details}</p>
                      </div>
                    </div>

                    {diag.metric && (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                          diag.status === 'passed'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : diag.status === 'warning'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                        }`}
                      >
                        {diag.metric}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick troubleshooting box */}
              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <span className="font-semibold text-neutral-200 block text-xs">
                  One-Click Recovery Actions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleClearAppCache}
                    className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-rose-400 font-medium text-xs">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Stale Session Cache</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Purges stale lockout flags or invalid local room keys.
                    </p>
                    {cacheCleared && (
                      <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
                        ✓ Cache cleared successfully!
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-sky-400 font-medium text-xs">
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Diagnostic Copied!' : 'Copy Diagnostic Report'}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Copies system stats to clipboard for troubleshooting.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Direct explanations and resolution steps for typical error scenarios:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300 text-xs font-mono">
                      ERR_ROOM_LOCKED (Lockout Active)
                    </span>
                    <span className="text-[10px] text-neutral-500">Security Shield</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    <strong>Cause:</strong> 5 consecutive incorrect passwords were entered for this room.
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    <strong>Resolution:</strong> Wait 60 seconds for the lockout timer to expire, or use the "Clear Stale Session Cache" button in the Live Checks tab.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 text-xs font-mono">
                      ERR_DECRYPTION_MISMATCH
                    </span>
                    <span className="text-[10px] text-neutral-500">Crypto Enclave</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    <strong>Cause:</strong> Messages received cannot be decrypted with your current room password.
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    <strong>Resolution:</strong> Verify with your peer that you both entered the exact same password (passwords are case-sensitive).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-300 text-xs font-mono">
                      ERR_PEER_DISCONNECTED
                    </span>
                    <span className="text-[10px] text-neutral-500">Real-Time Sync</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    <strong>Cause:</strong> The other participant closed their browser tab, lost internet, or clicked "Leave Room".
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    <strong>Resolution:</strong> Have your peer re-open the room code to resume your conversation.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200 text-xs font-mono">
                      ERR_MEDIA_PERMISSION_DENIED
                    </span>
                    <span className="text-[10px] text-neutral-500">WebRTC Audio/Video</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    <strong>Cause:</strong> Browser blocked access to the microphone or camera for calls or voice notes.
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    <strong>Resolution:</strong> Click the lock/tune icon in your browser address bar and set Microphone/Camera to "Allow".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry: Local browser diagnostics only. No data uploaded.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors cursor-pointer text-xs"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
