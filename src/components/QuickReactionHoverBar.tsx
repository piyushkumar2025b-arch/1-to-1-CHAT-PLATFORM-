import React from 'react';

interface QuickReactionHoverBarProps {
  messageId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  myReactions?: string[];
}

const COMMON_REACTION_EMOJIS = ['❤️', '👍', '😂', '🔥', '🎉', '😮'];

export default function QuickReactionHoverBar({
  messageId,
  onToggleReaction,
  myReactions = [],
}: QuickReactionHoverBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1 border-r border-white/10 pr-1.5 mr-0.5">
      {COMMON_REACTION_EMOJIS.map((emoji) => {
        const isSelected = myReactions.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggleReaction(messageId, emoji)}
            title={`React with ${emoji}`}
            className={`w-6 h-6 flex items-center justify-center text-xs rounded-md transition-transform hover:scale-125 active:scale-95 cursor-pointer ${
              isSelected ? 'bg-amber-400/25 ring-1 ring-amber-400/60' : 'hover:bg-white/15'
            }`}
          >
            <span>{emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
