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
        }}
        className={`group flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md border border-white/15 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-100 transition-all transform active:scale-95 cursor-pointer select-none ${
          unreadCount > 0 ? 'ring-2 ring-amber-400/80' : ''
        }`}
        title="Scroll down to newest messages"
      >
        <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
        {unreadCount > 0 && (
          <span className="text-xs font-bold text-amber-300 font-sans tracking-tight pr-0.5">
            {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
          </span>
        )}
      </button>
    </div>
  );
};
