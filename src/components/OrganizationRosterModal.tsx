import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  Crown,
  Search,
  Copy,
  Check,
  Lock,
  Share2,
  Sparkles,
  Wifi,
  Pencil,
} from 'lucide-react';
import { RoomParticipant, RoomType } from '../types';

interface OrganizationRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomType: RoomType;
  organizationName?: string;
  participantCount: number;
  maxCapacity: number;
  participants: RoomParticipant[];
  currentUserId: string;
  currentUsername?: string;
  onUpdateUsername?: (newUsername: string) => void;
  onCopyRoomId: () => void;
  onOpenShareModal: () => void;
}

export const OrganizationRosterModal: React.FC<OrganizationRosterModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomType,
  organizationName,
  participantCount,
  maxCapacity,
  participants,
  currentUserId,
  currentUsername,
  onUpdateUsername,
  onCopyRoomId,
  onOpenShareModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Filter participants by search query
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase().trim();
    return participants.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.role && p.role.toLowerCase().includes(q))
    );
  }, [participants, searchQuery]);

  const handleCopyUserId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  // Determine avatar background color deterministically from user ID
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-emerald-600',
      'bg-indigo-600',
      'bg-sky-600',
      'bg-teal-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-purple-600',
      'bg-cyan-600',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              {roomType === 'organization' ? (
                <Building2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Users className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-neutral-100">
                  {organizationName || (roomType === 'organization' ? 'Organization Team Room' : 'Direct Room')}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  {roomType === 'organization' ? 'Org Room' : '1-on-1'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Room Code:{' '}
                <span className="font-mono font-bold text-emerald-400">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Counter Banner */}
        <div className="px-4 py-3 bg-neutral-950/70 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-neutral-200">
              <span className="text-emerald-400 font-bold text-sm">{participantCount}</span>
              {' '}of{' '}
              <span className="text-neutral-400">{maxCapacity}</span> members online
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCopyRoomId}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </button>
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/70 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>Invite Teammates</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 sm:px-5 sm:pt-4 sm:pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or ID..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Participant List (Dynamic, real data only) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 divide-y divide-neutral-800/50">
          {filteredParticipants.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No members matched "{searchQuery}"
            </div>
          ) : (
            filteredParticipants.map((member, idx) => {
              const isMe = member.id === currentUserId;
              const initials = (member.username || member.id).slice(0, 2).toUpperCase();
              const isAdmin = member.role === 'admin' || idx === 0;

              return (
                <div
                  key={member.id}
                  className={`pt-2.5 pb-2 flex items-center justify-between gap-3 px-2 rounded-xl transition-colors ${
                    isMe ? 'bg-neutral-800/40' : 'hover:bg-neutral-800/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs ${getAvatarColor(
                          member.id
                        )}`}
                      >
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isMe && isEditingName ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (draftName.trim() && onUpdateUsername) {
                                onUpdateUsername(draftName.trim());
                              }
                              setIsEditingName(false);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              type="text"
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              maxLength={40}
                              autoFocus
                              placeholder="Your display name..."
                              className="px-2 py-0.5 bg-neutral-950 border border-emerald-500/60 rounded-lg text-xs text-white focus:outline-none w-36 sm:w-44"
                            />
                            <button
                              type="submit"
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingName(false)}
                              className="px-1.5 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate">
                              {isMe && currentUsername ? currentUsername : member.username}
                            </span>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                You
                              </span>
                            )}
                            {isMe && onUpdateUsername && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftName(currentUsername || member.username || '');
                                  setIsEditingName(true);
                                }}
                                title="Edit your display name"
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/50 cursor-pointer transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                <span>Edit Name</span>
                              </button>
                            )}
                          </>
                        )}
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Room Admin</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="font-mono">ID: {member.id.slice(0, 16)}...</span>
                        <button
                          type="button"
                          onClick={() => handleCopyUserId(member.id)}
                          title="Copy Full User ID"
                          className="hover:text-neutral-300 transition-colors cursor-pointer"
                        >
                          {copiedId === member.id ? (
                            <Check className="w-3 h-3 text-emerald-400 inline" />
                          ) : (
                            <Copy className="w-3 h-3 inline" />
                          )}
                        </button>
                        <span>•</span>
                        <span className="text-emerald-500 font-medium">Active now</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      Connected
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Security & Multi-party Encryption Footer */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-neutral-200 font-semibold block">
              Organizational E2EE Enclave Active
            </span>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Every message, file, and stroke shared in this room is encrypted with AES-256-GCM. All {participantCount} connected members hold the identical verified room key derived in their local enclave.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
