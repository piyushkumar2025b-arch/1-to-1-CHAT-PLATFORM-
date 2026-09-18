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
          />
        ) : (
          <div className="relative">
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

                {/* Quick Markdown & Spoiler Helpers */}
                <div className="hidden md:flex items-center gap-0.5 pl-1 border-l border-white/10">
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
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none px-2 sm:px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none leading-relaxed max-h-32 min-h-[40px]"
              />

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
          </div>
        )}
      </div>
    );
  }
);
ChatInputBar.displayName = 'ChatInputBar';
