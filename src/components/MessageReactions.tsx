import React, { useState } from 'react';
import { SmilePlus } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  myUserId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  isMyMessage: boolean;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = {},
  myUserId,
  onToggleReaction,
  isMyMessage,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions that have at least 1 user
  const activeReactions = (Object.entries(reactions) as [string, string[]][]).filter(
    ([, userIds]) => Array.isArray(userIds) && userIds.length > 0
  );

  return (
    <div className={`relative flex items-center gap-1.5 flex-wrap mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Existing Reaction Badges */}
      {activeReactions.map(([emoji, userIds]) => {
        const hasReacted = userIds.includes(myUserId);
        return (
          <button
            key={emoji}
            onClick={() => onToggleReaction(messageId, emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all active:scale-90 cursor-pointer ${
              hasReacted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
            }`}
            title={`${userIds.length} ${userIds.length === 1 ? 'reaction' : 'reactions'}${
              hasReacted ? ' (including you)' : ''
            }`}
          >
            <span className="text-sm">{emoji}</span>
            <span className="text-[11px] font-semibold">{userIds.length}</span>
          </button>
        );
      })}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          id={`react-btn-${messageId}`}
          className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors opacity-80 hover:opacity-100 cursor-pointer"
          title="Add reaction"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>

        {/* Quick Reaction Popup */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div
              className={`absolute bottom-full mb-1 z-50 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/15 shadow-xl animate-in zoom-in-95 duration-100 ${
                isMyMessage ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onToggleReaction(messageId, emoji);
                    setShowPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform rounded-full hover:bg-white/10 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
