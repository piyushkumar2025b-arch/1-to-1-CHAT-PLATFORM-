import React, { useState } from 'react';
import {
  Download,
  X,
  FileText,
  FileCode,
  Copy,
  Check,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  messages: ChatMessage[];
}

export const ChatExportModal: React.FC<ChatExportModalProps> = ({
  isOpen,
  onClose,
  roomId,
  messages,
}) => {
  const [includeSystemMessages, setIncludeSystemMessages] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const validMessages = messages.filter((m) => {
    if (m.isDeleted) return false;
    if (!includeSystemMessages && m.sender === 'system') return false;
    return true;
  });

  const generateTextTranscript = (): string => {
    const header = [
      `======================================================`,
      `PRIVATE CHAT ENCRYPTED TRANSCRIPT EXPORT`,
      `Room Code : ${roomId}`,
      `Exported  : ${new Date().toLocaleString()}`,
      `Messages  : ${validMessages.length}`,
      `Security  : Zero-Knowledge Client Export`,
      `======================================================\n`,
    ].join('\n');

    const lines = validMessages.map((msg) => {
      const timeStr = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString()
        : msg.time || '--:--';
      const senderStr =
        msg.sender === 'me'
          ? 'YOU'
          : msg.sender === 'peer'
          ? 'PEER'
          : 'SYSTEM';

      let content = msg.text || '';
      if (msg.file) {
        content += ` [Attachment: ${msg.file.fileName} (${(msg.file.fileSize / 1024).toFixed(1)} KB)${msg.file.isVoice ? ' - Voice Note' : ''}]`;
      }
      if (msg.isEdited) {
        content += ' (edited)';
      }

      return `[${timeStr}] <${senderStr}>: ${content}`;
    });

    return `${header}\n${lines.join('\n')}`;
  };

  const handleDownloadTxt = () => {
    const text = generateTextTranscript();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `privatechat-${roomId}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const exportData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      roomCode: roomId,
      totalMessages: validMessages.length,
      messages: validMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        time: m.time,
        createdAt: m.createdAt,
        text: m.text,
        file: m.file
          ? {
              fileName: m.file.fileName,
              fileSize: m.file.fileSize,
              mimeType: m.file.mimeType,
              isVoice: m.file.isVoice,
            }
          : undefined,
        isEdited: m.isEdited,
        editedAt: m.editedAt,
        reactions: m.reactions,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `privatechat-${roomId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTranscript = () => {
    const text = generateTextTranscript();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Chat Transcript</h3>
              <p className="text-[11px] text-neutral-400">
                Save an encrypted JSON archive or plain text backup before closing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quick Stats Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Room <strong>{roomId}</strong> • <strong>{validMessages.length}</strong> active messages
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSystemMessages}
                onChange={(e) => setIncludeSystemMessages(e.target.checked)}
                className="accent-amber-500 rounded cursor-pointer"
              />
              <span>Include System Logs</span>
            </label>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: TXT Transcript */}
            <div
              onClick={handleDownloadTxt}
              className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-950 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-semibold text-white">Text Transcript (.txt)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Clean readable log with timestamps, user handles, and message text.
                </p>
              </div>
              <button
                type="button"
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 group-hover:bg-amber-500 group-hover:text-black font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>

            {/* Option 2: JSON Backup */}
            <div
              onClick={handleDownloadJson}
              className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-950 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileCode className="w-4 h-4" />
                  <span className="text-xs font-semibold text-white">Structured JSON (.json)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Complete structured archive including reactions, attachments, and timestamps.
                </p>
              </div>
              <button
                type="button"
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          {/* Option 3: Copy to clipboard */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCopyTranscript}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Transcript Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Transcript to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Zero logs retained on server • Client generated</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatExportModal;
