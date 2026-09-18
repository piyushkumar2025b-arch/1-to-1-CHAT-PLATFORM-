export type SenderType = 'me' | 'peer' | 'system';

export interface FileAttachment {
  fileId: string;
  fileName: string;
  fileSize: number; // original size in bytes
  compressedSize: number; // compressed size in bytes
  mimeType: string;
  isCompressed: boolean;
  chunkCount: number;
  previewUrl?: string; // thumbnail data URL if image
  inlineData?: string; // base64 payload if small enough to be stored directly
  isVoice?: boolean;
  duration?: number; // duration in seconds for voice notes / audio
  waveformData?: number[]; // simplified waveform bars [0..1]
  viewOnce?: boolean;
  viewed?: boolean;
  viewedAt?: string;
  burned?: boolean;
  transcription?: string;
}

export interface ReplyReference {
  id: string;
  senderName: string; // "You" | "Peer"
  senderId?: string;
  text?: string;
  fileName?: string;
  isVoice?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
  isClosed?: boolean;
  creatorId: string;
}

export interface ScheduledMessage {
  id: string;
  text: string;
  scheduledAt: number; // Unix timestamp in ms
  file?: FileAttachment;
  replyTo?: ReplyReference;
  isEphemeral?: boolean;
  ephemeralDuration?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: SenderType;
  senderId?: string;
  time?: string;
  createdAt?: string;
  file?: FileAttachment;
  replyTo?: ReplyReference;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  status?: 'sending' | 'sent' | 'failed';
  uploadProgress?: number; // 0 - 100 for sending indicator
  seen?: boolean;
  seenAt?: number;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  deletedAt?: string;
  isEdited?: boolean;
  editedAt?: string;
  viewOnce?: boolean;
  viewed?: boolean;
  viewedAt?: string;
  burned?: boolean;
  burnedAt?: string;
  isEphemeral?: boolean;
  ephemeralDuration?: number; // duration in ms
  expiresAt?: number; // timestamp in ms when message disappears
  isStarred?: boolean;
  poll?: PollData;
}

export type EphemeralTimerOption = 'off' | '10s' | '30s' | '1m' | '5m' | '1h' | '24h';

export interface EphemeralSetting {
  enabled: boolean;
  durationOption: EphemeralTimerOption;
  durationMs: number;
}

export interface SharedLinkItem {
  url: string;
  domain: string;
  title?: string;
  messageId: string;
  sender: SenderType;
  senderName: string;
  time: string;
  createdAt: string;
}

export type CallType = 'video' | 'audio';

export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'declined'
  | 'busy'
  | 'missed'
  | 'error';

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callType: CallType;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  createdAt: string;
  endedAt?: string;
}

export type ConnectionState =
  | 'unauthenticated'
  | 'authenticating'
  | 'waiting'
  | 'connected'
  | 'room_full'
  | 'disconnected';

export interface ChatTheme {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  accentColor: string;
  bgStyle: string; // Tailwind background or gradient classes
  headerStyle: string;
  inputStyle: string;
  myBubbleStyle: string;
  peerBubbleStyle: string;
  previewColor: string;
  customBgUrl?: string;
  customDim?: number; // 0 to 90 %
}

export interface GroupRoomRequest {
  id: string;
  requestedSize: number;
  useCase: string;
  customDetails?: string;
  securityPriority: string;
  contact?: string;
  createdAt: string;
}




