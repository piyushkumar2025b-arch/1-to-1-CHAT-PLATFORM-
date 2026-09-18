import React, { FormEvent, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mic,
  Video,
  Paperclip,
  Dices,
  Eye,
  EyeOff,
  QrCode,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Radio,
  Sparkles,
  Flame,
  ArrowRight,
  Users,
  Scale,
  FileText,
  AlertTriangle,
  Wifi,
  Sun,
  Moon,
  Headphones,
  Zap,
} from 'lucide-react';
import { evaluatePasswordStrength } from '../lib/security';
import { MetaComparisonSection } from './MetaComparisonSection';
import { GroupRoomRequestForm } from './GroupRoomRequestForm';
import { InteractiveCheckeredBackground } from './InteractiveCheckeredBackground';

interface LandingHeroViewProps {
  roomId: string;
  setRoomId: (id: string) => void;
  password: string;
  setPassword: (pwd: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  authError: string;
  setAuthError: (err: string) => void;
  isSubmitting: boolean;
  lockoutTimer: { isLocked: boolean; remainingSeconds: number };
  handleRoomSubmit: (e?: FormEvent) => void;
  generateRandomRoom: () => void;
  setSecurityModalOpen: (open: boolean) => void;
  setQrScannerOpen: (open: boolean) => void;
  setRoomQrOpen: (open: boolean) => void;
  onOpenPolicyModal?: (tab?: 'privacy' | 'terms' | 'compliance') => void;
  onOpenDiagnosticsModal?: () => void;
  onOpenCustomerService?: () => void;
  pingMs?: number | null;
}

export function LandingHeroView({
  roomId,
  setRoomId,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  authError,
  setAuthError,
  isSubmitting,
  lockoutTimer,
  handleRoomSubmit,
  generateRandomRoom,
  setSecurityModalOpen,
  setQrScannerOpen,
  setRoomQrOpen,
  onOpenPolicyModal,
  onOpenDiagnosticsModal,
  onOpenCustomerService,
  pingMs,
}: LandingHeroViewProps) {
  // Default to light mode as requested, remembering user preference if toggled
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('privatechat_landing_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const toggleThemeMode = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('privatechat_landing_theme', next);
    }
  };

  const isLight = themeMode === 'light';
  const passStrength = evaluatePasswordStrength(password);

  const handleGenerateStrongPassword = () => {
    const adjectives = ['Shield', 'Secure', 'Cipher', 'Silent', 'Swift', 'Solar', 'Cosmic', 'Shadow'];
    const nouns = ['Falcon', 'Echo', 'Haven', 'Vortex', 'Apex', 'Beacon', 'Matrix', 'Pulse'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const symbols = ['#', '!', '$', '&', '*'];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const strongPass = `${adj}-${noun}-${num}${sym}`;
    setPassword(strongPass);
    setShowPassword(true);
    if (authError) setAuthError('');
  };

  const scrollToComparison = () => {
    const el = document.getElementById('comparison-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToGroupForm = () => {
    const el = document.getElementById('group-room-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between relative transition-colors duration-200 ${
        isLight
          ? 'bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white'
          : 'bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-neutral-950'
      }`}
    >
      {/* Interactive Checkered Grid Background covering entire page viewport */}
      <InteractiveCheckeredBackground
        palette="multi"
        cellSize={38}
        showControls={true}
        mode={themeMode}
        opacity={isLight ? 0.75 : 0.8}
      />

      {/* Top Navigation Bar */}
      <header
        className={`w-full border-b sticky top-0 z-30 transition-colors backdrop-blur-md ${
          isLight
            ? 'border-slate-200/90 bg-white/90 text-slate-900 shadow-xs'
            : 'border-neutral-850 bg-neutral-950/80 text-neutral-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs ${
                isLight
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-neutral-900 border border-neutral-800 text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                Private Chat
              </span>
              <p className={`text-[11px] hidden sm:block font-medium ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Direct, temporary conversations
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={scrollToComparison}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`} />
              <span>Why not Meta?</span>
            </button>

            <button
              type="button"
              onClick={scrollToGroupForm}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`} />
              <span className="hidden sm:inline">Request</span> Group Rooms
            </button>

            <button
              id="header-policy-button"
              type="button"
              onClick={() => onOpenPolicyModal?.('privacy')}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
              title="Privacy Policy and Terms in plain English"
            >
              <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`} />
              <span>Privacy Promise</span>
            </button>

            <button
              id="header-diagnostics-button"
              type="button"
              onClick={() => onOpenDiagnosticsModal?.()}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
              title="Network Diagnostics and Error Recovery"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>Diagnostics</span>
            </button>

            <button
              id="header-customer-care-button"
              type="button"
              onClick={() => onOpenCustomerService?.()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50'
                  : 'text-emerald-300 hover:text-white hover:bg-neutral-900'
              }`}
              title="Customer Care, Speed Booster & Privacy Guide"
            >
              <Headphones className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Customer Care</span>
            </button>

            <button
              id="header-security-button"
              type="button"
              onClick={() => setSecurityModalOpen(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
              title="How your privacy is protected"
            >
              <Lock className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`} />
              <span>Safety Shield</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              id="landing-theme-toggle"
              type="button"
              onClick={toggleThemeMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                  : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-750 text-amber-300'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode (Default)'}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            <button
              id="header-qr-scan-button"
              type="button"
              onClick={() => setQrScannerOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-200'
              }`}
              title="Scan QR Code to join room"
            >
              <QrCode className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-emerald-400'}`} />
              <span>Scan QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative z-10">
        {/* Left Column: Humanized Product Description with WCAG AA/AAA High Contrast */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="space-y-4">
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2] ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              Private conversations without an account.
            </h1>
            <p
              className={`text-base sm:text-lg leading-relaxed max-w-2xl font-normal ${
                isLight ? 'text-slate-700' : 'text-neutral-300'
              }`}
            >
              Choose a room name and a password with someone you want to speak with. Send text, voice notes, transfer files up to 50MB, or start an audio and video call.
            </p>
            <p
              className={`text-sm leading-relaxed max-w-2xl font-medium ${
                isLight ? 'text-slate-600' : 'text-neutral-400'
              }`}
            >
              No registration, no tracking, and no saved history. When either of you burns the room or leaves, the conversation is wiped clean.
            </p>
          </div>

          {/* Clean highlights list */}
          <div className={`pt-4 border-t space-y-4 ${isLight ? 'border-slate-200' : 'border-neutral-850'}`}>
            <div className="flex items-start gap-3 text-sm">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                  No phone numbers, emails, or profiles
                </span>
                <p className={`text-xs mt-0.5 leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  You never create an account. You only need the shared room code and password.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                  Encrypted calls, voice memos & big files
                </span>
                <p className={`text-xs mt-0.5 leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  WebRTC peer-to-peer audio and video, audio playback with waveforms, and documents up to 50MB.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                  True room burning with zero server archives
                </span>
                <p className={`text-xs mt-0.5 leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  Unlike corporate social networks that preserve deleted messages, our burn protocol immediately purges active data.
                </p>
              </div>
            </div>
          </div>

          {/* Quick links to comparison and group request */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={scrollToComparison}
              className={`font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-neutral-300 hover:text-emerald-400'
              }`}
            >
              <span>See how we compare to Instagram & Facebook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className={isLight ? 'text-slate-300 hidden sm:inline' : 'text-neutral-700 hidden sm:inline'}>•</span>
            <button
              type="button"
              onClick={scrollToGroupForm}
              className={`font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight ? 'text-amber-700 hover:text-amber-800' : 'text-neutral-300 hover:text-amber-300'
              }`}
            >
              <span>Need 3+ people? Request group rooms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Clean, High-Contrast Room Join Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div
            id="join-room-card"
            className={`w-full max-w-md backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 transition-all duration-300 border ${
              isLight
                ? 'bg-white/95 border-slate-200 shadow-slate-200/60 text-slate-900'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700/80 shadow-2xl text-neutral-100'
            }`}
          >
            <div className="space-y-1">
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                Join or create a room
              </h2>
              <p className={`text-xs leading-relaxed font-normal ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                Enter any room code and password. Share both with your contact to connect.
              </p>
            </div>

            <form onSubmit={handleRoomSubmit} className="space-y-4">
              {/* Room Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="room-input"
                    className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-neutral-300'}`}
                  >
                    Room Code
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomRoom}
                    className={`text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isLight
                        ? 'text-emerald-700 hover:text-emerald-800 hover:underline'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Generate random</span>
                  </button>
                </div>
                <input
                  id="room-input"
                  type="text"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value.toUpperCase());
                    if (authError) setAuthError('');
                  }}
                  disabled={isSubmitting}
                  autoFocus
                  placeholder="e.g. ALPHA-99"
                  maxLength={32}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-wider outline-none transition-all uppercase ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white text-slate-900 placeholder:text-slate-400 shadow-xs'
                      : 'bg-neutral-950 border border-neutral-750 focus:border-emerald-500 text-neutral-100 placeholder:text-neutral-600'
                  }`}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password-input"
                    className={`text-xs font-semibold block ${isLight ? 'text-slate-800' : 'text-neutral-300'}`}
                  >
                    Room Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStrongPassword}
                    className={`text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isLight
                        ? 'text-emerald-700 hover:text-emerald-800 hover:underline'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                    title="Generate a recommended strong password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Generate strong</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    disabled={isSubmitting}
                    placeholder="Choose any shared password"
                    className={`w-full rounded-xl px-4 pr-11 py-3 text-sm font-medium outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white text-slate-900 placeholder:text-slate-400 shadow-xs'
                        : 'bg-neutral-950 border border-neutral-750 focus:border-emerald-500 text-neutral-100 placeholder:text-neutral-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer p-1 ${
                      isLight
                        ? 'text-slate-400 hover:text-slate-700'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength & choice notice */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? 'text-slate-600' : 'text-neutral-400'}>
                      Password choice:{' '}
                      <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        better if strong
                      </span>
                    </span>
                    {password.length > 0 && (
                      <span className={`font-bold ${passStrength.color}`}>
                        {passStrength.label}
                      </span>
                    )}
                  </div>

                  {/* Visual Strength Progress Bar */}
                  {password.length > 0 && (
                    <div className={`w-full h-1.5 rounded-full overflow-hidden flex gap-1 ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passStrength.score >= 1
                            ? passStrength.score === 1
                              ? 'bg-rose-500'
                              : passStrength.score === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                            : isLight ? 'bg-slate-200' : 'bg-neutral-800'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passStrength.score >= 2
                            ? passStrength.score === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                            : isLight ? 'bg-slate-200' : 'bg-neutral-800'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passStrength.score >= 3 ? 'bg-emerald-600' : isLight ? 'bg-slate-200' : 'bg-neutral-800'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passStrength.score >= 4 ? 'bg-teal-600' : isLight ? 'bg-slate-200' : 'bg-neutral-800'
                        }`}
                      />
                    </div>
                  )}

                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                    {password.length === 0 ? (
                      <span>
                        Creating a strong password is your choice — it is better if strong for enhanced privacy and brute-force protection.
                      </span>
                    ) : (
                      <span>
                        {passStrength.feedback}{' '}
                        {passStrength.score < 3 && (
                          <span className={`font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
                            Choice is yours, but better if strong!
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Anti-Brute Force Lockout Banner */}
              {lockoutTimer.isLocked && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
                    isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <div>
                    <span className="font-bold block">Temporary lockout active</span>
                    <span>
                      Too many attempts. Access resumes in {lockoutTimer.remainingSeconds}s.
                    </span>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {authError && !lockoutTimer.isLocked && (
                <div
                  id="auth-error"
                  className={`text-xs text-center font-semibold rounded-xl py-2.5 px-3 border ${
                    isLight
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-rose-300 bg-rose-950/40 border-rose-800/60'
                  }`}
                >
                  {authError}
                </div>
              )}

              {/* Enter Button */}
              <button
                id="join-room-button"
                type="submit"
                disabled={
                  isSubmitting || !roomId.trim() || !password.trim() || lockoutTimer.isLocked
                }
                className={`w-full active:scale-[0.99] font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] text-neutral-950'
                }`}
              >
                {lockoutTimer.isLocked ? (
                  `Locked (${lockoutTimer.remainingSeconds}s)`
                ) : isSubmitting ? (
                  'Connecting...'
                ) : (
                  <>
                    <span>Enter Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Optional QR Code action */}
              <div
                className={`pt-2 border-t flex items-center justify-between text-xs ${
                  isLight ? 'border-slate-200' : 'border-neutral-800/80'
                }`}
              >
                <button
                  id="scan-qr-join-button"
                  type="button"
                  onClick={() => setQrScannerOpen(true)}
                  className={`transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                    isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code to join</span>
                </button>

                {roomId.trim().length >= 3 && (
                  <button
                    type="button"
                    onClick={() => setRoomQrOpen(true)}
                    className={`transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
                      isLight
                        ? 'text-emerald-700 hover:text-emerald-800'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                  >
                    <span>Show room QR</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Comparison Section: Differences from Instagram & Facebook */}
      <MetaComparisonSection onScrollToGroupForm={scrollToGroupForm} mode={themeMode} />

      {/* Interactive Group Room Request Form (Multi-User Expansion) */}
      <GroupRoomRequestForm mode={themeMode} />

      {/* Full-width Professional Governance & Status Footer */}
      <footer
        className={`w-full border-t py-6 px-4 sm:px-6 lg:px-8 z-10 text-xs transition-colors ${
          isLight
            ? 'border-slate-200 bg-white/95 text-slate-600'
            : 'border-neutral-850 bg-neutral-950/95 text-neutral-400'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-4">
          <div
            className={`flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4 text-center md:text-left ${
              isLight ? 'border-slate-200' : 'border-neutral-850/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  isLight
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className={`font-bold text-xs tracking-tight ${isLight ? 'text-slate-900' : 'text-neutral-200'}`}>
                Private Chat Protocol
              </span>
              <span className={isLight ? 'text-slate-300' : 'text-neutral-600'}>•</span>
              <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                Zero Server Data Retention Guarantee
              </span>
            </div>

            {/* Live Operational Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">All Systems Operational</span>
              {pingMs && (
                <>
                  <span className={isLight ? 'text-slate-300' : 'text-neutral-600'}>•</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{pingMs}ms</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <button
                type="button"
                onClick={() => onOpenPolicyModal?.('privacy')}
                className={`transition-colors cursor-pointer font-medium ${
                  isLight ? 'hover:text-emerald-700 text-slate-600' : 'hover:text-emerald-400 text-neutral-400'
                }`}
              >
                Privacy Promise
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-neutral-700'}>•</span>
              <button
                type="button"
                onClick={() => onOpenPolicyModal?.('terms')}
                className={`transition-colors cursor-pointer font-medium ${
                  isLight ? 'hover:text-emerald-700 text-slate-600' : 'hover:text-emerald-400 text-neutral-400'
                }`}
              >
                Terms of Use
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-neutral-700'}>•</span>
              <button
                type="button"
                onClick={() => onOpenPolicyModal?.('compliance')}
                className={`transition-colors cursor-pointer font-medium ${
                  isLight ? 'hover:text-emerald-700 text-slate-600' : 'hover:text-emerald-400 text-neutral-400'
                }`}
              >
                GDPR & Privacy Rights
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-neutral-700'}>•</span>
              <button
                type="button"
                onClick={() => onOpenDiagnosticsModal?.()}
                className={`transition-colors cursor-pointer flex items-center gap-1 font-medium ${
                  isLight ? 'hover:text-amber-700 text-slate-600' : 'hover:text-amber-400 text-neutral-400'
                }`}
              >
                <AlertTriangle className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>Errors & Diagnostics</span>
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-neutral-700'}>•</span>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(true)}
                className={`transition-colors cursor-pointer font-medium ${
                  isLight ? 'hover:text-sky-700 text-slate-600' : 'hover:text-sky-400 text-neutral-400'
                }`}
              >
                Privacy & Safety Shield
              </button>
            </div>

            <div className={`text-center sm:text-right ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
              Your messages and files are permanently deleted whenever you leave or clear the chat.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
