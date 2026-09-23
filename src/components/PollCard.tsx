import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  Check,
  Copy,
  Crown,
} from 'lucide-react';
import { PollData } from '../types';

interface PollCardProps {
  poll: PollData;
  messageId: string;
  myUserId: string;
  isMe: boolean;
  accentColor?: string;
  onVoteOption?: (messageId: string, optionId: string) => void;
  onToggleClosePoll?: (messageId: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  messageId,
  myUserId,
  isMe,
  accentColor = '#f59e0b',
  onVoteOption,
  onToggleClosePoll,
}) => {
  const [copiedResults, setCopiedResults] = useState(false);

  // Calculate total votes across all options
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voterIds.length, 0);

  // Find max votes to highlight the leading option
  const maxVotes = Math.max(...poll.options.map((opt) => opt.voterIds.length), 0);

  // Check if current user voted in this poll
  const hasUserVotedInPoll = poll.options.some((opt) => opt.voterIds.includes(myUserId));

  const handleCopySummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lines = [
      `📊 Poll: ${poll.question}`,
      `Status: ${poll.isClosed ? 'Closed' : 'Active'} • Total Votes: ${totalVotes}`,
      '--------------------------------',
    ];
    poll.options.forEach((opt) => {
      const count = opt.voterIds.length;
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      const isWinner = totalVotes > 0 && count === maxVotes;
      lines.push(`${isWinner ? '👑 ' : '• '}${opt.text}: ${pct}% (${count} ${count === 1 ? 'vote' : 'votes'})`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedResults(true);
    setTimeout(() => setCopiedResults(false), 2000);
  };

  return (
    <div className="w-full min-w-[260px] sm:min-w-[320px] max-w-md rounded-2xl bg-neutral-900/95 border border-neutral-750 p-4 select-none space-y-3 shadow-lg">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-2.5">
        <div className="flex items-start gap-2.5">
          <div
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              borderColor: `${accentColor}40`,
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
          >
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-100 leading-snug">
              {poll.question}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-neutral-500" />
                <span>
                  {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                </span>
              </span>
              <span>•</span>
              <span>{poll.allowMultiple ? 'Multiple choices' : 'Single choice'}</span>
            </div>
          </div>
        </div>

        {/* Status Badge & Copy Results Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Copy poll results summary"
          >
            {copiedResults ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase shrink-0 border ${
              poll.isClosed
                ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1'
            }`}
          >
            {!poll.isClosed && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span>{poll.isClosed ? 'Closed' : 'Active'}</span>
          </span>
        </div>
      </div>

      {/* Poll Options List */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.voterIds.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = opt.voterIds.includes(myUserId);
          const isLeader = totalVotes > 0 && voteCount === maxVotes;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={poll.isClosed || !onVoteOption}
              onClick={() => onVoteOption && onVoteOption(messageId, opt.id)}
              className={`w-full relative overflow-hidden text-left p-2.5 rounded-xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'border-amber-500/80 bg-neutral-800/80 ring-1 ring-amber-500/40 shadow-xs'
                  : isLeader
                  ? 'border-neutral-700 bg-neutral-900/80 hover:border-neutral-600'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/60'
              } disabled:cursor-default disabled:hover:border-neutral-800`}
            >
              {/* Animated Progress Bar Fill */}
              <div
                style={{
                  width: `${percentage}%`,
                  backgroundColor: isSelected ? `${accentColor}30` : isLeader ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.06)',
                }}
                className="absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none rounded-xl"
              />

              {/* Content on top */}
              <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Indicator Box/Circle */}
                  <div
                    className={`w-4 h-4 rounded-${
                      poll.allowMultiple ? 'md' : 'full'
                    } border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400 text-neutral-950 font-bold'
                        : 'border-neutral-600 bg-neutral-900 group-hover:border-neutral-400'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>

                  <span
                    className={`font-medium truncate flex items-center gap-1.5 ${
                      isSelected ? 'text-white' : 'text-neutral-200'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {isLeader && (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Leading Choice" />
                    )}
                  </span>
                </div>

                {/* Percentage & Vote Count */}
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                  <span className={`font-semibold ${isLeader ? 'text-amber-300' : 'text-neutral-300'}`}>{percentage}%</span>
                  <span className="text-neutral-500 text-[10px]">({voteCount})</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="italic">
          {poll.isClosed
            ? 'Voting ended'
            : hasUserVotedInPoll
            ? 'Your vote has been cast'
            : 'Tap an option to cast your vote'}
        </span>

        {/* Close/Reopen Poll Button (for author or room members) */}
        {onToggleClosePoll && (
          <button
            type="button"
            onClick={() => onToggleClosePoll(messageId)}
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            {poll.isClosed ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span>Re-open Poll</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-neutral-400" />
                <span>Close Poll</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
export default PollCard;
