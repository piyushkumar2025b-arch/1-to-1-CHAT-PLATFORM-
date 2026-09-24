import React, { memo, useState } from 'react';
import {
  Paperclip,
  Mic,
  Terminal,
  Smile,
  Flame,
  Link2,
  Send,
  MoreHorizontal,
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
    const isConnected = connectionState === 'connected';
    const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

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

      const syntheticEvent = {
        target: { value: newVal },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onTextareaChange(syntheticEvent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + insertText.length
        );
      }, 30);
    };

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

            {/* Mobile Expanded Secondary Tools Drawer */}
            {mobileToolsOpen && (
              <div className="sm:hidden mb-2 p-2 rounded-2xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl flex items-center justify-around shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setSlashMenuOpen(!slashMenuOpen);
                    setSlashFilter('/');
                    setMobileToolsOpen(false);
                    textareaRef.current?.focus();
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-teal-400 active:scale-95 transition-all text-[11px]"
                >
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span>Commands</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmojiPickerOpen((prev) => !prev);
                    setMobileToolsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-300 active:scale-95 transition-all text-[11px]"
                >
                  <Smile className="w-4 h-4 text-amber-400" />
                  <span>Emoji</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenEphemeralModal();
                    setMobileToolsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                >
                  <Flame className={`w-4 h-4 ${ephemeralEnabled ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
                  <span>Timer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenShareLinkModal();
                    setMobileToolsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-purple-300 active:scale-95 transition-all text-[11px]"
                >
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <span>Link</span>
                </button>

                {onOpenCodeSandbox && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCodeSandbox();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-cyan-300 active:scale-95 transition-all text-[11px]"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Code</span>
                  </button>
                )}

                {onOpenCreatePoll && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreatePoll();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                  >
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                    <span>Poll</span>
                  </button>
                )}

                {onOpenQuickDraw && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuickDraw();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-emerald-400 active:scale-95 transition-all text-[11px]"
                  >
                    <PenTool className="w-4 h-4 text-emerald-400" />
                    <span>Sketch</span>
                  </button>
                )}

                {onOpenQuickReplies && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuickReplies();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Replies</span>
                  </button>
                )}

                {onOpenPersonalNotes && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPersonalNotes();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-300 active:scale-95 transition-all text-[11px]"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>Notes</span>
                  </button>
                )}

                {onOpenCryptoCipher && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCryptoCipher();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Cipher</span>
                  </button>
                )}

                {onOpenPasswordGenerator && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPasswordGenerator();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-300 active:scale-95 transition-all text-[11px]"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Passgen</span>
                  </button>
                )}

                {onOpenBurnOnRead && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBurnOnRead();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-orange-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Burn Note</span>
                  </button>
                )}

                {onOpenSteganography && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSteganography();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-cyan-300 active:scale-95 transition-all text-[11px]"
                  >
                    <EyeOff className="w-4 h-4 text-cyan-300" />
                    <span>Stego</span>
                  </button>
                )}

                {onOpenAcousticShield && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAcousticShield();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Shield</span>
                  </button>
                )}

                {onOpenFileShredder && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFileShredder();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-rose-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Shredder</span>
                  </button>
                )}

                {onOpenTimeLock && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTimeLock();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Capsule</span>
                  </button>
                )}

                {onOpenVoiceDisguise && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenVoiceDisguise();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-purple-400 active:scale-95 transition-all text-[11px]"
                  >
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span>Disguise</span>
                  </button>
                )}

                {onOpenShamirSecret && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShamirSecret();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-amber-400 active:scale-95 transition-all text-[11px]"
                    title="Shamir's Secret Sharing (split/reconstruct)"
                  >
                    <Split className="w-4 h-4 text-amber-400" />
                    <span>Shamir</span>
                  </button>
                )}

                {onOpenTableGenerator && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTableGenerator();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-cyan-400 active:scale-95 transition-all text-[11px]"
                    title="Interactive Table & Matrix Builder"
                  >
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span>Table</span>
                  </button>
                )}

                {onOpenPhotoObfuscator && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPhotoObfuscator();
                      setMobileToolsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-300 hover:text-rose-400 active:scale-95 transition-all text-[11px]"
                    title="Photo Redaction & Scratch Foil Studio"
                  >
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    <span>Redact</span>
                  </button>
                )}

                {onToggleDictate && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDictate();
                      setMobileToolsOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl active:scale-95 transition-all text-[11px] ${
                      isDictating ? 'text-rose-400 font-bold animate-pulse' : 'text-neutral-300 hover:text-rose-400'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-rose-400" />
                    <span>{isDictating ? 'Stop Mic' : 'Dictate'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setMobileToolsOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendMessageOrFile();
              }}
              className="flex items-end gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-neutral-950/80 hover:bg-neutral-950/95 backdrop-blur-2xl border border-white/10 focus-within:border-white/25 transition-all shadow-2xl"
            >
              {/* File Attachment Action */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
                title="Attach file (images, docs, audio, archives)"
                className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4 text-amber-400" />
              </button>

              {/* Voice Recording Action */}
              <button
                type="button"
                onClick={onStartVoiceRecording}
                disabled={!isConnected}
                title="Hold or tap to record voice note"
                className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Mobile Quick Tools Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                disabled={!isConnected}
                title="More chat tools"
                className={`sm:hidden p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 ${
                  mobileToolsOpen || ephemeralEnabled ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-neutral-400'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Desktop Desktop Actions (Slash Commands, Emoji, Ephemeral, Share Link) */}
              <div className="hidden sm:flex items-center gap-0.5 shrink-0">
                {/* Slash Commands */}
                <button
                  type="button"
                  id="slash-command-trigger-button"
                  onClick={() => {
                    setSlashMenuOpen(!slashMenuOpen);
                    setSlashFilter('/');
                    if (!slashMenuOpen) {
                      textareaRef.current?.focus();
                    }
                  }}
                  disabled={!isConnected}
                  title="Slash Commands (/canvas, /call, /theme, /shrug...)"
                  className={`p-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    slashMenuOpen ? 'bg-teal-500/20 text-teal-300' : 'text-neutral-400 hover:text-teal-300'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-teal-400" />
                </button>

                {/* Emoji Picker */}
                <button
                  type="button"
                  id="emoji-picker-toggle-button"
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                  disabled={!isConnected}
                  title="Insert emojis"
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    emojiPickerOpen
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'hover:bg-white/10 text-neutral-400 hover:text-amber-400'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Disappearing Messages Quick Badge */}
                <button
                  type="button"
                  id="ephemeral-input-toggle-button"
                  onClick={onOpenEphemeralModal}
                  disabled={!isConnected}
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
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {ephemeralDurationOption}
                    </span>
                  )}
                </button>

                {/* Share Web Link */}
                <button
                  type="button"
                  id="share-link-input-button"
                  onClick={onOpenShareLinkModal}
                  disabled={!isConnected}
                  title="Share a web link into chat"
                  className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-purple-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-purple-400" />
                </button>

                {/* Quick Canned Replies & Templates */}
                {onOpenQuickReplies && (
                  <button
                    type="button"
                    id="quick-replies-desktop-button"
                    onClick={onOpenQuickReplies}
                    disabled={!isConnected}
                    title="Quick Canned Replies & Templates (/quick)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Code Snippet Sandbox */}
                {onOpenCodeSandbox && (
                  <button
                    type="button"
                    id="code-sandbox-input-button"
                    onClick={onOpenCodeSandbox}
                    disabled={!isConnected}
                    title="Open Code Snippet Sandbox"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400" />
                  </button>
                )}

                {/* Create Poll */}
                {onOpenCreatePoll && (
                  <button
                    type="button"
                    id="create-poll-input-button"
                    onClick={onOpenCreatePoll}
                    disabled={!isConnected}
                    title="Create Encrypted Poll"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Quick Sketch / Doodle */}
                {onOpenQuickDraw && (
                  <button
                    type="button"
                    id="quick-draw-input-button"
                    onClick={onOpenQuickDraw}
                    disabled={!isConnected}
                    title="Draw Doodle or Sketch"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <PenTool className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                {/* Personal Notes / Note to Self Shortcut */}
                {onOpenPersonalNotes && (
                  <button
                    type="button"
                    id="personal-notes-desktop-button"
                    onClick={onOpenPersonalNotes}
                    disabled={!isConnected}
                    title="Encrypted Notes to Self & Scratchpad (/notes)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Cryptographic Cipher & Hash Toolkit */}
                {onOpenCryptoCipher && (
                  <button
                    type="button"
                    id="crypto-cipher-desktop-button"
                    onClick={onOpenCryptoCipher}
                    disabled={!isConnected}
                    title="Cryptographic Cipher, Hash & Morse Toolkit (/cipher)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Password & Passphrase Generator */}
                {onOpenPasswordGenerator && (
                  <button
                    type="button"
                    id="password-generator-desktop-button"
                    onClick={onOpenPasswordGenerator}
                    disabled={!isConnected}
                    title="Password & Passphrase Generator with Entropy Audit (/password)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                  </button>
                )}

                {/* Burn-After-Reading Note */}
                {onOpenBurnOnRead && (
                  <button
                    type="button"
                    id="burn-on-read-desktop-button"
                    onClick={onOpenBurnOnRead}
                    disabled={!isConnected}
                    title="Burn-After-Reading Confidential Note (/burn)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                  </button>
                )}

                {/* Steganography Concealer & Inspector */}
                {onOpenSteganography && (
                  <button
                    type="button"
                    id="steganography-desktop-button"
                    onClick={onOpenSteganography}
                    disabled={!isConnected}
                    title="Steganography Concealer (Hide invisible secrets) (/stego)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4 text-cyan-300" />
                  </button>
                )}

                {/* Acoustic Privacy Shield */}
                {onOpenAcousticShield && (
                  <button
                    type="button"
                    id="acoustic-shield-desktop-button"
                    onClick={onOpenAcousticShield}
                    disabled={!isConnected}
                    title="Acoustic Privacy Shield (Speech jammer & masking) (/shield)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Digital File Shredder */}
                {onOpenFileShredder && (
                  <button
                    type="button"
                    id="file-shredder-desktop-button"
                    onClick={onOpenFileShredder}
                    disabled={!isConnected}
                    title="Digital File Shredder (DoD 5220.22-M sanitization) (/shred)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                )}

                {/* Time-Locked Message Capsule */}
                {onOpenTimeLock && (
                  <button
                    type="button"
                    id="timelock-desktop-button"
                    onClick={onOpenTimeLock}
                    disabled={!isConnected}
                    title="Time-Locked Message Capsule (/capsule)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {/* Voice Disguise Studio */}
                {onOpenVoiceDisguise && (
                  <button
                    type="button"
                    id="voice-disguise-desktop-button"
                    onClick={onOpenVoiceDisguise}
                    disabled={!isConnected}
                    title="Voice Disguise Studio (DSP vocal pitch & morph) (/disguise)"
                    className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-purple-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-purple-400" />
                  </button>
                )}

                {/* Quick Markdown & Spoiler Helpers */}
                <div className="hidden lg:flex items-center gap-0.5 pl-1 border-l border-white/10">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'bold')}
                    disabled={!isConnected}
                    title="Format Bold (**text**)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'italic')}
                    disabled={!isConnected}
                    title="Format Italic (*text*)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~', '~', 'strike')}
                    disabled={!isConnected}
                    title="Format Strikethrough (~text~)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('`', '`', 'code')}
                    disabled={!isConnected}
                    title="Format Inline Code (`code`)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-cyan-300 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('> ', '', 'quote')}
                    disabled={!isConnected}
                    title="Format Blockquote (> text)"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-purple-300 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('||', '||', 'spoiler')}
                    disabled={!isConnected}
                    title="Spoiler tag (||hidden text|| - tap to reveal)"
                    className="p-1.5 rounded-lg hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Auto-expanding Multiline Message Textarea with Clipboard Paste Support */}
              <div className="flex-1 flex flex-col min-w-0 relative">
                <textarea
                  id="message-input"
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={onTextareaChange}
                  onKeyDown={onTextareaKeyDown}
                  onPaste={onPaste}
                  disabled={!isConnected}
                  placeholder={
                    isConnected
                      ? stagedFile
                        ? 'Add a caption... (Enter to send, Shift+Enter for newline)'
                        : replyingTo
                        ? `Replying to ${replyingTo.senderName}...`
                        : 'Type message or "/" for commands (Shift+Enter for newline)...'
                      : 'Waiting for peer to join room...'
                  }
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 sm:px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none leading-relaxed max-h-32 min-h-[40px]"
                />
                {inputText.length > 80 && (
                  <div className="absolute right-2 bottom-1 pointer-events-none text-[9px] font-mono text-neutral-500/80 bg-neutral-900/80 px-1 rounded select-none">
                    {inputText.length}c · {inputText.trim().split(/\s+/).filter(Boolean).length}w
                  </div>
                )}
              </div>

              {/* Schedule Delayed Dispatch Button */}
              {onOpenScheduleMessage && !editingMessage && Boolean(inputText.trim()) && (
                <button
                  type="button"
                  id="schedule-message-button"
                  onClick={onOpenScheduleMessage}
                  disabled={!isConnected}
                  title="Schedule delayed message dispatch"
                  className="p-2 sm:py-2.5 sm:px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-750 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Speech-to-Text Voice Dictation Trigger */}
              {onToggleDictate && !editingMessage && (
                <button
                  type="button"
                  id="speech-dictate-button"
                  onClick={onToggleDictate}
                  disabled={!isConnected}
                  title={isDictating ? 'Stop Voice Dictation' : 'Voice Dictation / Speech-to-Text (/dictate)'}
                  className={`p-2 sm:py-2.5 sm:px-2.5 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDictating
                      ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-sm animate-pulse'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-800'
                  }`}
                >
                  <Mic className={`w-3.5 h-3.5 ${isDictating ? 'text-rose-400' : ''}`} />
                </button>
              )}

              {/* Send / Save Button */}
              <button
                id="send-message-button"
                type="submit"
                disabled={!isConnected || (!inputText.trim() && !stagedFile)}
                style={{
                  backgroundColor: currentTheme.accentColor,
                }}
                className="text-neutral-950 font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
              >
                <span className="hidden md:inline">
                  {editingMessage ? 'Save Edit' : stagedFile ? 'Send File' : 'Send'}
                </span>
                {editingMessage ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            {/* Live Word & Character Counter Indicator */}
            {inputText.length > 0 && (showCharacterCount || showWordCount) && (
              <div className="flex items-center justify-between px-3 py-1 mt-1 text-[10px] text-neutral-400 select-none animate-in fade-in duration-100">
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
