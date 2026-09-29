import React, { memo, useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Mic,
  Terminal,
  Smile,
  Flame,
  Link2,
  Send,
  X,
  Code2,
  Pencil,
  Check,
  Bold,
  Italic,
  EyeOff,
  BarChart2,
  PenTool,
  Clock,
  Zap,
  Strikethrough,
  Code,
  Quote,
  Bookmark,
  KeyRound,
  Radio,
  Trash2,
  Lock,
  Split,
  Table,
  Image as ImageIcon,
  AlertOctagon,
  Key,
  Waves,
  ShieldCheck,
  FileSignature,
  Bird,
  Hourglass,
  Plus,
  Type,
  Search,
  Sparkles,
} from 'lucide-react';
import { ConnectionState, ChatTheme, EphemeralTimerOption, ReplyReference, ChatMessage } from '../types';
import ReplyBanner from './ReplyBanner';
import { StagedAttachmentPreview } from './StagedAttachmentPreview';
import VoiceRecorderBar from './VoiceRecorderBar';
import { SlashCommandMenu, SlashCommand } from './SlashCommandMenu';

export interface ChatInputBarProps {
  connectionState: ConnectionState;
  inputText: string;
  replyingTo: ReplyReference | null;
  onCancelReply: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEditMessage?: () => void;
  stagedFile: File | null;
  stagedPreviewUrl: string | null;
  onClearStagedFile: () => void;
  onEditImage?: () => void;
  isViewOnce?: boolean;
  onToggleViewOnce?: () => void;
  isRecordingVoice: boolean;
  voiceVolume: number;
  onStartVoiceRecording: () => void;
  onCancelVoiceRecording: () => void;
  onSendVoiceRecording: () => void;
  slashMenuOpen: boolean;
  setSlashMenuOpen: (open: boolean) => void;
  slashFilter: string;
  setSlashFilter: (filter: string) => void;
  onExecuteSlashCommand: (cmd: SlashCommand) => void;
  emojiPickerOpen: boolean;
  setEmojiPickerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  ephemeralEnabled: boolean;
  ephemeralDurationOption: EphemeralTimerOption;
  onOpenEphemeralModal: () => void;
  onOpenShareLinkModal: () => void;
  onOpenCodeSandbox?: () => void;
  onOpenCreatePoll?: () => void;
  onOpenQuickDraw?: () => void;
  onOpenScheduleMessage?: () => void;
  onOpenQuickReplies?: () => void;
  onOpenPersonalNotes?: () => void;
  onOpenCryptoCipher?: () => void;
  onOpenPasswordGenerator?: () => void;
  onOpenBurnOnRead?: () => void;
  onOpenSteganography?: () => void;
  onOpenAcousticShield?: () => void;
  onOpenFileShredder?: () => void;
  onOpenTimeLock?: () => void;
  onOpenVoiceDisguise?: () => void;
  onOpenShamirSecret?: () => void;
  onOpenTableGenerator?: () => void;
  onOpenPhotoObfuscator?: () => void;
  onOpenDeadMansSwitch?: () => void;
  onOpenOneTimePad?: () => void;
  onOpenExifScrubber?: () => void;
  onOpenAudioSteganography?: () => void;
  onOpenDualHandshake?: () => void;
  onOpenWarrantCanary?: () => void;
  onOpenCovertCamouflage?: () => void;
  onOpenRoomLifespan?: () => void;
  onOpenNotaryAttestation?: () => void;
  onOpenZkpChallenge?: () => void;
  onOpenDuressCalculator?: () => void;
  onOpenCustomerService?: () => void;
  sendKeyPreference?: 'enter' | 'ctrl_enter';
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  isDictating?: boolean;
  onToggleDictate?: () => void;
  voiceLiveTranscript?: string;
  onSendMessageOrFile: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  currentTheme: ChatTheme;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ChatInputBar = memo<ChatInputBarProps>(
  ({
    connectionState,
    inputText,
    replyingTo,
    onCancelReply,
    editingMessage,
    onCancelEditMessage,
    stagedFile,
    stagedPreviewUrl,
    onClearStagedFile,
    onEditImage,
    isViewOnce = false,
    onToggleViewOnce,
    isRecordingVoice,
    voiceVolume,
    onStartVoiceRecording,
    onCancelVoiceRecording,
    onSendVoiceRecording,
    slashMenuOpen,
    setSlashMenuOpen,
    slashFilter,
    setSlashFilter,
    onExecuteSlashCommand,
    emojiPickerOpen,
    setEmojiPickerOpen,
    ephemeralEnabled,
    ephemeralDurationOption,
    onOpenEphemeralModal,
    onOpenShareLinkModal,
    onOpenCodeSandbox,
    onOpenCreatePoll,
    onOpenQuickDraw,
    onOpenScheduleMessage,
    onOpenQuickReplies,
    onOpenPersonalNotes,
    onOpenCryptoCipher,
    onOpenPasswordGenerator,
    onOpenBurnOnRead,
    onOpenSteganography,
    onOpenAcousticShield,
    onOpenFileShredder,
    onOpenTimeLock,
    onOpenVoiceDisguise,
    onOpenShamirSecret,
    onOpenTableGenerator,
    onOpenPhotoObfuscator,
    onOpenDeadMansSwitch,
    onOpenOneTimePad,
    onOpenExifScrubber,
    onOpenAudioSteganography,
    onOpenDualHandshake,
    onOpenWarrantCanary,
    onOpenCovertCamouflage,
    onOpenRoomLifespan,
    onOpenNotaryAttestation,
    onOpenZkpChallenge,
    onOpenDuressCalculator,
    onOpenCustomerService,
    sendKeyPreference = 'enter',
    showCharacterCount = true,
    showWordCount = true,
    isDictating = false,
    onToggleDictate,
    voiceLiveTranscript,
    onSendMessageOrFile,
    onFileSelect,
    fileInputRef,
    textareaRef,
    currentTheme,
    onPaste,
    onTextareaChange,
    onTextareaKeyDown,
  }) => {
    // Both 'connected' and 'waiting' mean the user is inside an authenticated private room!
    const isInRoom = connectionState === 'connected' || connectionState === 'waiting';

    const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
    const [formatToolbarOpen, setFormatToolbarOpen] = useState(false);
    const [toolCategory, setToolCategory] = useState<'all' | 'interactive' | 'security' | 'tools'>('all');
    const [toolSearchQuery, setToolSearchQuery] = useState('');
    const toolsMenuRef = useRef<HTMLDivElement | null>(null);

    // Close popovers on outside click or Escape
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (toolsMenuOpen) setToolsMenuOpen(false);
          if (formatToolbarOpen) setFormatToolbarOpen(false);
        }
      };
      const handleOutsideClick = (e: MouseEvent) => {
        if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
          setToolsMenuOpen(false);
        }
      };
      if (toolsMenuOpen || formatToolbarOpen) {
        document.addEventListener('keydown', handleKeyDown);
      }
      if (toolsMenuOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }, [toolsMenuOpen, formatToolbarOpen]);

    const insertFormatting = (prefix: string, suffix: string, placeholder = 'text') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentVal = textarea.value || '';
      const selected = currentVal.substring(start, end);
      const insertText = selected || placeholder;

      const newVal =
        currentVal.substring(0, start) + prefix + insertText + suffix + currentVal.substring(end);

      textarea.value = newVal;

      const syntheticEvent = {
        target: textarea,
        currentTarget: textarea,
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
      onTextareaChange(syntheticEvent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + insertText.length
        );
        if (textarea?.style) {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight || 0, 128)}px`;
        }
      }, 30);
    };

    const handleToolSelect = (action?: () => void) => {
      if (action) {
        action();
      }
      setToolsMenuOpen(false);
    };

    // All available tools with metadata for search & categorisation
    const allTools = [
      // 1. Interactive & Media
      {
        id: 'create-poll-input-button',
        title: 'Encrypted Poll',
        desc: 'Single or multi-choice instant voting',
        icon: BarChart2,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'interactive',
        action: onOpenCreatePoll,
        available: Boolean(onOpenCreatePoll),
      },
      {
        id: 'quick-draw-input-button',
        title: 'Quick Sketch',
        desc: 'Draw doodle or diagram on canvas',
        icon: PenTool,
        color: 'text-emerald-400',
        bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40',
        category: 'interactive',
        action: onOpenQuickDraw,
        available: Boolean(onOpenQuickDraw),
      },
      {
        id: 'code-sandbox-input-button',
        title: 'Code Sandbox',
        desc: 'Syntax-highlighted code snippet & runner',
        icon: Code2,
        color: 'text-cyan-400',
        bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/40',
        category: 'interactive',
        action: onOpenCodeSandbox,
        available: Boolean(onOpenCodeSandbox),
      },
      {
        id: 'table-generator-desktop-button',
        title: 'Table Matrix',
        desc: 'Interactive encrypted data table builder',
        icon: Table,
        color: 'text-teal-400',
        bg: 'hover:bg-teal-500/10 hover:border-teal-500/40',
        category: 'interactive',
        action: onOpenTableGenerator,
        available: Boolean(onOpenTableGenerator),
      },
      {
        id: 'photo-obfuscator-desktop-button',
        title: 'Photo Redactor',
        desc: 'Scratch-to-reveal foil & face blur',
        icon: ImageIcon,
        color: 'text-rose-400',
        bg: 'hover:bg-rose-500/10 hover:border-rose-500/40',
        category: 'interactive',
        action: onOpenPhotoObfuscator,
        available: Boolean(onOpenPhotoObfuscator),
      },
      {
        id: 'share-link-input-button',
        title: 'Share Web Link',
        desc: 'Post verified URL preview card',
        icon: Link2,
        color: 'text-purple-400',
        bg: 'hover:bg-purple-500/10 hover:border-purple-500/40',
        category: 'interactive',
        action: onOpenShareLinkModal,
        available: true,
      },

      // 2. Cryptographic Security Enclave
      {
        id: 'burn-on-read-desktop-button',
        title: 'Burn Note',
        desc: 'Self-destructing secret on first view',
        icon: Flame,
        color: 'text-orange-400',
        bg: 'hover:bg-orange-500/10 hover:border-orange-500/40',
        category: 'security',
        action: onOpenBurnOnRead,
        available: Boolean(onOpenBurnOnRead),
      },
      {
        id: 'timelock-desktop-button',
        title: 'Time Capsule',
        desc: 'Message locked until future timestamp',
        icon: Lock,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'security',
        action: onOpenTimeLock,
        available: Boolean(onOpenTimeLock),
      },
      {
        id: 'steganography-desktop-button',
        title: 'Steganography',
        desc: 'Conceal invisible text in zero-width unicode',
        icon: EyeOff,
        color: 'text-cyan-300',
        bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/40',
        category: 'security',
        action: onOpenSteganography,
        available: Boolean(onOpenSteganography),
      },
      {
        id: 'file-shredder-desktop-button',
        title: 'File Shredder',
        desc: 'DoD 5220.22-M digital multi-pass sanitization',
        icon: Trash2,
        color: 'text-rose-400',
        bg: 'hover:bg-rose-500/10 hover:border-rose-500/40',
        category: 'security',
        action: onOpenFileShredder,
        available: Boolean(onOpenFileShredder),
      },
      {
        id: 'otp-desktop-button',
        title: 'One-Time Pad',
        desc: 'Information-theoretic Shannon secrecy cipher',
        icon: Key,
        color: 'text-amber-300',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'security',
        action: onOpenOneTimePad,
        available: Boolean(onOpenOneTimePad),
      },
      {
        id: 'shamir-desktop-button',
        title: 'Shamir Split',
        desc: 'Threshold secret sharing & key recovery',
        icon: Split,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'security',
        action: onOpenShamirSecret,
        available: Boolean(onOpenShamirSecret),
      },
      {
        id: 'deadman-desktop-button',
        title: "Dead Man's Switch",
        desc: 'Automated release escrow upon inactivity',
        icon: AlertOctagon,
        color: 'text-rose-400',
        bg: 'hover:bg-rose-500/10 hover:border-rose-500/40',
        category: 'security',
        action: onOpenDeadMansSwitch,
        available: Boolean(onOpenDeadMansSwitch),
      },
      {
        id: 'acoustic-shield-desktop-button',
        title: 'Acoustic Shield',
        desc: 'Mic jamming & speech privacy frequencies',
        icon: Radio,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'security',
        action: onOpenAcousticShield,
        available: Boolean(onOpenAcousticShield),
      },
      {
        id: 'voice-disguise-desktop-button',
        title: 'Voice Disguise',
        desc: 'DSP vocal pitch shifter & formant morph',
        icon: Mic,
        color: 'text-purple-400',
        bg: 'hover:bg-purple-500/10 hover:border-purple-500/40',
        category: 'security',
        action: onOpenVoiceDisguise,
        available: Boolean(onOpenVoiceDisguise),
      },
      {
        id: 'exif-scrubber-desktop-button',
        title: 'EXIF Scrubber',
        desc: 'Sanitize GPS coordinates & camera metadata',
        icon: ShieldCheck,
        color: 'text-emerald-400',
        bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40',
        category: 'security',
        action: onOpenExifScrubber,
        available: Boolean(onOpenExifScrubber),
      },
      {
        id: 'sonar-desktop-button',
        title: 'Stego Sonar',
        desc: 'Acoustic ultrasonic FSK data chirp transmitter',
        icon: Waves,
        color: 'text-cyan-400',
        bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/40',
        category: 'security',
        action: onOpenAudioSteganography,
        available: Boolean(onOpenAudioSteganography),
      },
      {
        id: 'handshake-desktop-button',
        title: 'Dual Handshake',
        desc: '2-of-2 multisig cryptographic contract pact',
        icon: FileSignature,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'security',
        action: onOpenDualHandshake,
        available: Boolean(onOpenDualHandshake),
      },
      {
        id: 'warrant-canary-desktop-button',
        title: 'Warrant Canary',
        desc: 'Signed integrity declaration against coercion',
        icon: Bird,
        color: 'text-emerald-400',
        bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40',
        category: 'security',
        action: onOpenWarrantCanary,
        available: Boolean(onOpenWarrantCanary),
      },
      {
        id: 'covert-camouflage-desktop-button',
        title: 'Covert Decoy',
        desc: 'Disguise screen into innocent spreadsheet',
        icon: EyeOff,
        color: 'text-purple-400',
        bg: 'hover:bg-purple-500/10 hover:border-purple-500/40',
        category: 'security',
        action: onOpenCovertCamouflage,
        available: Boolean(onOpenCovertCamouflage),
      },
      {
        id: 'room-lifespan-desktop-button',
        title: 'Burner Lifespan',
        desc: 'Automatic room wipe countdown timer',
        icon: Hourglass,
        color: 'text-orange-400',
        bg: 'hover:bg-orange-500/10 hover:border-orange-500/40',
        category: 'security',
        action: onOpenRoomLifespan,
        available: Boolean(onOpenRoomLifespan),
      },
      {
        id: 'notary-attestation-desktop-button',
        title: 'Notary Seal',
        desc: 'Cryptographic SHA-256 attestation seal',
        icon: FileSignature,
        color: 'text-emerald-400',
        bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40',
        category: 'security',
        action: onOpenNotaryAttestation,
        available: Boolean(onOpenNotaryAttestation),
      },
      {
        id: 'zkp-challenge-desktop-button',
        title: 'ZKP Proof',
        desc: 'Zero-knowledge proof challenge authentication',
        icon: ShieldCheck,
        color: 'text-cyan-400',
        bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/40',
        category: 'security',
        action: onOpenZkpChallenge,
        available: Boolean(onOpenZkpChallenge),
      },
      {
        id: 'duress-calculator-desktop-button',
        title: 'Duress Decoy',
        desc: 'Covert functional calculator with panic wipe',
        icon: Lock,
        color: 'text-rose-400',
        bg: 'hover:bg-rose-500/10 hover:border-rose-500/40',
        category: 'security',
        action: onOpenDuressCalculator,
        available: Boolean(onOpenDuressCalculator),
      },

      // 3. Utilities & Productivity
      {
        id: 'quick-replies-desktop-button',
        title: 'Quick Replies',
        desc: 'Canned response templates (/quick)',
        icon: Zap,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'tools',
        action: onOpenQuickReplies,
        available: Boolean(onOpenQuickReplies),
      },
      {
        id: 'personal-notes-desktop-button',
        title: 'Personal Notes',
        desc: 'Encrypted private scratchpad (/notes)',
        icon: Bookmark,
        color: 'text-amber-300',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'tools',
        action: onOpenPersonalNotes,
        available: Boolean(onOpenPersonalNotes),
      },
      {
        id: 'crypto-cipher-desktop-button',
        title: 'Cipher Toolkit',
        desc: 'Hashes, Morse code & ROT13 cipher (/cipher)',
        icon: KeyRound,
        color: 'text-amber-400',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'tools',
        action: onOpenCryptoCipher,
        available: Boolean(onOpenCryptoCipher),
      },
      {
        id: 'password-generator-desktop-button',
        title: 'Pass Generator',
        desc: 'High-entropy passphrase studio (/password)',
        icon: KeyRound,
        color: 'text-amber-300',
        bg: 'hover:bg-amber-500/10 hover:border-amber-500/40',
        category: 'tools',
        action: onOpenPasswordGenerator,
        available: Boolean(onOpenPasswordGenerator),
      },
      {
        id: 'customer-service-desktop-button',
        title: 'Help & Care',
        desc: 'Latency booster, troubleshooting & care guide',
        icon: Zap,
        color: 'text-sky-400',
        bg: 'hover:bg-sky-500/10 hover:border-sky-500/40',
        category: 'tools',
        action: onOpenCustomerService,
        available: Boolean(onOpenCustomerService),
      },
    ];

    const filteredTools = allTools.filter((tool) => {
      if (!tool.available) return false;
      if (toolCategory !== 'all' && tool.category !== toolCategory) return false;
      if (toolSearchQuery.trim()) {
        const q = toolSearchQuery.toLowerCase();
        return (
          tool.title.toLowerCase().includes(q) ||
          tool.desc.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="w-full flex flex-col relative z-20">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelect}
        />

        {/* Docked Reply Banner if Replying to a Message */}
        {replyingTo && (
          <ReplyBanner
            replyTo={replyingTo}
            onCancel={onCancelReply}
            accentColor={currentTheme.accentColor}
          />
        )}

        {/* Docked Edit Message Banner if Editing a Message */}
        {editingMessage && (
          <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-amber-950/40 border border-amber-500/40 mb-1 text-xs animate-in slide-in-from-bottom-2 duration-150 select-none shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <Pencil className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Editing Message
                </span>
                <span className="text-neutral-300 text-xs truncate max-w-xs sm:max-w-md">
                  {editingMessage.text}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-neutral-400 hidden sm:inline font-mono">
                Enter to save • Esc to cancel
              </span>
              <button
                type="button"
                onClick={onCancelEditMessage}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Staged File Attachment Preview before sending */}
        {stagedFile && (
          <StagedAttachmentPreview
            file={stagedFile}
            previewUrl={stagedPreviewUrl}
            onRemove={onClearStagedFile}
            accentColor={currentTheme.accentColor}
            onEditImage={onEditImage}
            isViewOnce={isViewOnce}
            onToggleViewOnce={onToggleViewOnce}
          />
        )}

        {/* If Voice Recording is Active, Show VoiceRecorderBar */}
        {isRecordingVoice ? (
          <VoiceRecorderBar
            volume={voiceVolume}
            onCancel={onCancelVoiceRecording}
            onSend={onSendVoiceRecording}
            liveTranscript={voiceLiveTranscript}
          />
        ) : (
          <div className="relative">
            {/* Voice Dictation Active Live Banner */}
            {isDictating && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <span className="font-semibold text-rose-300 shrink-0">Voice Dictation:</span>
                  <span className="text-neutral-300 truncate text-[11px]">
                    Listening... Spoken words will be typed directly into your message
                  </span>
                </div>
                {onToggleDictate && (
                  <button
                    type="button"
                    onClick={onToggleDictate}
                    className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
                  >
                    Done
                  </button>
                )}
              </div>
            )}

            {/* Slash Commands Autocomplete Palette */}
            <SlashCommandMenu
              isOpen={slashMenuOpen}
              filter={slashFilter}
              onClose={() => setSlashMenuOpen(false)}
              onExecuteCommand={onExecuteSlashCommand}
              accentColor={currentTheme.accentColor}
            />

            {/* Text Formatting Ribbon Toolbar (Collapsible, never squeezes the input row) */}
            {formatToolbarOpen && (
              <div
                id="formatting-ribbon-bar"
                className="mb-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/95 border border-white/15 backdrop-blur-xl shadow-lg flex items-center justify-between gap-1 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1.5 select-none hidden sm:inline">
                    Format:
                  </span>
                  <button
                    id="format-bold-btn"
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'bold')}
                    title="Bold (**text**)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Bold</span>
                  </button>
                  <button
                    id="format-italic-btn"
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'italic')}
                    title="Italic (*text*)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span className="text-[11px] italic">Italic</span>
                  </button>
                  <button
                    id="format-strike-btn"
                    type="button"
                    onClick={() => insertFormatting('~', '~', 'strikethrough')}
                    title="Strikethrough (~text~)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                    <span className="text-[11px] line-through">Strike</span>
                  </button>
                  <button
                    id="format-code-btn"
                    type="button"
                    onClick={() => insertFormatting('`', '`', 'code')}
                    title="Inline Code (`code`)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Code</span>
                  </button>
                  <button
                    id="format-quote-btn"
                    type="button"
                    onClick={() => insertFormatting('> ', '', 'quote')}
                    title="Quote (> text)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Quote</span>
                  </button>
                  <button
                    id="format-spoiler-btn"
                    type="button"
                    onClick={() => insertFormatting('||', '||', 'spoiler')}
                    title="Spoiler tag (||hidden text|| - tap to reveal)"
                    className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">Spoiler</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFormatToolbarOpen(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors"
                  title="Close formatting bar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* UNIFIED TOOLS DRAWER / POPUP (Non-colliding, categorized, full-featured) */}
            {toolsMenuOpen && (
              <div
                ref={toolsMenuRef}
                id="unified-tools-drawer"
                className="mb-2 p-3 sm:p-4 rounded-2xl bg-neutral-900/98 border border-neutral-750 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-30 flex flex-col max-h-[70vh] max-w-xl w-full mx-auto"
              >
                {/* Header with Search and Close */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Chat Tools & Security Enclave
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToolsMenuOpen(false)}
                    className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Close tools menu (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Search & Category Filter Pills */}
                <div className="pt-2.5 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={toolSearchQuery}
                      onChange={(e) => setToolSearchQuery(e.target.value)}
                      placeholder="Search tools (poll, burn, code, cipher, table)..."
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                    />
                    {toolSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setToolSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'interactive', label: 'Interactive' },
                      { id: 'security', label: 'Security' },
                      { id: 'tools', label: 'Utilities' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setToolCategory(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          toolCategory === tab.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Responsive Grid of Tools with crisp titles, icons, and descriptions */}
                <div className="overflow-y-auto max-h-[50vh] pr-1 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredTools.map((tool) => {
                    const IconComp = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        id={tool.id}
                        type="button"
                        onClick={() => handleToolSelect(tool.action)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/40 text-left transition-all cursor-pointer group active:scale-[0.98] ${tool.bg}`}
                      >
                        <div className={`p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0 ${tool.color} group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-neutral-200 group-hover:text-white flex items-center justify-between">
                            <span className="truncate">{tool.title}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 leading-relaxed mt-0.5">
                            {tool.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredTools.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-neutral-500">
                      No tools match &ldquo;{toolSearchQuery}&rdquo; in this category.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MAIN INPUT FORM: Clean, Ergonomic, Non-Colliding Layout */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendMessageOrFile();
              }}
              className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-neutral-950/90 hover:bg-neutral-950 backdrop-blur-2xl border border-white/10 focus-within:border-white/30 transition-all shadow-2xl relative"
            >
              {/* LEFT ACTIONS GROUP: Tools Menu (+), Attach File, Slash Commands, Voice Memo */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pb-0.5">
                {/* 1. Universal Tools Menu Toggle (+) */}
                <button
                  id="toggle-tools-menu-button"
                  type="button"
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  disabled={!isInRoom}
                  title="Open Chat Tools & Security Enclave (Polls, Canvas, Cipher, Burn Notes...)"
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                    toolsMenuOpen
                      ? 'bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400/50 scale-105'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-amber-400 border border-neutral-750 hover:border-amber-400/40'
                  }`}
                >
                  <Plus className={`w-4 h-4 transition-transform duration-200 ${toolsMenuOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* 2. File Attachment Quick Action (Paperclip) */}
                <button
                  id="attach-file-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isInRoom}
                  title="Attach file (images, docs, audio, archives up to 50MB)"
                  className="p-2 rounded-xl hover:bg-white/10 active:bg-white/15 text-neutral-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* 3. Slash Commands Quick Palette */}
                <button
                  id="slash-command-trigger-button"
                  type="button"
                  onClick={() => {
                    setSlashMenuOpen(!slashMenuOpen);
                    setSlashFilter('/');
                    if (!slashMenuOpen) {
                      textareaRef.current?.focus();
                    }
                  }}
                  disabled={!isInRoom}
                  title="Slash Commands (/canvas, /poll, /shrug, /notes...)"
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    slashMenuOpen
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'hover:bg-white/10 text-neutral-400 hover:text-teal-300'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                </button>

                {/* 4. Voice Recording Trigger (Mic) */}
                <button
                  id="voice-record-button"
                  type="button"
                  onClick={onStartVoiceRecording}
                  disabled={!isInRoom}
                  title="Record voice note"
                  className="p-2 rounded-xl hover:bg-white/10 active:bg-white/15 text-neutral-400 hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* CENTER: Auto-expanding Spacious Message Textarea */}
              <div className="flex-1 flex flex-col min-w-0 relative">
                <textarea
                  id="message-input"
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={onTextareaChange}
                  onKeyDown={onTextareaKeyDown}
                  onPaste={onPaste}
                  disabled={!isInRoom}
                  placeholder={
                    isInRoom
                      ? stagedFile
                        ? 'Add a caption... (Enter to send, Shift+Enter for newline)'
                        : replyingTo
                        ? `Replying to ${replyingTo.senderName}...`
                        : connectionState === 'waiting'
                        ? 'Type a message... (Ready for when peer joins)'
                        : 'Type message or "/" for commands (Shift+Enter for newline)...'
                      : 'Connecting to room...'
                  }
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 sm:px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none leading-relaxed max-h-32 min-h-[40px]"
                />
                {inputText.length > 80 && (
                  <div className="absolute right-2 bottom-1 pointer-events-none text-[9px] font-mono text-neutral-400/90 bg-neutral-900/90 px-1.5 py-0.5 rounded border border-white/10 select-none">
                    {inputText.length}c · {inputText.trim().split(/\s+/).filter(Boolean).length}w
                  </div>
                )}
              </div>

              {/* RIGHT ACTIONS GROUP: Formatting, Emoji, Disappearing Timer, Schedule, Send */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pb-0.5">
                {/* 1. Toggle Markdown Formatting Bar */}
                <button
                  id="format-ribbon-toggle-button"
                  type="button"
                  onClick={() => setFormatToolbarOpen(!formatToolbarOpen)}
                  disabled={!isInRoom}
                  title="Format text (Bold, Italic, Code, Quote, Spoiler)"
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    formatToolbarOpen
                      ? 'bg-neutral-800 text-amber-300 border border-neutral-700'
                      : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Type className="w-4 h-4" />
                </button>

                {/* 2. Emoji Picker Toggle */}
                <button
                  id="emoji-picker-toggle-button"
                  type="button"
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                  disabled={!isInRoom}
                  title="Insert emoji"
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    emojiPickerOpen
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'hover:bg-white/10 text-neutral-400 hover:text-amber-400'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* 3. Disappearing Messages Quick Badge */}
                <button
                  id="ephemeral-input-toggle-button"
                  type="button"
                  onClick={onOpenEphemeralModal}
                  disabled={!isInRoom}
                  title={
                    ephemeralEnabled
                      ? `Disappearing messages: ${ephemeralDurationOption} (Click to change)`
                      : 'Disappearing messages: OFF (Click to turn ON)'
                  }
                  className={`p-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 ${
                    ephemeralEnabled
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 ring-1 ring-amber-400/40 shadow-xs'
                      : 'hover:bg-white/10 text-neutral-400 hover:text-amber-400'
                  }`}
                >
                  <Flame
                    className={`w-4 h-4 ${
                      ephemeralEnabled ? 'text-amber-400 animate-pulse' : 'text-neutral-400'
                    }`}
                  />
                  {ephemeralEnabled && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 hidden sm:inline">
                      {ephemeralDurationOption}
                    </span>
                  )}
                </button>

                {/* 4. Schedule Delayed Message (Shows when text is ready) */}
                {onOpenScheduleMessage && !editingMessage && Boolean(inputText.trim()) && (
                  <button
                    id="schedule-message-button"
                    type="button"
                    onClick={onOpenScheduleMessage}
                    disabled={!isInRoom}
                    title="Schedule delayed message dispatch"
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-750 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 5. Speech Dictation Indicator if active */}
                {onToggleDictate && !editingMessage && isDictating && (
                  <button
                    id="speech-dictate-button"
                    type="button"
                    onClick={onToggleDictate}
                    title="Stop Voice Dictation"
                    className="p-2 rounded-xl bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-sm animate-pulse cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                )}

                {/* 6. Send / Save Button */}
                <button
                  id="send-message-button"
                  type="submit"
                  disabled={!isInRoom || (!inputText.trim() && !stagedFile)}
                  style={{
                    backgroundColor: currentTheme.accentColor,
                  }}
                  className="text-neutral-950 font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
                >
                  <span className="hidden sm:inline">
                    {editingMessage ? 'Save' : stagedFile ? 'Send File' : 'Send'}
                  </span>
                  {editingMessage ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>

            {/* Live Word & Character Counter Indicator */}
            {inputText.length > 0 && (showCharacterCount || showWordCount) && (
              <div className="flex items-center justify-between px-3 py-1 mt-0.5 text-[10px] text-neutral-400 select-none animate-in fade-in duration-100">
                <span className="flex items-center gap-1.5 font-mono">
                  {showCharacterCount && (
                    <span className={inputText.length > 2000 ? 'text-amber-400 font-semibold' : ''}>
                      {inputText.length} chars
                    </span>
                  )}
                  {showCharacterCount && showWordCount && <span>•</span>}
                  {showWordCount && (
                    <span>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words</span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-500 hidden sm:inline font-mono">
                  {sendKeyPreference === 'ctrl_enter'
                    ? 'Ctrl+Enter or ⌘+Enter to send'
                    : 'Enter to send • Shift+Enter for new line'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ChatInputBar.displayName = 'ChatInputBar';
