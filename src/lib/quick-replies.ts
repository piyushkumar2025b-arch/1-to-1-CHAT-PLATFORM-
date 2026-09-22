export interface QuickReplyItem {
  id: string;
  title: string;
  text: string;
  category: 'status' | 'actions' | 'privacy' | 'custom';
  isCustom?: boolean;
}

export const DEFAULT_QUICK_REPLIES: QuickReplyItem[] = [
  {
    id: 'qr-1',
    title: 'On it',
    text: '👍 Sounds good, looking into this right now.',
    category: 'status',
  },
  {
    id: 'qr-2',
    title: '5 minutes late',
    text: '⏳ Running about 5 minutes late, will be right with you.',
    category: 'status',
  },
  {
    id: 'qr-3',
    title: 'Received & verified',
    text: '🔒 Verified and received securely on my end.',
    category: 'privacy',
  },
  {
    id: 'qr-4',
    title: 'Hop on a call?',
    text: '📞 Are you free to hop on a quick voice or video call?',
    category: 'actions',
  },
  {
    id: 'qr-5',
    title: 'Sending file',
    text: '📎 Preparing and encrypting the attachment now, sending in a second.',
    category: 'actions',
  },
  {
    id: 'qr-6',
    title: 'No rush',
    text: '☕ Take your time, no rush at all!',
    category: 'status',
  },
  {
    id: 'qr-7',
    title: 'Check link / code',
    text: '🔍 Could you double-check the room password or code?',
    category: 'privacy',
  },
  {
    id: 'qr-8',
    title: 'AFK briefly',
    text: '🚶 Stepping away from keyboard for a few minutes.',
    category: 'status',
  },
  {
    id: 'qr-9',
    title: 'Burn after reading',
    text: '🔥 Please view this and burn/clear when done.',
    category: 'privacy',
  },
  {
    id: 'qr-10',
    title: 'All done & tested',
    text: '✅ All changes tested, verified, and ready to go!',
    category: 'actions',
  },
  {
    id: 'qr-11',
    title: 'Vote on the poll',
    text: '📊 I just launched a quick poll above, please vote your choice!',
    category: 'actions',
  },
  {
    id: 'qr-12',
    title: 'Zero logs policy',
    text: '🛡️ Reminder: this session is peer-to-peer encrypted with zero server logs.',
    category: 'privacy',
  },
];

const STORAGE_KEY = 'private_chat_custom_quick_replies';

export function getCustomQuickReplies(): QuickReplyItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomQuickReplies(items: QuickReplyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Fail silently in sandbox
  }
}

export function getAllQuickReplies(): QuickReplyItem[] {
  const custom = getCustomQuickReplies();
  return [...custom, ...DEFAULT_QUICK_REPLIES];
}
