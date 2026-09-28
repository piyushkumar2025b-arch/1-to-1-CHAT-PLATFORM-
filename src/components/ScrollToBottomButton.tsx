import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  isVisible: boolean;
  unreadCount: number;
  onClick: () => void;
  accentColor?: string;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  isVisible,
  unreadCount,
  onClick,
  accentColor = '#f59e0b',
}) => {
  if (!isVisible && unreadCount === 0) return null;

  return (
    <div className="absolute right-6 bottom-20 z-20 pointer-events-auto">
      <button
        type="button"
        onClick={onClick}
        id="scroll-to-bottom-btn"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
          borderColor: unreadCount > 0 ? `${accentColor}80` : undefined,
        }}
        className={`group flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md border border-white/15 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-100 transition-all transform active:scale-95 cursor-pointer select-none ${
          unreadCount > 0 ? 'ring-2 ring-white/20' : ''
        }`}
        title="Scroll down to newest messages"
      >
        <ChevronDown
          style={{ color: accentColor }}
          className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
        />
        {unreadCount > 0 && (
          <span
            style={{ color: accentColor }}
            className="text-xs font-bold font-sans tracking-tight pr-0.5"
          >
            {unreadCount} new
          </span>
        )}
      </button>
    </div>
  );
};
