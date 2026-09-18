import React, { memo } from 'react';
import {
  Reply,
  Pin,
  Clock,
  Trash2,
  Copy as CopyIcon,
  Check,
  Ban,
  CheckCheck,
  Loader2,
  Pencil,
  Star,
} from 'lucide-react';
import { ChatMessage, ChatTheme } from '../types';
import QuickReactionHoverBar from './QuickReactionHoverBar';
import { MessageReactions } from './MessageReactions';
import FileMessageBubble from './FileMessageBubble';
import { MessageContentRenderer } from './MessageContentRenderer';
import { EphemeralCountdownBadge } from './EphemeralCountdownBadge';
import PollCard from './PollCard';

export interface ChatMessageItemProps {
  msg: ChatMessage;
  isMe: boolean;
  isSeen?: boolean;
  isHighlighted: boolean;
  showDateDivider: boolean;
  currentDateGroup: string;
  isPrevSameSender: boolean;
  bubbleRadiusClass: string;
  targetName: string;
  myUserId: string;
  isPinned: boolean;
  isCopied: boolean;
  currentTheme: ChatTheme;
  activeRoomId: string;
  roomPassword: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReplyToMessage: (msg: ChatMessage) => void;
  onTogglePinMessage: (messageId: string) => void;
  onShowMessageDetails: (msg: ChatMessage) => void;
  onOpenDeleteDialog: (msg: ChatMessage) => void;
  onCopyMessageText: (msg: ChatMessage) => void;
  onJumpToMessage: (targetMsgId: string) => void;
  onExpireMessage: (messageId: string) => void;
  blurGuardActive?: boolean;
  onOpenCodeInSandbox?: (code: string, language?: string) => void;
  onEditMessage?: (msg: ChatMessage) => void;
  onBurnMedia?: (messageId: string, fileId: string) => void;
  onToggleStarMessage?: (messageId: string) => void;
  onVoteOption?: (messageId: string, optionId: string) => void;
  onToggleClosePoll?: (messageId: string) => void;
}

export const ChatMessageItem = memo<ChatMessageItemProps>(
  ({
    msg,
    isMe,
    isSeen,
    isHighlighted,
    showDateDivider,
    currentDateGroup,
    isPrevSameSender,
    bubbleRadiusClass,
    targetName,
    myUserId,
    isPinned,
    isCopied,
    currentTheme,
    activeRoomId,
    roomPassword,
    onToggleReaction,
    onReplyToMessage,
    onTogglePinMessage,
    onShowMessageDetails,
    onOpenDeleteDialog,
    onCopyMessageText,
    onJumpToMessage,
    onExpireMessage,
    blurGuardActive = false,
    onOpenCodeInSandbox,
    onEditMessage,
    onBurnMedia,
    onToggleStarMessage,
    onVoteOption,
    onToggleClosePoll,
  }) => {
    const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
    const isEditable =
      isMe &&
      !msg.isDeleted &&
      Boolean(msg.text?.trim()) &&
      msgTime > 0 &&
      Date.now() - msgTime <= 15 * 60 * 1000;
    return (
      <div className={`w-full flex flex-col ${isPrevSameSender ? 'mt-1' : 'mt-3 sm:mt-3.5'}`}>
        {/* Sticky Clean Date Group Divider */}
        {showDateDivider && (
          <div className="flex justify-center my-4 sticky top-2 z-10 select-none pointer-events-none">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium tracking-wide bg-neutral-900/90 text-neutral-300 border border-neutral-800/90 backdrop-blur-md shadow-xs pointer-events-auto">
              {currentDateGroup}
            </span>
          </div>
        )}

        {/* Peer identity header for top of incoming message streak */}
        {!isMe && (!isPrevSameSender || showDateDivider) && (
          <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium text-neutral-400 select-none">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold">
              {targetName ? targetName.charAt(0).toUpperCase() : 'P'}
            </div>
            <span className="text-neutral-300 font-semibold">{targetName}</span>
          </div>
        )}

        <div
          id={`msg-${msg.id}`}
          className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full transition-all duration-200 ${
            isHighlighted ? 'scale-[1.01] ring-2 ring-amber-400/80 rounded-2xl p-1' : ''
          }`}
        >
          {/* Floating Capsule Action Bar on Message Hover (Reply & Copy & Pin & Info & Delete) */}
          <div
            className={`absolute -top-8.5 ${
              isMe ? 'right-1' : 'left-1'
            } opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 flex items-center gap-1 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-full px-2 py-1 text-[10px] z-20 shadow-xl`}
          >
            {/* Quick 1-tap reaction emojis */}
            {!msg.isDeleted && (
              <QuickReactionHoverBar
                messageId={msg.id}
                onToggleReaction={onToggleReaction}
                myReactions={
                  msg.reactions
                    ? Object.entries(msg.reactions)
                        .filter(([, uids]) => Array.isArray(uids) && uids.includes(myUserId))
                        .map(([emoji]) => emoji)
                    : []
                }
              />
            )}

            {!msg.isDeleted && (
              <button
                type="button"
                onClick={() => onReplyToMessage(msg)}
                title="Reply to message"
                className="p-1 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer text-neutral-300"
              >
                <Reply className="w-3 h-3" />
                <span className="hidden sm:inline">Reply</span>
              </button>
            )}

            {/* Pin Message Toggle */}
            {!msg.isDeleted && (
              <button
                type="button"
                onClick={() => onTogglePinMessage(msg.id)}
                title={isPinned ? 'Unpin message' : 'Pin message to top'}
                className={`p-1 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer ${
                  isPinned ? 'text-amber-400 font-semibold' : 'text-neutral-300'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span className="hidden sm:inline">{isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
            )}

            {/* Message Exact Sent Date & Time Inspector */}
            <button
              type="button"
              onClick={() => onShowMessageDetails(msg)}
              title="View exact time and date when message was sent"
              className="p-1 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer text-neutral-300"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Info</span>
            </button>

            {/* Edit Message Button (within 15 minutes window) */}
            {isEditable && onEditMessage && (
              <button
                type="button"
                onClick={() => onEditMessage(msg)}
                title="Edit message (within 15m window)"
                className="p-1 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer text-neutral-300"
              >
                <Pencil className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Star / Bookmark Message */}
            {!msg.isDeleted && onToggleStarMessage && (
              <button
                type="button"
                onClick={() => onToggleStarMessage(msg.id)}
                title={msg.isStarred ? 'Unstar message' : 'Star message'}
                className={`p-1 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer ${
                  msg.isStarred ? 'text-amber-400 font-semibold' : 'text-neutral-300'
                }`}
              >
                <Star className={`w-3 h-3 ${msg.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{msg.isStarred ? 'Starred' : 'Star'}</span>
              </button>
            )}

            {/* Delete Message Button */}
            <button
              type="button"
              onClick={() => onOpenDeleteDialog(msg)}
              title="Delete message (For me or for everyone)"
              className="p-1 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer text-neutral-300"
            >
              <Trash2 className="w-3 h-3 text-red-400/80 hover:text-red-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {msg.text && !msg.isDeleted && (
              <button
                type="button"
                onClick={() => onCopyMessageText(msg)}
                title="Copy text"
                className="p-1 hover:text-white transition-colors cursor-pointer text-neutral-300"
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <CopyIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {/* Main Bubble */}
          <div
            className={`max-w-[88%] sm:max-w-[75%] p-3 sm:p-3.5 ${bubbleRadiusClass} text-sm break-words shadow-sm flex flex-col gap-2 relative transition-all duration-200 ${
              isMe ? currentTheme.myBubbleStyle : currentTheme.peerBubbleStyle
            } ${
              blurGuardActive
                ? 'filter blur-[6px] opacity-75 hover:blur-none hover:opacity-100 select-none group/guard'
                : ''
            }`}
          >
            {/* If message was deleted for everyone */}
            {msg.isDeleted ? (
              <div className="italic text-xs opacity-75 flex items-center gap-2 py-1 text-neutral-400 select-none">
                <Ban className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>This message was deleted</span>
                {msg.deletedAt && (
                  <span className="text-[10px] opacity-60 not-italic">
                    • {new Date(msg.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ) : (
              <>
                {/* Render Quoted Reply if message replied to someone */}
                {msg.replyTo && (
                  <div
                    onClick={() => onJumpToMessage(msg.replyTo!.id)}
                    className="flex flex-col gap-0.5 p-2 rounded-lg bg-black/25 border-l-3 border-amber-400 cursor-pointer hover:bg-black/35 transition-colors select-none text-xs"
                  >
                    <span className="font-semibold text-[10px] text-amber-300">
                      {msg.replyTo.senderName}
                    </span>
                    <p className="truncate text-[11px] opacity-80">
                      {msg.replyTo.isVoice
                        ? '🎤 Voice Message'
                        : msg.replyTo.fileName
                        ? `📎 ${msg.replyTo.fileName}`
                        : msg.replyTo.text || 'Message'}
                    </p>
                  </div>
                )}

                {/* Render file / voice attachment if present */}
                {msg.file && (
                  <FileMessageBubble
                    file={msg.file}
                    roomId={activeRoomId}
                    isMe={isMe}
                    accentColor={currentTheme.accentColor}
                    isUploading={msg.status === 'sending'}
                    uploadProgress={msg.uploadProgress}
                    roomPassword={roomPassword}
                    messageId={msg.id}
                    onBurnMedia={onBurnMedia}
                  />
                )}

                {/* Render Poll Card if present */}
                {msg.poll && (
                  <PollCard
                    poll={msg.poll}
                    messageId={msg.id}
                    myUserId={myUserId}
                    isMe={isMe}
                    accentColor={currentTheme.accentColor}
                    onVoteOption={onVoteOption}
                    onToggleClosePoll={onToggleClosePoll}
                  />
                )}

                {/* Render text with rich formatting, code block syntax highlighting, and link cards */}
                {msg.text && (
                  <MessageContentRenderer
                    text={msg.text}
                    isMe={isMe}
                    accentColor={currentTheme.accentColor}
                    onOpenCodeInSandbox={onOpenCodeInSandbox}
                  />
                )}
              </>
            )}
          </div>

          {/* Message Emoji Reactions (only for non-deleted messages) */}
          {!msg.isDeleted && (
            <MessageReactions
              messageId={msg.id}
              reactions={msg.reactions}
              myUserId={myUserId}
              onToggleReaction={onToggleReaction}
              isMyMessage={isMe}
            />
          )}

          {/* Timestamp, Ephemeral countdown & Delivery status */}
          {(msg.time || msg.expiresAt || msg.isEdited) && (
            <div className="flex items-center gap-1.5 mt-1 px-1 flex-wrap">
              {msg.time && (
                <button
                  type="button"
                  onClick={() => onShowMessageDetails(msg)}
                  title={`Sent at ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : msg.time} • Click to view exact time & date details`}
                  className="text-[10px] opacity-60 hover:opacity-100 hover:text-amber-300 transition-all cursor-pointer inline-flex items-center gap-1 group/time select-none"
                >
                  <span>{msg.time}</span>
                  <Clock className="w-2.5 h-2.5 opacity-0 group-hover/time:opacity-100 transition-opacity" />
                </button>
              )}

              {/* Discreet Edited indicator */}
              {msg.isEdited && !msg.isDeleted && (
                <span
                  title={msg.editedAt ? `Edited at ${new Date(msg.editedAt).toLocaleTimeString()}` : 'Edited'}
                  className="text-[10px] text-neutral-400/85 italic inline-flex items-center gap-0.5 select-none"
                >
                  <Pencil className="w-2.5 h-2.5 opacity-60 inline" />
                  <span>edited</span>
                </span>
              )}

              {/* Starred indicator badge */}
              {msg.isStarred && !msg.isDeleted && (
                <span
                  title="Starred Message"
                  className="text-amber-400 inline-flex items-center select-none"
                >
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                </span>
              )}

              {/* Live ephemeral countdown badge */}
              {msg.expiresAt && !msg.isDeleted && (
                <EphemeralCountdownBadge
                  expiresAt={msg.expiresAt}
                  messageId={msg.id}
                  onExpire={onExpireMessage}
                  isMe={isMe}
                />
              )}

              {isMe && (
                <span
                  title={
                    msg.status === 'sending'
                      ? 'Sending encrypted payload...'
                      : (isSeen || msg.seen)
                      ? 'Seen by peer'
                      : 'Encrypted & delivered'
                  }
                  className="inline-flex items-center select-none ml-0.5"
                >
                  {msg.status === 'sending' ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                  ) : (isSeen || msg.seen) ? (
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Check className="w-3 h-3 text-neutral-400 opacity-70" />
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.msg === next.msg &&
      prev.isMe === next.isMe &&
      prev.isSeen === next.isSeen &&
      prev.isHighlighted === next.isHighlighted &&
      prev.showDateDivider === next.showDateDivider &&
      prev.currentDateGroup === next.currentDateGroup &&
      prev.isPrevSameSender === next.isPrevSameSender &&
      prev.bubbleRadiusClass === next.bubbleRadiusClass &&
      prev.targetName === next.targetName &&
      prev.myUserId === next.myUserId &&
      prev.isPinned === next.isPinned &&
      prev.isCopied === next.isCopied &&
      prev.currentTheme === next.currentTheme &&
      prev.activeRoomId === next.activeRoomId &&
      prev.roomPassword === next.roomPassword &&
      prev.blurGuardActive === next.blurGuardActive
    );
  }
);
ChatMessageItem.displayName = 'ChatMessageItem';
