import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Wifi,
  Phone,
  Video,
  Search,
  Archive,
  Music,
  MoreVertical,
  Palette,
  Share2,
  QrCode,
  Bell,
  BellOff,
  AlertTriangle,
  FileText,
  Maximize2,
  Minimize2,
  LogOut,
  BellRing,
  Keyboard,
  Sparkles,
  Edit3,
  Flame,
  Eye,
  EyeOff,
  Code2,
  MonitorUp,
  Headphones,
  Zap,
  Star,
  Download,
  ShieldAlert,
  Sliders,
  Bookmark,
  KeyRound,
} from 'lucide-react';
import { ConnectionState, ChatTheme, EphemeralTimerOption } from '../types';

interface ChatHeaderProps {
  activeRoomId: string;
  copiedCode: boolean;
  onCopyRoomId: () => void;
  connectionState: ConnectionState;
  pingMs: number | null;
  pingQuality: 'fast' | 'moderate' | 'slow' | 'offline';
  jitterMs?: number | null;
  avgPingMs?: number | null;
  targetName: string;
  onOpenDiagnostics: () => void;
  onOpenCustomerService?: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onOpenSearch: () => void;
  isSearchOpen: boolean;
  onOpenVault: () => void;
  vaultItemCount: number;
  onOpenScratchpad: () => void;
  onToggleMusic: () => void;
  isMusicOpen: boolean;
  activeSongName: string | null;
  onOpenThemeModal: () => void;
  onOpenShareModal: () => void;
  onOpenQrModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenNotificationModal: () => void;
  soundEnabled: boolean;
  onOpenPolicyModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onLeaveRoom: () => void;
  currentTheme: ChatTheme;
  notifPermission?: NotificationPermission | 'unsupported';
  onRequestDesktopPermission?: () => void;
  onOpenShortcuts?: () => void;
  ephemeralEnabled?: boolean;
  ephemeralDurationOption?: EphemeralTimerOption;
  onOpenEphemeralSettings?: () => void;
  onLockSession?: () => void;
  onOpenCodeSandbox?: () => void;
  blurGuardActive?: boolean;
  onToggleBlurGuard?: () => void;
  isScreenSharing?: boolean;
  starredCount?: number;
  onOpenStarredMessages?: () => void;
  onOpenExportModal?: () => void;
  onTriggerStealthDecoy?: () => void;
  onOpenDisplaySettings?: () => void;
  onOpenQuickReplies?: () => void;
  onOpenPersonalNotes?: () => void;
  onOpenCryptoCipher?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeRoomId,
  copiedCode,
  onCopyRoomId,
  connectionState,
  pingMs,
  pingQuality,
  jitterMs,
  avgPingMs,
  targetName,
  onOpenDiagnostics,
  onOpenCustomerService,
  onOpenShortcuts,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenSearch,
  isSearchOpen,
  onOpenVault,
  vaultItemCount,
  onOpenScratchpad,
  onToggleMusic,
  isMusicOpen,
  activeSongName,
  onOpenThemeModal,
  onOpenShareModal,
  onOpenQrModal,
  onOpenSecurityModal,
  onOpenNotificationModal,
  soundEnabled,
  onOpenPolicyModal,
  isFullscreen,
  onToggleFullscreen,
  onLeaveRoom,
  currentTheme,
  notifPermission,
  onRequestDesktopPermission,
  ephemeralEnabled = false,
  ephemeralDurationOption = '1m',
  onOpenEphemeralSettings,
  onLockSession,
  onOpenCodeSandbox,
  blurGuardActive = false,
  onToggleBlurGuard,
  isScreenSharing = false,
  starredCount = 0,
  onOpenStarredMessages,
  onOpenExportModal,
  onTriggerStealthDecoy,
  onOpenDisplaySettings,
  onOpenQuickReplies,
  onOpenPersonalNotes,
  onOpenCryptoCipher,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [moreMenuOpen]);

  return (
    <header
      id="chat-header"
      className={`w-full px-3 sm:px-5 py-2.5 border-b backdrop-blur-md flex items-center justify-between z-30 shrink-0 select-none ${currentTheme.headerStyle}`}
    >
      {/* LEFT SECTION: Room Identity & Connectivity */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Room Code Badge with Copy Action */}
        <div
          onClick={onCopyRoomId}
          title={copiedCode ? 'Copied to clipboard!' : 'Click to copy room code'}
          className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 rounded-xl px-2 sm:px-2.5 py-1 transition-all cursor-pointer group select-none active:scale-98"
        >
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-70 hidden md:inline">
              ROOM:
            </span>
          </div>

          <span
            style={{ color: currentTheme.accentColor }}
            className="font-mono text-xs sm:text-sm font-bold tracking-tight"
          >
            {activeRoomId}
          </span>

          <button
            id="copy-room-id-button"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopyRoomId();
            }}
            title="Copy room code"
            className="ml-1 p-1 hover:bg-white/10 rounded-md text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-150" />
            ) : (
              <Copy className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>

        {/* Real-time Connection Status Pill */}
        <div id="connection-status-badge" className="hidden xs:flex">
          {connectionState === 'connected' ? (
            <span className="inline-flex items-center text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 mr-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Both connected</span>
              <span className="sm:hidden">Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] font-medium text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 mr-1.5 bg-amber-400 rounded-full animate-ping" />
              <span className="hidden sm:inline">Waiting for friend...</span>
              <span className="sm:hidden">Waiting</span>
            </span>
          )}
        </div>

        {/* Live Network Latency Badge */}
        <button
          id="network-ping-indicator"
          type="button"
          onClick={onOpenDiagnostics}
          title={
            pingMs !== null
              ? `Real Network Latency: ${pingMs}ms (${pingQuality.toUpperCase()})\n` +
                (jitterMs !== null && jitterMs !== undefined ? `Jitter: ±${jitterMs}ms | ` : '') +
                (avgPingMs !== null && avgPingMs !== undefined ? `Avg: ${avgPingMs}ms\n` : '') +
                `Target: ${targetName || 'App Cloud Server'}\nClick for Live System Diagnostics`
              : `Measuring real network ping... Click for diagnostics`
          }
          className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 hover:bg-black/60 border border-neutral-750 hover:border-neutral-600 transition-all cursor-pointer text-xs"
        >
          <Wifi
            className={`w-3 h-3 ${
              pingQuality === 'fast'
                ? 'text-emerald-400'
                : pingQuality === 'moderate'
                ? 'text-amber-400'
                : pingQuality === 'slow'
                ? 'text-rose-400'
                : 'text-neutral-500'
            }`}
          />
          <span className="font-mono text-[10px] text-neutral-300 font-semibold">
            {pingQuality === 'offline' ? 'Offline' : pingMs !== null ? `${pingMs}ms` : '...'}
          </span>
        </button>

        {/* Peer Name Badge */}
        {targetName && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium truncate max-w-[100px]">{targetName}</span>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Primary Communication & Secondary Tools */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Free Voice Call */}
        <button
          id="voice-call-toggle-button"
          type="button"
          onClick={onStartVoiceCall}
          disabled={connectionState !== 'connected'}
          title={
            connectionState === 'connected'
              ? 'Start 1-to-1 Voice Call'
              : 'Connect with your friend to start a call'
          }
          className="p-2 rounded-xl text-sky-400 border border-sky-500/25 bg-sky-950/30 hover:bg-sky-900/40 hover:border-sky-400/50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-semibold text-sky-300">Call</span>
        </button>

        {/* Free Video Call */}
        <button
          id="video-call-toggle-button"
          type="button"
          onClick={onStartVideoCall}
          disabled={connectionState !== 'connected'}
          title={
            connectionState === 'connected'
              ? 'Start 1-to-1 Video Call'
              : 'Connect with your friend to start video'
          }
          className="p-2 rounded-xl text-emerald-400 border border-emerald-500/25 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-400/50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Video className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-semibold text-emerald-300">Video</span>
        </button>

        {/* Message Search Button */}
        <button
          id="toggle-chat-search-button"
          type="button"
          onClick={onOpenSearch}
          title="Search messages (Ctrl+K or Ctrl+F)"
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
            isSearchOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-400/40'
              : 'bg-black/40 hover:bg-white/10 text-neutral-300 border-white/10 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-xs font-medium">Search</span>
          <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-neutral-400 border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* Chat Vault */}
        <button
          id="chat-vault-button"
          type="button"
          onClick={onOpenVault}
          title="Chat Vault & Media Archives"
          className="p-2 rounded-xl text-amber-300 border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Archive className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline text-xs font-semibold">Vault</span>
          {vaultItemCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold">
              {vaultItemCount}
            </span>
          )}
        </button>

        {/* Collaborative Scratchpad & Whiteboard */}
        <button
          id="collaborative-scratchpad-button"
          type="button"
          onClick={onOpenScratchpad}
          title="Collaborative Scratchpad & Whiteboard Canvas"
          className="p-2 rounded-xl text-teal-300 border border-teal-500/30 bg-teal-950/30 hover:bg-teal-900/40 hover:border-teal-400/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Edit3 className="w-4 h-4 text-teal-400" />
          <span className="hidden md:inline text-xs font-semibold">Canvas</span>
        </button>

        {/* Starred Messages */}
        {onOpenStarredMessages && (
          <button
            id="starred-messages-header-button"
            type="button"
            onClick={onOpenStarredMessages}
            title="Starred Messages & Important Bookmarks"
            className="p-2 rounded-xl text-amber-300 border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="hidden lg:inline text-xs font-semibold">Starred</span>
            {starredCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold">
                {starredCount}
              </span>
            )}
          </button>
        )}

        {/* Customer Care & Safety Center */}
        {onOpenCustomerService && (
          <button
            id="customer-care-header-button"
            type="button"
            onClick={onOpenCustomerService}
            title="Customer Care, Speed Booster & Privacy Guide"
            className="p-2 rounded-xl text-emerald-300 border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-400/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Headphones className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline text-xs font-semibold">Care & Help</span>
          </button>
        )}

        {/* Disappearing Messages Quick Button */}
        <button
          id="ephemeral-settings-header-button"
          type="button"
          onClick={onOpenEphemeralSettings}
          title={
            ephemeralEnabled
              ? `Auto-disappearing messages ACTIVE (${ephemeralDurationOption}) - Click to configure or turn off`
              : 'Auto-disappearing messages OFF - Click to turn on'
          }
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
            ephemeralEnabled
              ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 ring-1 ring-amber-400/50'
              : 'bg-black/40 hover:bg-white/10 text-neutral-300 border-white/10 hover:text-amber-300'
          }`}
        >
          <Flame className={`w-4 h-4 ${ephemeralEnabled ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
          <span className="hidden xl:inline text-xs font-semibold">
            {ephemeralEnabled ? ephemeralDurationOption : 'Timer'}
          </span>
        </button>

        {/* Background Music Player */}
        <button
          id="bg-music-toggle-button"
          type="button"
          onClick={onToggleMusic}
          title={activeSongName ? `Music: ${activeSongName}` : 'Background Lo-Fi Music'}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSongName
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-400/40'
              : 'bg-black/40 hover:bg-white/10 text-neutral-300 border-white/10'
          }`}
        >
          <Music className={`w-4 h-4 text-emerald-400 ${activeSongName ? 'animate-pulse' : ''}`} />
          <span className="hidden xl:inline text-xs font-semibold">
            {activeSongName ? 'Music' : 'Music'}
          </span>
          {activeSongName && (
            <div className="flex items-end gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </button>

        {/* Notifications Alert Quick Toggle */}
        <button
          id="notifications-toggle-button"
          type="button"
          onClick={onOpenNotificationModal}
          title={soundEnabled ? 'Alerts active (click to configure)' : 'Alerts muted'}
          className={`p-2 rounded-xl border transition-all cursor-pointer hidden md:flex items-center gap-1 ${
            soundEnabled
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-black/40 border-neutral-750 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {soundEnabled ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Quick Lock Session Button */}
        {onLockSession && (
          <button
            id="quick-lock-session-button"
            type="button"
            onClick={onLockSession}
            title="Lock chat session for privacy (Esc or Ctrl+Shift+L)"
            className="p-2 rounded-xl border border-amber-500/30 bg-black/40 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-xs font-semibold">Lock</span>
          </button>
        )}

        {/* Code Snippet Sandbox */}
        {onOpenCodeSandbox && (
          <button
            id="code-sandbox-header-button"
            type="button"
            onClick={onOpenCodeSandbox}
            title="Code Snippet Sandbox (Syntax Highlighting & REPL)"
            className="p-2 rounded-xl border border-cyan-500/30 bg-black/40 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden xl:inline text-xs font-semibold">Code</span>
          </button>
        )}

        {/* Screenshot & Blur Guard Toggle */}
        {onToggleBlurGuard && (
          <button
            id="blur-guard-toggle-button"
            type="button"
            onClick={onToggleBlurGuard}
            title={
              blurGuardActive
                ? 'Screenshot & Blur Guard: ACTIVE (Click to turn off)'
                : 'Screenshot & Blur Guard: OFF (Click to obscure chat for privacy)'
            }
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              blurGuardActive
                ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-400/50'
                : 'bg-black/40 hover:bg-white/10 text-neutral-300 border-white/10 hover:text-emerald-300'
            }`}
          >
            {blurGuardActive ? (
              <EyeOff className="w-4 h-4 text-emerald-400" />
            ) : (
              <Eye className="w-4 h-4 text-neutral-400" />
            )}
            <span className="hidden xl:inline text-xs font-semibold">
              {blurGuardActive ? 'Guarded' : 'Guard'}
            </span>
          </button>
        )}

        {/* MORE OPTIONS DROPDOWN MENU */}
        <div className="relative" ref={menuRef}>
          <button
            id="more-options-menu-button"
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            title="More chat actions & room settings"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              moreMenuOpen
                ? 'bg-neutral-800 text-white border-white/20 ring-1 ring-white/20'
                : 'bg-black/40 hover:bg-white/10 text-neutral-300 border-white/10'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Popover Dropdown */}
          {moreMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900/95 border border-neutral-750 backdrop-blur-xl rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col divide-y divide-neutral-800">
              <div className="py-1">
                {/* Themes & Wallpaper */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenThemeModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Themes & Wallpapers</span>
                </button>

                {/* Share Room Link */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenShareModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share Invite Link</span>
                </button>

                {/* Room QR Code */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenQrModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Room QR Code</span>
                </button>

                {/* Collaborative Scratchpad & Whiteboard */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenScratchpad();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-teal-400" />
                  <span>Scratchpad & Whiteboard</span>
                </button>

                {/* Code Snippet Sandbox */}
                {onOpenCodeSandbox && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCodeSandbox();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Code Snippet Sandbox</span>
                  </button>
                )}

                {/* Screenshot & Blur Guard */}
                {onToggleBlurGuard && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleBlurGuard();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {blurGuardActive ? (
                        <EyeOff className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-neutral-400" />
                      )}
                      <span>Screenshot & Blur Guard</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        blurGuardActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {blurGuardActive ? 'Active' : 'Off'}
                    </span>
                  </button>
                )}

                {/* Starred Messages */}
                {onOpenStarredMessages && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenStarredMessages();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-amber-300 hover:text-amber-200 hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>Starred Messages</span>
                    </div>
                    {starredCount > 0 && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {starredCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Encrypted Notes to Self & Scratchpad */}
                {onOpenPersonalNotes && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPersonalNotes();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-amber-300 hover:text-amber-200 hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <span>Encrypted Notes to Self</span>
                    </div>
                    <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      /notes
                    </kbd>
                  </button>
                )}

                {/* Cryptographic Cipher & Hash Toolkit */}
                {onOpenCryptoCipher && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCryptoCipher();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Crypto & Cipher Toolkit</span>
                    </div>
                    <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      /cipher
                    </kbd>
                  </button>
                )}

                {/* Export Chat Transcript */}
                {onOpenExportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExportModal();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Export Transcript (.txt / .json)</span>
                  </button>
                )}

                {/* Quick Canned Replies */}
                {onOpenQuickReplies && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuickReplies();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Quick Canned Replies & Templates</span>
                    </div>
                    <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      /quick
                    </kbd>
                  </button>
                )}

                {/* Chat Appearance & Text Size */}
                {onOpenDisplaySettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDisplaySettings();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Display Styling, Fonts & Bubbles</span>
                  </button>
                )}

                {/* Panic & Stealth Camouflage */}
                {onTriggerStealthDecoy && (
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerStealthDecoy();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Panic Stealth Decoy</span>
                    </div>
                    <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Esc x2
                    </kbd>
                  </button>
                )}
              </div>

              <div className="py-1">
                {/* Lock Chat Session for Privacy */}
                {onLockSession && (
                  <button
                    type="button"
                    onClick={() => {
                      onLockSession();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Lock Screen (Hide Messages)</span>
                  </button>
                )}

                {/* Military-Grade Security Shield & Burn Room */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurityModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Privacy & Safety Shield</span>
                </button>

                {/* Customer Care, Speed Booster & Privacy Guide */}
                {onOpenCustomerService && (
                  <button
                    id="menu-customer-care-button"
                    type="button"
                    onClick={() => {
                      onOpenCustomerService();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>Customer Care & Help Desk</span>
                  </button>
                )}

                {/* Disappearing Messages Setting */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenEphemeralSettings?.();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className={`w-4 h-4 ${ephemeralEnabled ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span>Disappearing Messages</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      ephemeralEnabled
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {ephemeralEnabled ? ephemeralDurationOption : 'Off'}
                  </span>
                </button>

                {/* Sound & Notification Settings */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenNotificationModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Sound & Notification Settings</span>
                </button>

                {/* System Diagnostics */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenDiagnostics();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Diagnostics & Network Health</span>
                </button>

                {/* Keyboard Shortcuts */}
                {onOpenShortcuts && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShortcuts();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Keyboard className="w-4 h-4 text-amber-400" />
                      <span>Keyboard Shortcuts</span>
                    </div>
                    <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      ?
                    </kbd>
                  </button>
                )}
              </div>

              <div className="py-1">
                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleFullscreen();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-neutral-400" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-neutral-400" />
                      <span>Enter Fullscreen</span>
                    </>
                  )}
                </button>

                {/* Privacy & Terms */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenPolicyModal();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>Privacy Promise & Terms</span>
                </button>
              </div>

              <div className="py-1">
                {/* Leave Room Action */}
                <button
                  type="button"
                  onClick={() => {
                    onLeaveRoom();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Leave Chat (Clear Messages)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Leave Room Button */}
        <button
          id="leave-chat-button"
          type="button"
          onClick={onLeaveRoom}
          title="Leave Chat & Clear Messages"
          className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
