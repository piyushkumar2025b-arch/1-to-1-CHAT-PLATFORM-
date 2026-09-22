import React from 'react';
import { Hand, ShieldCheck, Mic, Image, Sparkles, BarChart2, PenTool } from 'lucide-react';

interface ConversationStartersProps {
  onSendMessage: (text: string) => void;
  onOpenVoice: () => void;
  onOpenFile: () => void;
  onOpenPoll?: () => void;
  onOpenDraw?: () => void;
  accentColor?: string;
}

export default function ConversationStarters({
  onSendMessage,
  onOpenVoice,
  onOpenFile,
  onOpenPoll,
  onOpenDraw,
  accentColor = '#f59e0b',
}: ConversationStartersProps) {
  return (
    <div className="flex flex-col items-center space-y-3 max-w-md w-full mx-auto my-auto p-4 select-none animate-in fade-in duration-300">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Secure Enclave Ready • Zero-Knowledge Session</span>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Start your conversation</span>
        </h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
          Choose a quick action below or type in the box to begin chatting securely.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full pt-2">
        <button
          type="button"
          onClick={() => onSendMessage('👋 Hello! Secure private chat connected.')}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
            <Hand className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-neutral-200">Wave Hello</div>
            <div className="text-[10px] text-neutral-400">Say hi to peer</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSendMessage('🔒 Encryption handshake confirmed. Messages are end-to-end encrypted.')}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-neutral-200">Handshake</div>
            <div className="text-[10px] text-neutral-400">Confirm cipher</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenVoice}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-neutral-200">Voice Note</div>
            <div className="text-[10px] text-neutral-400">Record audio</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenFile}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
            <Image className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-neutral-200">Share Media</div>
            <div className="text-[10px] text-neutral-400">Send files or pics</div>
          </div>
        </button>

        {onOpenPoll && (
          <button
            type="button"
            onClick={onOpenPoll}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-neutral-200">Create Poll</div>
              <div className="text-[10px] text-neutral-400">Vote on options</div>
            </div>
          </button>
        )}

        {onOpenDraw && (
          <button
            type="button"
            onClick={onOpenDraw}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs text-left text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-neutral-200">Quick Sketch</div>
              <div className="text-[10px] text-neutral-400">Draw doodle & send</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
