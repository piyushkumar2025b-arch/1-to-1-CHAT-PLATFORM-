import React, { useState, useEffect, useRef, useMemo, useCallback, FormEvent, KeyboardEvent, ChangeEvent, DragEvent, Fragment } from 'react';
import {
  Copy,
  Check,
  LogOut,
  Dices,
  Send,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Paperclip,
  UploadCloud,
  Palette,
  Mic,
  Reply,
  Copy as CopyIcon,
  Video,
  Phone,
  Smile,
  QrCode,
  Camera,
  Bell,
  BellOff,
  RefreshCw,
  Archive,
  Share2,
  Link2,
  ArrowUpRight,
  Trash2,
  Ban,
  Clock,
  Info,
  Music,
  BellRing,
  X,
  Wifi,
  FileText,
  AlertTriangle,
  Pin,
  CheckCheck,
  Loader2,
  Keyboard,
  Lock,
  Terminal,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  deleteField,
  runTransaction,
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { MessageDeleteDialog } from './components/MessageDeleteDialog';
import { MessageDetailsModal } from './components/MessageDetailsModal';
import { BackgroundMusicPlayer } from './components/BackgroundMusicPlayer';
import { db } from './lib/firebase';
import { ChatMessage, ConnectionState, FileAttachment, ReplyReference, ChatTheme, CallType } from './types';
import { prepareFileForSharing, prepareVoiceAttachment } from './lib/file-compression';
import { sanitizeForFirestore } from './lib/sanitize';
import { getSavedTheme, saveThemeSelection } from './lib/themes';
import { VoiceRecorder } from './lib/voice-recorder';
import { CallDataFirestore, callAudioEffects } from './lib/webrtc-call';
import FloatingTypingIndicator from './components/FloatingTypingIndicator';
import FileMessageBubble from './components/FileMessageBubble';
import FileCompressProgressModal from './components/FileCompressProgressModal';
import ThemeSelectorModal from './components/ThemeSelectorModal';
import ReplyBanner from './components/ReplyBanner';
import VoiceRecorderBar from './components/VoiceRecorderBar';
import { EmojiPickerPopover } from './components/EmojiPickerPopover';
import { VideoCallModal } from './components/VideoCallModal';
import { MessageReactions } from './components/MessageReactions';
import { SecurityShieldModal } from './components/SecurityShieldModal';
import { SecurityToast, ToastType } from './components/SecurityToast';
import { RoomQrModal } from './components/RoomQrModal';
import { QrScannerModal } from './components/QrScannerModal';
import { LandingHeroView } from './components/LandingHeroView';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ChatVaultModal } from './components/ChatVaultModal';
import { CollaborativeScratchpadModal } from './components/CollaborativeScratchpadModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { LinkPreviewCard } from './components/LinkPreviewCard';
import { InteractiveCheckeredBackground } from './components/InteractiveCheckeredBackground';
import { PolicyTermsModal } from './components/PolicyTermsModal';
import { SystemDiagnosticsModal } from './components/SystemDiagnosticsModal';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInputBar } from './components/ChatInputBar';
import { ChatAppearanceModal } from './components/ChatAppearanceModal';
import { QuickRepliesModal } from './components/QuickRepliesModal';
import { PersonalNotesModal } from './components/PersonalNotesModal';
import { CryptoCipherModal } from './components/CryptoCipherModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { BurnOnReadModal } from './components/BurnOnReadModal';
import { SteganographyModal } from './components/SteganographyModal';
import { AcousticShieldModal } from './components/AcousticShieldModal';
import { FileShredderModal } from './components/FileShredderModal';
import { addPersonalNote } from './lib/personal-notes';
import { getDisplaySettings, saveDisplaySettings, DisplaySettings } from './lib/display-settings';
import { stopSpeaking } from './lib/text-to-speech';
import { StarredMessagesModal } from './components/StarredMessagesModal';
import { ChatExportModal } from './components/ChatExportModal';
import { StealthDecoyModal } from './components/StealthDecoyModal';
import { CreatePollModal } from './components/CreatePollModal';
import { QuickDrawModal } from './components/QuickDrawModal';
import { ScheduleMessageModal } from './components/ScheduleMessageModal';
import { ScheduledMessagesTray } from './components/ScheduledMessagesTray';
import ImageEditorModal from './components/ImageEditorModal';
import { CodeSandboxModal } from './components/CodeSandboxModal';
import { BlurGuardShield } from './components/BlurGuardShield';
import { ChatSearchBar, SearchFilterType } from './components/ChatSearchBar';
import { PinnedMessageBanner } from './components/PinnedMessageBanner';
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import { StagedAttachmentPreview } from './components/StagedAttachmentPreview';
import { MessageContentRenderer } from './components/MessageContentRenderer';
import { SlashCommandMenu, SlashCommand } from './components/SlashCommandMenu';
import { EphemeralSettingsModal } from './components/EphemeralSettingsModal';
import { EphemeralCountdownBadge } from './components/EphemeralCountdownBadge';
import { EphemeralTimerOption, PollData, ScheduledMessage } from './types';
import { getDurationMs, formatRemainingTime } from './lib/ephemeral-utils';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import QuickReactionHoverBar from './components/QuickReactionHoverBar';
import ConversationStarters from './components/ConversationStarters';
import { useNetworkPing } from './lib/useNetworkPing';
import { parseTextWithUrls, extractUrlsFromText } from './lib/link-utils';
import {
  playIncomingMessageSound,
  playSentMessageSound,
  playPeerJoinedSound,
  playPeerLeftSound,
  triggerTitleAlert,
  clearTitleAlert,
  sendBrowserNotification,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from './lib/notifications';
import { realTimeSocket } from './lib/realtime-socket';
import { parseQrJoinPayload } from './lib/qr-helper';
import {
  enableSecurityShield,
  getBruteForceLockout,
  recordFailedAttempt,
  resetFailedAttempts,
  hashPasswordSalted,
  verifyRoomPassword,
  evaluatePasswordStrength,
  sanitizeChatMessage,
  validateAndSanitizeFileName,
  burnRoomAndDestroyAllData,
  cleanExpiredRoomArtifacts,
  sanitizeDecryptedHtml,
  copyToClipboardSafe,
} from './lib/security';
import {
  encryptWithEnclave,
  decryptWithEnclave,
  purgeEnclaveKey,
  prewarmEnclaveKey,
  floodLimiter,
  scheduleClipboardAutoWipe,
} from './lib/crypto-enclave';
import { PrivacyLockGuard } from './components/PrivacyLockGuard';
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionSupported,
} from './lib/speech-recognition';

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session Privacy Lock & Inactivity Guard
  const [sessionLocked, setSessionLocked] = useState(false);
  const [sessionLockReason, setSessionLockReason] = useState('Session locked for security & privacy');
  const lastActivityTimeRef = useRef<number>(Date.now());

  // QR Code Modals State
  const [roomQrOpen, setRoomQrOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Security Shield & Anti-Tamper State
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityToastMessage, setSecurityToastMessage] = useState<string | null>(null);
  const [securityToastType, setSecurityToastType] = useState<ToastType>('info');

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setSecurityToastType(type);
    setSecurityToastMessage(msg);
  }, []);

  const [lockoutTimer, setLockoutTimer] = useState<{ isLocked: boolean; remainingSeconds: number }>({
    isLocked: false,
    remainingSeconds: 0,
  });

  // Policy, Terms, System Diagnostics, and Shortcuts States
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<'privacy' | 'terms' | 'compliance'>('privacy');
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Network Ping Real-Time Monitor Hook
  const {
    pingMs,
    quality: pingQuality,
    jitterMs,
    avgPingMs,
    minPingMs,
    maxPingMs,
    targetName,
    history: pingHistory,
  } = useNetworkPing(4000);

  const [connectionState, setConnectionState] = useState<ConnectionState>('unauthenticated');
  const [activeRoomId, setActiveRoomId] = useState('');
  const activePasswordRef = useRef<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ChatTheme>(() => getSavedTheme());
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Emoji picker & Slash commands state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');

  // Video and Voice call state
  const [videoCallModalOpen, setVideoCallModalOpen] = useState(false);
  const [isVideoCaller, setIsVideoCaller] = useState(false);
  const [callType, setCallType] = useState<CallType>('video');
  const [incomingCallData, setIncomingCallData] = useState<CallDataFirestore | null>(null);

  // Replying / Tagging state
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Vault, Scratchpad, and Link Sharing State
  const [vaultOpen, setVaultOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false);
  const [shareLinkInitialMode, setShareLinkInitialMode] = useState<'send_link' | 'share_room'>('send_link');

  // Notification states and sound controls
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const previousPeerCountRef = useRef<number>(0);
  const initialMessagesLoadedRef = useRef<boolean>(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [peerLastReadTimestamp, setPeerLastReadTimestamp] = useState<number>(0);
  const lastMarkedReadRef = useRef<number>(0);

  // Message Delete & Details state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [messageForDetails, setMessageForDetails] = useState<ChatMessage | null>(null);

  // Auto-disappearing / Ephemeral Messages state
  const [ephemeralModalOpen, setEphemeralModalOpen] = useState(false);
  const [ephemeralEnabled, setEphemeralEnabled] = useState(false);
  const [ephemeralDurationOption, setEphemeralDurationOption] = useState<EphemeralTimerOption>('1m');
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());

  // Background Music Player state
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(false);
  const [activeSongName, setActiveSongName] = useState<string | null>(null);

  // Code Snippet Sandbox state
  const [codeSandboxOpen, setCodeSandboxOpen] = useState(false);
  const [codeSandboxSnippet, setCodeSandboxSnippet] = useState<{
    code: string;
    language?: string;
    title?: string;
  } | null>(null);

  // Message Editing state (within 15-minute window)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const draftBeforeEditRef = useRef<string>('');

  // Image Drawing & Redaction Editor state
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);
  const [imageEditorPreviewUrl, setImageEditorPreviewUrl] = useState<string | null>(null);

  // View-Once / Burn-on-Read media toggle state
  const [isViewOnce, setIsViewOnce] = useState(false);

  // Screenshot & Blur Guard state
  const [blurGuardActive, setBlurGuardActive] = useState(() => {
    return localStorage.getItem('blur_guard_active') === 'true';
  });
  const [blurGuardTriggered, setBlurGuardTriggered] = useState(false);
  const [blurGuardReason, setBlurGuardReason] = useState('Window inactive or tab switched away');

  const handleOpenCodeSandbox = (code?: string, language?: string, title?: string) => {
    if (code) {
      setCodeSandboxSnippet({ code, language, title });
    } else {
      setCodeSandboxSnippet(null);
    }
    setCodeSandboxOpen(true);
  };

  const handleToggleBlurGuard = () => {
    setBlurGuardActive((prev) => {
      const next = !prev;
      localStorage.setItem('blur_guard_active', String(next));
      if (next) {
        setSecurityToastMessage('Screenshot & Blur Guard ACTIVATED. Unfocused screens and screenshot keys will blur the chat.');
      } else {
        setBlurGuardTriggered(false);
        setSecurityToastMessage('Screenshot & Blur Guard turned OFF.');
      }
      return next;
    });
  };

  // Starred messages, Chat export & Stealth Decoy state
  const [starredModalOpen, setStarredModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [stealthDecoyOpen, setStealthDecoyOpen] = useState(false);
  const lastEscapePressRef = useRef<number>(0);

  // Display Appearance & Quick Replies state
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => getDisplaySettings());
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);
  const [quickRepliesModalOpen, setQuickRepliesModalOpen] = useState(false);
  const [personalNotesModalOpen, setPersonalNotesModalOpen] = useState(false);
  const [cryptoCipherModalOpen, setCryptoCipherModalOpen] = useState(false);
  const [passwordGenModalOpen, setPasswordGenModalOpen] = useState(false);
  const [burnOnReadModalOpen, setBurnOnReadModalOpen] = useState(false);
  const [steganographyModalOpen, setSteganographyModalOpen] = useState(false);
  const [steganographyInspectText, setSteganographyInspectText] = useState('');
  const [acousticShieldModalOpen, setAcousticShieldModalOpen] = useState(false);
  const [fileShredderModalOpen, setFileShredderModalOpen] = useState(false);

  const handleSaveToNotes = useCallback((msg: ChatMessage) => {
    const textContent = msg.text || (msg.file ? `[File Attachment: ${msg.file.fileName}]` : '');
    if (!textContent) return;
    addPersonalNote({
      title: `Saved from ${msg.sender === 'me' ? 'You' : targetName || 'Peer'}`,
      content: textContent,
      sourceMessageId: msg.id,
      sourceSender: msg.sender === 'me' ? 'You' : targetName || 'Peer',
    });
    setSecurityToastMessage('Message saved to Encrypted Personal Notes (/notes)!');
  }, [targetName]);

  const handleUpdateDisplaySettings = useCallback((newSettings: DisplaySettings) => {
    setDisplaySettings(newSettings);
    saveDisplaySettings(newSettings);
    setSecurityToastMessage('Display and appearance preferences saved.');
  }, []);

  // Interactive Polls, Quick Draw Sketching & Scheduled Messages state
  const [createPollModalOpen, setCreatePollModalOpen] = useState(false);
  const [quickDrawModalOpen, setQuickDrawModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);

  const handleToggleStarMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      let isNowStarred = false;
      const updated = prev.map((msg) => {
        if (msg.id === messageId) {
          isNowStarred = !msg.isStarred;
          return { ...msg, isStarred: isNowStarred };
        }
        return msg;
      });
      setSecurityToastMessage(
        isNowStarred ? 'Message starred! Saved to Starred list.' : 'Message removed from Starred list.'
      );
      return updated;
    });
  }, []);

  const starredCount = useMemo(() => {
    return messages.filter((m) => m.isStarred && !m.isDeleted).length;
  }, [messages]);

  // Stealth Decoy global shortcut listener (Double Esc or Alt+P)
  useEffect(() => {
    const handleStealthKey = (e: globalThis.KeyboardEvent) => {
      // Alt+P or Ctrl+Shift+X
      if (
        (e.altKey && (e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'x' || e.key === 'X'))
      ) {
        e.preventDefault();
        setStealthDecoyOpen((prev) => !prev);
        return;
      }

      // Double Escape within 450ms
      if (e.key === 'Escape' && !stealthDecoyOpen) {
        const now = Date.now();
        if (now - lastEscapePressRef.current <= 450) {
          setStealthDecoyOpen(true);
          lastEscapePressRef.current = 0;
        } else {
          lastEscapePressRef.current = now;
        }
      }
    };

    window.addEventListener('keydown', handleStealthKey);
    return () => window.removeEventListener('keydown', handleStealthKey);
  }, [stealthDecoyOpen]);

  // Screenshot & Blur Guard active visibility and key interception listener
  useEffect(() => {
    if (!blurGuardActive) {
      setBlurGuardTriggered(false);
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setBlurGuardReason('Tab switched away (Anti-Screen Snoop)');
        setBlurGuardTriggered(true);
      }
    };

    const handleWindowBlur = () => {
      setBlurGuardReason('Window lost focus (Background Veil)');
      setBlurGuardTriggered(true);
    };

    const handleScreenshotKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'))
      ) {
        setBlurGuardReason('Screenshot shortcut detected');
        setBlurGuardTriggered(true);
        setSecurityToastMessage('Screenshot attempt guarded — chat obscured with privacy veil');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleScreenshotKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleScreenshotKeyDown);
    };
  }, [blurGuardActive]);

  // Check notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      const perm = getNotificationPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        setDesktopEnabled(true);
        setShowNotifBanner(false);
      } else if (perm === 'default') {
        setShowNotifBanner(true);
      }
    }
  }, []);

  // Request browser notification permission explicitly
  const handleRequestDesktopPermission = async () => {
    if (!isNotificationSupported()) {
      setSecurityToastMessage('Browser notifications are not supported in this environment.');
      return;
    }
    try {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        setDesktopEnabled(true);
        setShowNotifBanner(false);
        sendBrowserNotification(
          {
            title: '🔔 Desktop Notifications Active!',
            body: 'Real-time alert notifications will now pop up when new messages arrive.',
          },
          true
        );
      } else if (perm === 'denied') {
        setShowNotifBanner(false);
        setSecurityToastMessage(
          'Notifications blocked. Please check your browser site permissions or open the app in a new tab.'
        );
      }
    } catch (e) {
      console.warn('Permission request error:', e);
    }
  };

  // Voice recording engine state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const voiceRecorderRef = useRef<VoiceRecorder>(new VoiceRecorder());

  // Voice speech-to-text dictation & voice message transcription state
  const [isDictating, setIsDictating] = useState(false);
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('');
  const voiceTranscriptRef = useRef<string>('');

  const handleToggleVoiceDictation = useCallback(() => {
    if (isDictating) {
      stopSpeechRecognition();
      setIsDictating(false);
      setSecurityToastMessage('Voice dictation stopped.');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSecurityToastMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const started = startSpeechRecognition({
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsDictating(true);
        setSecurityToastMessage('🎙️ Voice dictation active. Speak to type...');
      },
      onResult: (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          setInputText((prev) => {
            const clean = prev.trim();
            return clean ? `${clean} ${transcript.trim()} ` : `${transcript.trim()} `;
          });
        }
      },
      onError: (err) => {
        setIsDictating(false);
        setSecurityToastMessage(err || 'Voice dictation paused.');
      },
      onEnd: () => {
        setIsDictating(false);
      },
    });

    if (started) {
      setIsDictating(true);
    }
  }, [isDictating]);

  // Live writing / typing state
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // File sharing & drag states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [compressModal, setCompressModal] = useState<{
    fileName: string;
    fileSize: number;
    step: string;
    percent: number;
  } | null>(null);

  // Unique session ID for this browser tab / window
  const [myUserId] = useState(() => {
    const existing = sessionStorage.getItem('chat_session_user_id');
    if (existing) return existing;
    const newId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem('chat_session_user_id', newId);
    return newId;
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // High performance message fingerprint cache: avoids re-decrypting unchanged Firestore docs
  const processedMessagesCacheRef = useRef<Map<string, { hash: string; msg: ChatMessage }>>(new Map());

  // Staged File Attachment (from File picker, Drag-and-Drop, or Clipboard Paste)
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);

  const clearStagedFile = () => {
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedFile(null);
    setStagedPreviewUrl(null);
  };

  // Pinned Message state
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);

  // Chat Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>('all');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Scroll to bottom floating button state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadScrolledCount, setUnreadScrolledCount] = useState(0);

  // Activate Anti-Tamper & Right-Click Deterrence Shield
  useEffect(() => {
    const cleanup = enableSecurityShield((msg) => {
      showToast(msg, 'warning');
    });

    return () => {
      cleanup();
    };
  }, [showToast]);

  // Parse shareable room invite link query params (?room=XYZ&pwd=ABC) on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      const urlPwd = params.get('pwd');
      if (urlRoom) {
        setRoomId(urlRoom.trim().toUpperCase());
      }
      if (urlPwd) {
        setPassword(urlPwd);
      }
      // CRITICAL SECURITY: Immediately scrub credentials from browser address bar & history
      // so passwords and codes are never exposed over the shoulder or persisted in history
      if (urlPwd || urlRoom) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Monitor anti-brute force lockout for the entered room ID
  useEffect(() => {
    const clean = roomId.trim().toUpperCase();
    if (!clean) {
      setLockoutTimer({ isLocked: false, remainingSeconds: 0 });
      return;
    }

    const check = getBruteForceLockout(clean);
    setLockoutTimer({ isLocked: check.isLocked, remainingSeconds: check.remainingSeconds });

    if (check.isLocked) {
      const interval = setInterval(() => {
        const updated = getBruteForceLockout(clean);
        setLockoutTimer({ isLocked: updated.isLocked, remainingSeconds: updated.remainingSeconds });
        if (!updated.isLocked) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  // Monitor browser fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  // Update participant's lastReadTimestamp in Firestore when chat is active & visible
  const markMessagesAsRead = useCallback(() => {
    if (!activeRoomId || connectionState === 'disconnected' || connectionState === 'unauthenticated') return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const now = Date.now();
    if (now - lastMarkedReadRef.current < 1200) return;
    lastMarkedReadRef.current = now;

    const roomRef = doc(db, 'rooms', activeRoomId);
    updateDoc(roomRef, {
      [`participants.${myUserId}.lastReadTimestamp`]: now,
      lastActiveAt: new Date().toISOString(),
    }).catch((err) => {
      console.warn('Failed to update lastReadTimestamp in Firestore:', err);
    });
  }, [activeRoomId, connectionState, myUserId]);

  // Clear unread title alert and mark messages as read when tab is focused or visible
  useEffect(() => {
    const handleFocus = () => {
      clearTitleAlert();
      markMessagesAsRead();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('click', handleFocus);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        handleFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTitleAlert();
    };
  }, [markMessagesAsRead]);

  // Automatically mark incoming messages as read when user is already in active room
  useEffect(() => {
    if (messages.length > 0 && activeRoomId && (connectionState === 'connected' || connectionState === 'waiting')) {
      markMessagesAsRead();
    }
  }, [messages.length, activeRoomId, connectionState, markMessagesAsRead]);

  // Focus message input automatically when connection enters 'connected' state
  useEffect(() => {
    if (connectionState === 'connected') {
      inputRef.current?.focus();
    }
  }, [connectionState]);

  // Real-time Firestore synchronization for Room & Messages
  useEffect(() => {
    if (!activeRoomId) return;

    // Reset notification trackers on room connection
    initialMessagesLoadedRef.current = false;
    seenMessageIdsRef.current.clear();
    previousPeerCountRef.current = 0;
    processedMessagesCacheRef.current.clear();

    const roomRef = doc(db, 'rooms', activeRoomId);
    const roomPwd = activePasswordRef.current || password.trim();

    // Connect to ultra-low latency real-time WebSocket tunnel (<10ms)
    realTimeSocket.connect(activeRoomId, roomPwd, myUserId);

    // Fast socket message listener (<10ms peer delivery)
    const unsubSocketMsg = realTimeSocket.onMessage(async (payload, senderId) => {
      if (!payload) return;
      const msgId = payload.messageId || 'sock_' + Date.now();
      if (seenMessageIdsRef.current.has(msgId)) return;
      seenMessageIdsRef.current.add(msgId);

      const isMe = senderId === myUserId;
      let decryptedText = payload.text || '';
      let decryptedFile = payload.file;
      let decryptedReplyTo = payload.replyTo;

      if (payload.enc && payload.encryptedData) {
        try {
          const dec = await decryptWithEnclave(payload.encryptedData, roomPwd, activeRoomId);
          if (dec) {
            decryptedText = dec.text || '';
            if (dec.file) decryptedFile = dec.file;
            if (dec.replyTo) decryptedReplyTo = dec.replyTo;
          }
        } catch {
          // ignore decryption failure
        }
      }

      const receivedMsg: ChatMessage = {
        id: msgId,
        text: decryptedText,
        sender: isMe ? 'me' : 'peer',
        senderId: senderId,
        time: payload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        file: decryptedFile,
        replyTo: decryptedReplyTo,
        isEphemeral: Boolean(payload.isEphemeral),
        ephemeralDuration: payload.ephemeralDuration,
        expiresAt: payload.expiresAt,
        createdAt: payload.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, receivedMsg];
      });

      if (!isMe) {
        if (soundEnabled) {
          playIncomingMessageSound();
        }
        if (desktopEnabled && document.hidden) {
          sendBrowserNotification({
            title: `Private Chat (${activeRoomId})`,
            body: decryptedText || (decryptedFile ? `📎 ${decryptedFile.fileName}` : 'New message'),
          });
        }
        triggerTitleAlert(1);
      }
    });

    // Instant socket typing listener (<2ms)
    const unsubSocketTyping = realTimeSocket.onTyping((isTyping, senderId) => {
      if (senderId === myUserId) return;
      setIsPeerTyping(isTyping);
    });

    // Instant socket read receipt listener (<5ms)
    const unsubSocketRead = realTimeSocket.onReadReceipt((timestamp, senderId) => {
      if (senderId === myUserId) return;
      setPeerLastReadTimestamp((prev) => Math.max(prev, timestamp));
    });

    // Instant socket reaction listener (<2ms)
    const unsubSocketReaction = realTimeSocket.onReaction((payload, senderId) => {
      if (!payload || !payload.messageId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== payload.messageId) return msg;
          const currentReactions = msg.reactions || {};
          const currentUsers = currentReactions[payload.emoji] || [];
          let updatedUsers: string[];
          if (payload.type === 'add') {
            updatedUsers = currentUsers.includes(senderId) ? currentUsers : [...currentUsers, senderId];
          } else {
            updatedUsers = currentUsers.filter((u) => u !== senderId);
          }
          const nextReactions = { ...currentReactions };
          if (updatedUsers.length > 0) {
            nextReactions[payload.emoji] = updatedUsers;
          } else {
            delete nextReactions[payload.emoji];
          }
          return { ...msg, reactions: nextReactions };
        })
      );
    });

    // 1. Room snapshot listener for participant presence & typing indicator
    const unsubscribeRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConnectionState('disconnected');
          return;
        }

        const data = snapshot.data();
        const participants: Record<string, any> = data?.participants || {};
        const now = Date.now();

        // Active participants seen within last 25 seconds
        const activeList = Object.values(participants).filter(
          (p: any) => p && now - (p.lastSeen || 0) < 25000
        );

        const count = activeList.length;

        // Peer arrival & departure notification sound and desktop push
        if (previousPeerCountRef.current === 1 && count >= 2) {
          if (soundEnabled) {
            playPeerJoinedSound();
          }
          if (desktopEnabled && document.hidden) {
            sendBrowserNotification({
              title: 'Peer Connected',
              body: `The second person has joined room ${activeRoomId}!`,
            });
          }
          triggerTitleAlert(1);
        } else if (previousPeerCountRef.current >= 2 && count < 2) {
          if (soundEnabled) {
            playPeerLeftSound();
          }
          if (desktopEnabled && document.hidden) {
            sendBrowserNotification({
              title: 'Peer Disconnected',
              body: 'Your peer has left the private room.',
            });
          }
        }
        previousPeerCountRef.current = count;

        // Check if peer is typing
        let peerWriting = false;
        for (const [id, p] of Object.entries(participants)) {
          if (id !== myUserId && p) {
            if (p.typing === true && now - (p.typingTimestamp || 0) < 6000) {
              peerWriting = true;
              break;
            }
          }
        }
        setIsPeerTyping(peerWriting);

        // Extract peer's latest lastReadTimestamp
        let latestPeerReadTime = 0;
        for (const [id, p] of Object.entries(participants)) {
          if (id !== myUserId && p) {
            if (typeof p.lastReadTimestamp === 'number' && p.lastReadTimestamp > latestPeerReadTime) {
              latestPeerReadTime = p.lastReadTimestamp;
            }
          }
        }
        setPeerLastReadTimestamp(latestPeerReadTime);

        // Sync room-wide ephemeral settings if set
        if (data?.ephemeralSettings) {
          setEphemeralEnabled(Boolean(data.ephemeralSettings.enabled));
          if (data.ephemeralSettings.durationOption) {
            setEphemeralDurationOption(data.ephemeralSettings.durationOption);
          }
        }

        if (count >= 2) {
          setConnectionState('connected');
        } else {
          setConnectionState('waiting');
        }
      },
      (err) => {
        console.warn('Room listener error:', err);
      }
    );

    // 2. Real-time messages listener from Firestore subcollection (unconditional collection query)
    const messagesCollectionRef = collection(db, 'rooms', activeRoomId, 'messages');

    const unsubscribeMessages = onSnapshot(
      messagesCollectionRef,
      async (snapshot) => {
        const roomPwd = activePasswordRef.current || password.trim();
        const currentDocIds = new Set<string>();

        const messagePromises = snapshot.docs.map(async (docSnap) => {
          const docId = docSnap.id;
          currentDocIds.add(docId);
          const data = docSnap.data();

          // Compute fast fingerprint for memoization
          const fingerprint = `${data.ts || ''}:${data.ct || ''}:${data.enc ? '1' : '0'}:${data.isDeleted ? '1' : '0'}:${data.deletedForEveryone ? '1' : '0'}:${data.deletedAt || ''}:${data.text || ''}:${data.time || ''}:${JSON.stringify(data.reactions || {})}:${data.expiresAt || ''}:${data.isEdited ? '1' : '0'}:${data.editedAt || ''}:${data.viewed ? '1' : '0'}:${data.burned ? '1' : '0'}:${data.file?.burned ? '1' : '0'}`;

          const cached = processedMessagesCacheRef.current.get(docId);
          if (cached && cached.hash === fingerprint) {
            // Check if expired ephemeral message
            if (cached.msg.expiresAt && Date.now() >= cached.msg.expiresAt) {
              deleteDoc(doc(db, 'rooms', activeRoomId, 'messages', docId)).catch(() => {});
              return null;
            }
            return cached.msg;
          }

          // If message was deleted for everyone, do not decrypt
          if (data.isDeleted || data.deletedForEveryone) {
            const deletedMsg: ChatMessage = {
              id: docId,
              text: '',
              sender: data.senderId === myUserId ? 'me' : 'peer',
              senderId: data.senderId,
              status: 'sent',
              isDeleted: true,
              deletedForEveryone: true,
              deletedAt: data.deletedAt,
              createdAt:
                data.createdAt ||
                (data.ts ? new Date(data.ts).toISOString() : new Date().toISOString()),
              time:
                data.time ||
                (data.createdAt
                  ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''),
            };
            processedMessagesCacheRef.current.set(docId, { hash: fingerprint, msg: deletedMsg });
            return deletedMsg;
          }

          let decryptedText = data.text || '';
          let decryptedFile = data.file as FileAttachment | undefined;
          let decryptedReplyTo = data.replyTo as ReplyReference | undefined;
          let decryptedReactions = (data.reactions || {}) as Record<string, string[]>;
          let decryptedPoll = data.poll as PollData | undefined;
          let isEphemeral = Boolean(data.isEphemeral);
          let ephemeralDuration = data.ephemeralDuration;
          let expiresAt = data.expiresAt;
          let isEdited = Boolean(data.isEdited);
          let editedAt = data.editedAt;
          let viewed = Boolean(data.viewed || data['file.viewed']);
          let viewedAt = data.viewedAt || data['file.viewedAt'];
          let burned = Boolean(data.burned || data['file.burned']);
          let burnedAt = data.burnedAt || data['file.burnedAt'];

          // Decrypt transparently if wrapped in cryptographic enclave
          if (data.enc && data.ct) {
            const dec = await decryptWithEnclave(data, roomPwd, activeRoomId);
            if (dec) {
              if (dec.text !== undefined) decryptedText = sanitizeDecryptedHtml(dec.text);
              if (dec.file !== undefined) decryptedFile = dec.file;
              if (dec.replyTo !== undefined) decryptedReplyTo = dec.replyTo;
              if (dec.reactions !== undefined) decryptedReactions = dec.reactions;
              if (dec.poll !== undefined) decryptedPoll = dec.poll;
              if (dec.isEphemeral !== undefined) isEphemeral = Boolean(dec.isEphemeral);
              if (dec.ephemeralDuration !== undefined) ephemeralDuration = dec.ephemeralDuration;
              if (dec.expiresAt !== undefined) expiresAt = dec.expiresAt;
              if (dec.isEdited !== undefined) isEdited = Boolean(dec.isEdited);
              if (dec.editedAt !== undefined) editedAt = dec.editedAt;
              if (dec.viewed !== undefined) viewed = Boolean(dec.viewed);
              if (dec.viewedAt !== undefined) viewedAt = dec.viewedAt;
              if (dec.burned !== undefined) burned = Boolean(dec.burned);
              if (dec.burnedAt !== undefined) burnedAt = dec.burnedAt;
            } else {
              decryptedText = data.text || '[Encrypted message]';
            }
          }

          if (decryptedFile) {
            if (viewed || data['file.viewed'] || data.viewed) decryptedFile.viewed = true;
            if (burned || data['file.burned'] || data.burned) decryptedFile.burned = true;
          }

          // If message was ephemeral and already expired, automatically eradicate it from database
          if (expiresAt && Date.now() >= expiresAt) {
            deleteDoc(doc(db, 'rooms', activeRoomId, 'messages', docId)).catch(() => {});
            processedMessagesCacheRef.current.delete(docId);
            return null;
          }

          const msg: ChatMessage = {
            id: docId,
            text: decryptedText,
            sender: data.senderId === myUserId ? 'me' : 'peer',
            senderId: data.senderId,
            file: decryptedFile,
            replyTo: decryptedReplyTo,
            reactions: decryptedReactions,
            status: 'sent',
            isDeleted: data.isDeleted || false,
            deletedForEveryone: data.deletedForEveryone || false,
            deletedAt: data.deletedAt,
            isEdited,
            editedAt,
            viewed,
            viewedAt,
            burned,
            burnedAt,
            isEphemeral,
            ephemeralDuration,
            expiresAt,
            poll: decryptedPoll,
            createdAt:
              data.createdAt ||
              (data.ts ? new Date(data.ts).toISOString() : new Date().toISOString()),
            time:
              data.time ||
              (data.createdAt
                ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''),
          };

          processedMessagesCacheRef.current.set(docId, { hash: fingerprint, msg });
          return msg;
        });

        // Prune removed messages from cache
        for (const cachedId of processedMessagesCacheRef.current.keys()) {
          if (!currentDocIds.has(cachedId)) {
            processedMessagesCacheRef.current.delete(cachedId);
          }
        }

        const resolved = await Promise.all(messagePromises);
        const loaded: ChatMessage[] = resolved.filter((m): m is ChatMessage => m !== null);

        // Deterministic sorting ensures all historical & new messages are strictly chronological
        loaded.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

        // Sound and browser notification handling for incoming messages
        if (!initialMessagesLoadedRef.current) {
          initialMessagesLoadedRef.current = true;
          for (const m of loaded) {
            seenMessageIdsRef.current.add(m.id);
          }
        } else {
          const newPeerMessages = loaded.filter(
            (m) => m.sender === 'peer' && !m.isDeleted && !seenMessageIdsRef.current.has(m.id)
          );

          for (const m of loaded) {
            seenMessageIdsRef.current.add(m.id);
          }

          if (newPeerMessages.length > 0) {
            if (soundEnabled) {
              playIncomingMessageSound();
            }
            if (desktopEnabled) {
              const latestMsg = newPeerMessages[newPeerMessages.length - 1];
              const preview = latestMsg.file
                ? `📎 ${latestMsg.file.fileName}`
                : latestMsg.text
                ? latestMsg.text.slice(0, 100)
                : 'Encrypted message received';
              sendBrowserNotification(
                {
                  title: 'Private Chat Notification',
                  body: preview,
                },
                true
              );
            }
            triggerTitleAlert(newPeerMessages.length);
          }
        }

        setMessages((prev) => {
          // Keep sending/optimistic messages that are still uploading or sending
          const pendingSending = prev.filter((m) => m.status === 'sending');
          const combined = [...loaded];

          // Preserve pending optimistic bubbles until real snapshot arrives
          for (const pending of pendingSending) {
            const alreadyLoaded = combined.some(
              (m) =>
                m.id === pending.id ||
                (m.file && pending.file && m.file.fileId === pending.file.fileId) ||
                (m.sender === 'me' &&
                  m.text === pending.text &&
                  Math.abs(new Date(m.createdAt || 0).getTime() - new Date(pending.createdAt || 0).getTime()) < 15000)
            );
            if (!alreadyLoaded) {
              combined.push(pending);
            }
          }

          return combined;
        });
      },
      (err) => {
        console.warn('Messages listener error:', err);
      }
    );

    // 3. Video & Voice Call Signaling Listener
    const callDocRef = doc(db, 'rooms', activeRoomId, 'calls', 'current');
    const unsubscribeCall = onSnapshot(
      callDocRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as CallDataFirestore;
        const callAge = data.createdAt ? Date.now() - new Date(data.createdAt).getTime() : 0;
        // Only prompt if freshly calling (< 45 seconds) and initiated by peer
        if (data.status === 'calling' && data.callerId !== myUserId && callAge < 45000) {
          setCallType(data.callType || 'video');
          setIncomingCallData(data);
          setIsVideoCaller(false);
          setVideoCallModalOpen(true);
        }
      },
      (err) => {
        console.warn('Call signaling listener warning:', err);
      }
    );

    // 4. Heartbeat updater: keep presence and read receipt active in database
    const heartbeatInterval = setInterval(() => {
      const isVisible = typeof document !== 'undefined' && !document.hidden;
      const now = Date.now();
      const updates: Record<string, any> = {
        [`participants.${myUserId}.lastSeen`]: now,
        lastActiveAt: new Date().toISOString(),
      };
      if (isVisible) {
        updates[`participants.${myUserId}.lastReadTimestamp`] = now;
      }
      updateDoc(roomRef, updates).catch(() => {});
    }, 8000);

    // 5. Window beforeunload cleanup
    const handleUnload = () => {
      updateDoc(roomRef, {
        [`participants.${myUserId}`]: deleteField(),
        lastActiveAt: new Date().toISOString(),
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
      unsubscribeCall();
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleUnload);
      unsubSocketMsg();
      unsubSocketTyping();
      unsubSocketRead();
      unsubSocketReaction();
      realTimeSocket.disconnect();
    };
  }, [activeRoomId, myUserId]);

  const generateRandomRoom = () => {
    const prefixes = ['ROOM', 'CHAT', 'SEC', 'NODE', 'HUB'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${num}`;
    setRoomId(code);
    if (authError) setAuthError('');
  };

  // Check for QR invite URL parameters on startup
  useEffect(() => {
    try {
      const payload = parseQrJoinPayload(window.location.href);
      if (payload && payload.roomId) {
        const cleanRoom = payload.roomId.trim().toUpperCase();
        setRoomId(cleanRoom);
        if (payload.password) {
          const cleanPass = payload.password.trim();
          setPassword(cleanPass);
          setSecurityToastMessage(`QR Invite: Auto-connecting to room ${cleanRoom}...`);
          handleRoomSubmit(undefined, cleanRoom, cleanPass);
        } else {
          setSecurityToastMessage(`QR Invite: Room ${cleanRoom} loaded. Please enter password.`);
        }

        // Clean up URL bar to keep shared passwords private
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.warn('Error reading QR invite URL:', err);
    }
  }, []);

  // Handle successful QR scan from QrScannerModal
  const handleQrScanSuccess = (payload: { roomId: string; password?: string }) => {
    const cleanRoom = payload.roomId ? payload.roomId.trim().toUpperCase() : '';
    if (!cleanRoom) {
      setSecurityToastMessage('App URL verified. Enter or generate a room code to join.');
      return;
    }
    setRoomId(cleanRoom);
    if (payload.password) {
      const cleanPass = payload.password.trim();
      activePasswordRef.current = cleanPass;
      setPassword(cleanPass);
      setSecurityToastMessage(`QR Verified: Connecting to room ${cleanRoom}...`);
      handleRoomSubmit(undefined, cleanRoom, cleanPass);
    } else {
      setSecurityToastMessage(`QR Verified: Room ${cleanRoom} loaded. Enter password to connect.`);
    }
  };

  const handleRoomSubmit = async (
    e?: FormEvent,
    overrideRoomId?: string,
    overridePassword?: string
  ) => {
    if (e) e.preventDefault();
    const targetRoom = overrideRoomId !== undefined ? overrideRoomId : roomId;
    const targetPassword = overridePassword !== undefined ? overridePassword : password;

    const cleanRoom = targetRoom.trim().toUpperCase();
    const cleanPassword = targetPassword.trim();

    activePasswordRef.current = cleanPassword;

    if (overrideRoomId !== undefined) {
      setRoomId(cleanRoom);
    }
    if (overridePassword !== undefined) {
      setPassword(cleanPassword);
    }

    if (!cleanRoom) {
      setAuthError('Please enter a room code.');
      return;
    }

    // Room ID validation: 3 to 32 alphanumeric, dash or underscore
    if (!/^[A-Z0-9_-]{3,32}$/.test(cleanRoom)) {
      setAuthError('Room code must be 3-32 letters, numbers, hyphens, or underscores.');
      return;
    }

    if (!cleanPassword) {
      setAuthError('Please enter the room password.');
      return;
    }

    // Check anti-brute force lockout
    const lockStatus = getBruteForceLockout(cleanRoom);
    if (lockStatus.isLocked) {
      setAuthError(`Security Lockout Active: Too many failed password attempts. Access will unlock in ${lockStatus.remainingSeconds}s.`);
      return;
    }

    setAuthError('');
    setIsSubmitting(true);

    // Call server-side authentication first to enforce server rate-limiting and retrieve session token (Fix Bug 1, 2, 14)
    try {
      const authRes = await fetch('/api/rooms/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: cleanRoom, password: cleanPassword, userId: myUserId }),
      });
      if (authRes.status === 429) {
        const errJson = await authRes.json().catch(() => ({}));
        setAuthError(errJson.error || 'Security Lockout Active: Too many failed password attempts.');
        setIsSubmitting(false);
        return;
      }
      if (authRes.status === 401) {
        const failure = recordFailedAttempt(cleanRoom);
        setLockoutTimer({ isLocked: failure.isLocked, remainingSeconds: failure.remainingSeconds });
        setAuthError(`Incorrect password for room "${cleanRoom}". Please verify credentials.`);
        setIsSubmitting(false);
        return;
      }
      if (!authRes.ok) {
        const errJson = await authRes.json().catch(() => ({}));
        setAuthError(errJson.error || 'Authentication failed. Please verify credentials or try another code.');
        setIsSubmitting(false);
        return;
      }

      const authData = await authRes.json();
      if (authData.sessionToken) {
        realTimeSocket.setSessionToken(authData.sessionToken);
      }

      // Successful authentication & slot allocation via secure backend
      resetFailedAttempts(cleanRoom);
      activePasswordRef.current = cleanPassword;
      setActiveRoomId(cleanRoom);
      setConnectionState('waiting');
      setIsSubmitting(false);

      // Pre-warm enclave key in background so initial message encryption/decryption is instant
      prewarmEnclaveKey(cleanPassword, cleanRoom).catch(() => {});

      // Connect WebSocket to real-time relay
      realTimeSocket.connect(cleanRoom, cleanPassword, myUserId);
    } catch (err: any) {
      console.error('Error authenticating room:', err);
      setAuthError(err.message || 'Failed to connect to room server. Please check your network.');
      setIsSubmitting(false);
    }
  };

  // Zero-Knowledge Room Self-Destruct & Eradication
  const handleBurnRoom = async () => {
    if (!activeRoomId) return;
    try {
      const sessionToken = realTimeSocket.getSessionToken();
      const result = await burnRoomAndDestroyAllData(db, activeRoomId, sessionToken || undefined);
      purgeEnclaveKey();
      setMessages([]);
      setActiveRoomId('');
      setConnectionState('unauthenticated');
      setSessionLocked(false);
      showToast(`Room burned successfully. ${result.deletedCount} database records permanently purged.`, 'success');
    } catch (err) {
      console.error('Failed to burn room:', err);
      showToast('Could not completely burn room. Please check your network connection.', 'error');
    }
  };

  // Privacy Session Unlock Handler
  const handleUnlockSession = async (enteredPassword?: string): Promise<boolean> => {
    const currentPass = activePasswordRef.current || password.trim();
    if (enteredPassword) {
      if (enteredPassword.trim() === currentPass) {
        setSessionLocked(false);
        lastActivityTimeRef.current = Date.now();
        setSecurityToastMessage('Session unlocked successfully.');
        return true;
      }
      return false;
    }
    if (currentPass) {
      setSessionLocked(false);
      lastActivityTimeRef.current = Date.now();
      setSecurityToastMessage('Session unlocked.');
      return true;
    }
    return false;
  };

  const handleEmergencyBurn = async () => {
    await handleBurnRoom();
    setSessionLocked(false);
  };

  // Automated Inactivity Auto-Lock (5 minutes of inactivity)
  useEffect(() => {
    if (!activeRoomId || sessionLocked) return;

    const resetActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const interval = setInterval(() => {
      // 5 minutes of no keyboard/mouse/touch activity
      if (Date.now() - lastActivityTimeRef.current > 5 * 60 * 1000) {
        setSessionLockReason('Auto-locked after 5 minutes of inactivity');
        setSessionLocked(true);
      }
    }, 15000);

    window.addEventListener('mousemove', resetActivity, { passive: true });
    window.addEventListener('keydown', resetActivity, { passive: true });
    window.addEventListener('touchstart', resetActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
    };
  }, [activeRoomId, sessionLocked]);

  // Notify peer that current user is typing (throttled)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (connectionState !== 'connected' || !activeRoomId) return;

    // Fast socket typing indicator (<2ms)
    realTimeSocket.sendTyping(true);

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1800) {
      lastTypingSentRef.current = now;
      updateDoc(doc(db, 'rooms', activeRoomId), {
        [`participants.${myUserId}.typing`]: true,
        [`participants.${myUserId}.typingTimestamp`]: now,
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      realTimeSocket.sendTyping(false);
      if (activeRoomId) {
        updateDoc(doc(db, 'rooms', activeRoomId), {
          [`participants.${myUserId}.typing`]: false,
        }).catch(() => {});
      }
    }, 2600);
  };

  // Handle toggling and changing disappearing/ephemeral messages setting
  const handleChangeEphemeralSetting = (enabled: boolean, option: EphemeralTimerOption) => {
    setEphemeralEnabled(enabled);
    setEphemeralDurationOption(option);
    const durationMs = enabled ? getDurationMs(option) : 0;

    if (activeRoomId) {
      updateDoc(doc(db, 'rooms', activeRoomId), {
        ephemeralSettings: {
          enabled,
          durationOption: option,
          durationMs,
          updatedBy: myUserId,
          updatedAt: new Date().toISOString(),
        },
      }).catch((err) => {
        console.warn('Failed to update room ephemeral settings:', err);
      });
    }

    if (enabled) {
      setSecurityToastMessage(`Disappearing messages turned ON (${option})`);
    } else {
      setSecurityToastMessage('Disappearing messages turned OFF');
    }
  };

  // Eradicate expired message permanently from Firestore and local cache
  const handleExpireMessage = useCallback((messageId: string) => {
    if (activeRoomId) {
      deleteDoc(doc(db, 'rooms', activeRoomId, 'messages', messageId)).catch(() => {});
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, [activeRoomId]);

  // Continuous background checker to delete any expired messages
  useEffect(() => {
    if (!activeRoomId || messages.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const expiredMsgs = messages.filter((m) => m.expiresAt && now >= m.expiresAt);
      if (expiredMsgs.length > 0) {
        for (const exp of expiredMsgs) {
          deleteDoc(doc(db, 'rooms', activeRoomId, 'messages', exp.id)).catch(() => {});
        }
        setMessages((prev) => prev.filter((m) => !m.expiresAt || now < m.expiresAt));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRoomId, messages]);

  // Send regular text message (with optional reply reference or direct text)
  const handleSendMessage = async (e?: FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const rawContent = (customText !== undefined ? customText : inputText).trim();
    if (!rawContent || connectionState !== 'connected' || !activeRoomId) return;

    // Token-bucket rate limiting against automated spam scripts
    if (!floodLimiter.checkAndConsume()) {
      return;
    }

    const content = sanitizeChatMessage(rawContent);
    if (!content) return;

    // Reset typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateDoc(doc(db, 'rooms', activeRoomId), {
      [`participants.${myUserId}.typing`]: false,
    }).catch(() => {});

    const draftedText = inputText;
    const sentReplyTo = replyingTo;
    if (customText === undefined) {
      setInputText('');
    }
    setReplyingTo(null);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const roomPwd = activePasswordRef.current || password.trim();

    // Calculate auto-disappear duration & expiration if enabled
    const durationMs = ephemeralEnabled ? getDurationMs(ephemeralDurationOption) : 0;
    const expiresAt = ephemeralEnabled && durationMs > 0 ? Date.now() + durationMs : null;

    // Instantaneous 0ms optimistic visual update for sender
    const optimisticId = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticCreatedAt = new Date().toISOString();
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      text: content,
      sender: 'me',
      senderId: myUserId,
      time: currentTime,
      createdAt: optimisticCreatedAt,
      replyTo: sentReplyTo || undefined,
      isEphemeral: ephemeralEnabled,
      ephemeralDuration: durationMs,
      expiresAt: expiresAt || undefined,
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (soundEnabled) {
      playSentMessageSound();
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // 1. Transparently seal message in AES-GCM-256 cryptographic enclave
      const envelope = await encryptWithEnclave(
        {
          text: content,
          replyTo: sentReplyTo || undefined,
          isEphemeral: ephemeralEnabled,
          ephemeralDuration: durationMs,
          expiresAt: expiresAt || undefined,
        },
        roomPwd,
        activeRoomId
      );

      // 2. Only opaque ciphertext, IV, and anti-replay nonce touch the database
      const payload = sanitizeForFirestore({
        roomId: activeRoomId,
        senderId: myUserId,
        time: currentTime,
        createdAt: optimisticCreatedAt,
        enc: true,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
        isEphemeral: ephemeralEnabled,
        ephemeralDuration: durationMs,
        expiresAt: expiresAt,
      });

      // Broadcast encrypted envelope over ultra-low latency WebSocket tunnel (<10ms)
      realTimeSocket.sendEncryptedMessage({
        messageId: optimisticId,
        senderId: myUserId,
        roomId: activeRoomId,
        time: currentTime,
        createdAt: optimisticCreatedAt,
        enc: true,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
        isEphemeral: ephemeralEnabled,
        ephemeralDuration: durationMs,
        expiresAt: expiresAt,
        encryptedData: envelope,
      });

      await addDoc(collection(db, 'rooms', activeRoomId, 'messages'), payload);

      // Mark message as confirmed sent
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: 'sent' } : m))
      );
    } catch (err: any) {
      console.error('Failed to send message to Firestore:', err);
      // Revert optimistic bubble and restore drafted message so user does not lose input
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(draftedText);
      setReplyingTo(sentReplyTo);
      setSecurityToastMessage(
        err?.message?.includes('permission')
          ? 'Failed to send: Database permission denied. Please verify room access.'
          : 'Failed to send message. Please check your connection.'
      );
    }
  };

  // 15-minute Message Editing handlers
  const handleStartEditMessage = (msg: ChatMessage) => {
    const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
    if (Date.now() - msgTime > 15 * 60 * 1000) {
      setSecurityToastMessage('Message editing window expired (15-minute limit)');
      return;
    }
    draftBeforeEditRef.current = inputText;
    setEditingMessage(msg);
    setInputText(msg.text || '');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
    setInputText(draftBeforeEditRef.current);
    draftBeforeEditRef.current = '';
  };

  const handleSaveEditedMessage = async () => {
    if (!editingMessage || !activeRoomId) return;
    const newRawText = inputText.trim();
    if (!newRawText) return;

    const msgTime = editingMessage.createdAt ? new Date(editingMessage.createdAt).getTime() : 0;
    if (Date.now() - msgTime > 15 * 60 * 1000) {
      setSecurityToastMessage('Cannot save edit: 15-minute window has expired');
      setEditingMessage(null);
      setInputText(draftBeforeEditRef.current);
      draftBeforeEditRef.current = '';
      return;
    }

    const content = sanitizeChatMessage(newRawText);
    if (!content) return;

    const roomPwd = activePasswordRef.current || password.trim();
    const now = Date.now();

    try {
      // Re-encrypt updated payload with AES-256-GCM enclave
      const envelope = await encryptWithEnclave(
        {
          text: content,
          replyTo: editingMessage.replyTo,
          file: editingMessage.file,
          isEphemeral: editingMessage.isEphemeral,
          ephemeralDuration: editingMessage.ephemeralDuration,
          expiresAt: editingMessage.expiresAt,
          isEdited: true,
          editedAt: now,
        },
        roomPwd,
        activeRoomId
      );

      // Keep zero-knowledge security: plain text is NOT stored on Firestore doc
      await updateDoc(doc(db, 'rooms', activeRoomId, 'messages', editingMessage.id), {
        isEdited: true,
        editedAt: now,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
      });

      // Synchronize with server-authorized mutation endpoint (Fix Bug 8)
      const sessionToken = realTimeSocket.getSessionToken();
      if (sessionToken) {
        fetch('/api/rooms/edit-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            messageId: editingMessage.id,
            ct: envelope.ct,
            iv: envelope.iv,
          }),
        }).catch(() => {});
      }

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id
            ? { ...m, text: content, isEdited: true, editedAt: now }
            : m
        )
      );

      setEditingMessage(null);
      setInputText(draftBeforeEditRef.current);
      draftBeforeEditRef.current = '';
      setSecurityToastMessage('Message updated');
    } catch (err) {
      console.error('Failed to save edited message:', err);
      setSecurityToastMessage('Failed to update message');
    }
  };

  // View-Once Burn Handler (invoked when media is opened/closed or burn countdown expires)
  const handleBurnMedia = async (messageId: string, fileId: string) => {
    if (!activeRoomId || !messageId) return;
    const now = Date.now();

    // Call server-authorized burn endpoint (Fix Bug 9)
    const sessionToken = realTimeSocket.getSessionToken();
    if (sessionToken) {
      fetch('/api/rooms/burn-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ messageId }),
      }).catch(() => {});
    }

    try {
      await updateDoc(doc(db, 'rooms', activeRoomId, 'messages', messageId), {
        viewed: true,
        viewedAt: now,
        burned: true,
        burnedAt: now,
        'file.viewed': true,
        'file.viewedAt': now,
        'file.burned': true,
        'file.burnedAt': now,
      });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              viewed: true,
              viewedAt: now,
              burned: true,
              burnedAt: now,
              file: m.file
                ? {
                    ...m.file,
                    viewed: true,
                    viewedAt: now,
                    burned: true,
                    burnedAt: now,
                  }
                : undefined,
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.warn('Failed to update burn status in Firestore:', err);
    }
  };

  // Dispatch message, edit, or staged attachment
  const handleSendMessageOrFile = () => {
    if (editingMessage) {
      handleSaveEditedMessage();
      return;
    }
    if (stagedFile) {
      const caption = inputText.trim();
      const fileToUpload = stagedFile;
      clearStagedFile();
      processAndUploadFile(fileToUpload, caption);
      return;
    }
    handleSendMessage();
  };

  // --- Interactive Polls Handlers ---
  const handleCreatePoll = async ({
    question,
    options,
    allowMultiple,
  }: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  }) => {
    if (!activeRoomId) return;

    const pollData: PollData = {
      id: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: question.trim(),
      options: options.map((opt, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        text: opt.trim(),
        voterIds: [],
      })),
      allowMultiple,
      isClosed: false,
      creatorId: myUserId,
    };

    const optimisticId = `poll_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticCreatedAt = new Date().toISOString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const roomPwd = activePasswordRef.current || password.trim();

    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      text: `📊 Poll: ${question.trim()}`,
      sender: 'me',
      senderId: myUserId,
      time: currentTime,
      createdAt: optimisticCreatedAt,
      poll: pollData,
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (soundEnabled) playSentMessageSound();

    try {
      const envelope = await encryptWithEnclave(
        {
          text: `📊 Poll: ${question.trim()}`,
          poll: pollData,
        },
        roomPwd,
        activeRoomId
      );

      const payload = sanitizeForFirestore({
        roomId: activeRoomId,
        senderId: myUserId,
        time: currentTime,
        createdAt: optimisticCreatedAt,
        poll: pollData,
        enc: true,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
      });

      realTimeSocket.sendEncryptedMessage({
        messageId: optimisticId,
        senderId: myUserId,
        roomId: activeRoomId,
        time: currentTime,
        createdAt: optimisticCreatedAt,
        poll: pollData,
        enc: true,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
        encryptedData: envelope,
      });

      await addDoc(collection(db, 'rooms', activeRoomId, 'messages'), payload);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, status: 'sent' } : m))
      );
      setSecurityToastMessage('Poll created and encrypted!');
    } catch (err) {
      console.error('Failed to broadcast poll:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setSecurityToastMessage('Failed to broadcast poll. Check connection.');
    }
  };

  const handleVoteOption = async (messageId: string, optionId: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.poll || targetMsg.poll.isClosed) return;

    const currentPoll = targetMsg.poll;
    let updatedOptions = [...currentPoll.options];

    if (currentPoll.allowMultiple) {
      updatedOptions = updatedOptions.map((opt) => {
        if (opt.id === optionId) {
          const hasVoted = opt.voterIds.includes(myUserId);
          return {
            ...opt,
            voterIds: hasVoted
              ? opt.voterIds.filter((id) => id !== myUserId)
              : [...opt.voterIds, myUserId],
          };
        }
        return opt;
      });
    } else {
      const alreadyVotedThis = updatedOptions.find((o) => o.id === optionId)?.voterIds.includes(myUserId);
      updatedOptions = updatedOptions.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            voterIds: alreadyVotedThis
              ? opt.voterIds.filter((id) => id !== myUserId)
              : [...opt.voterIds, myUserId],
          };
        } else {
          return {
            ...opt,
            voterIds: opt.voterIds.filter((id) => id !== myUserId),
          };
        }
      });
    }

    const updatedPoll: PollData = {
      ...currentPoll,
      options: updatedOptions,
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, poll: updatedPoll } : m))
    );

    const roomPwd = activePasswordRef.current || password.trim();
    try {
      const envelope = await encryptWithEnclave(
        {
          text: targetMsg.text,
          poll: updatedPoll,
        },
        roomPwd,
        activeRoomId
      );

      await updateDoc(doc(db, 'rooms', activeRoomId, 'messages', messageId), {
        poll: updatedPoll,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
      });
    } catch (err) {
      console.warn('Failed to update vote in Firestore:', err);
    }
  };

  const handleToggleClosePoll = async (messageId: string) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.poll) return;

    const updatedPoll: PollData = {
      ...targetMsg.poll,
      isClosed: !targetMsg.poll.isClosed,
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, poll: updatedPoll } : m))
    );

    const roomPwd = activePasswordRef.current || password.trim();
    try {
      const envelope = await encryptWithEnclave(
        {
          text: targetMsg.text,
          poll: updatedPoll,
        },
        roomPwd,
        activeRoomId
      );

      await updateDoc(doc(db, 'rooms', activeRoomId, 'messages', messageId), {
        poll: updatedPoll,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
      });

      setSecurityToastMessage(
        updatedPoll.isClosed ? 'Poll closed to new votes.' : 'Poll re-opened for voting.'
      );
    } catch (err) {
      console.warn('Failed to toggle poll status:', err);
    }
  };

  // --- Quick Draw Sketch Handler ---
  const handleSendDoodle = (file: File) => {
    processAndUploadFile(file, '🎨 Quick Sketch');
    setSecurityToastMessage('Sketch sent to encrypted chat stream!');
  };

  // --- Scheduled Messages Handlers & Dispatch Engine ---
  const handleScheduleMessage = (delayMs: number) => {
    if (!inputText.trim()) return;
    const newScheduled: ScheduledMessage = {
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: inputText.trim(),
      scheduledAt: Date.now() + delayMs,
      replyTo: replyingTo || undefined,
      isEphemeral: ephemeralEnabled,
      ephemeralDuration: ephemeralEnabled ? getDurationMs(ephemeralDurationOption) : undefined,
    };
    setScheduledMessages((prev) => [...prev, newScheduled]);
    setInputText('');
    setReplyingTo(null);
    const mins = Math.max(1, Math.round(delayMs / 60000));
    setSecurityToastMessage(
      `Message scheduled to dispatch in ${mins} minute${mins === 1 ? '' : 's'}.`
    );
  };

  const handleSendScheduledImmediately = (id: string) => {
    const target = scheduledMessages.find((m) => m.id === id);
    if (!target) return;
    setScheduledMessages((prev) => prev.filter((m) => m.id !== id));
    handleSendMessage(target.text);
    setSecurityToastMessage('Scheduled message dispatched immediately.');
  };

  const handleCancelScheduled = (id: string) => {
    const target = scheduledMessages.find((m) => m.id === id);
    if (!target) return;
    setScheduledMessages((prev) => prev.filter((m) => m.id !== id));
    setInputText(target.text);
    setSecurityToastMessage('Scheduled message cancelled and returned to input box.');
  };

  // Scheduled message countdown timer check
  useEffect(() => {
    if (scheduledMessages.length === 0 || !activeRoomId || connectionState !== 'connected') return;

    const timer = setInterval(() => {
      const now = Date.now();
      const readyToSend = scheduledMessages.filter((m) => m.scheduledAt <= now);
      if (readyToSend.length > 0) {
        readyToSend.forEach((item) => {
          handleSendMessage(item.text);
        });
        setScheduledMessages((prev) => prev.filter((m) => m.scheduledAt > now));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledMessages, activeRoomId, connectionState]);

  // Send a shared web link with optional description into encrypted chat stream
  const handleSendSharedLink = async (url: string, note?: string) => {
    if (connectionState !== 'connected' || !activeRoomId) return;

    const messageText = note ? `${note}\n${url}` : url;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const roomPwd = activePasswordRef.current || password.trim();

    try {
      const envelope = await encryptWithEnclave(
        {
          text: messageText,
        },
        roomPwd,
        activeRoomId
      );

      const payload = sanitizeForFirestore({
        roomId: activeRoomId,
        senderId: myUserId,
        time: currentTime,
        createdAt: new Date().toISOString(),
        enc: true,
        v: envelope.v,
        iv: envelope.iv,
        ct: envelope.ct,
        nonce: envelope.nonce,
        ts: envelope.ts,
      });

      await addDoc(collection(db, 'rooms', activeRoomId, 'messages'), payload);
    } catch (err) {
      console.error('Failed to send shared link:', err);
    }
  };

  // Compute total vault items (files + extracted links)
  const vaultItemCount = useMemo(() => {
    let count = 0;
    for (const m of messages) {
      if (m.file) count++;
      if (m.text) {
        const links = extractUrlsFromText(m.text);
        count += links.length;
      }
    }
    return count;
  }, [messages]);

  // Upload and share ANY file format (photos, video, text, doc, code, zip, tar, pdf, ppt, etc.)
  const processAndUploadFile = async (file: File, customCaption?: string) => {
    if (connectionState !== 'connected' || !activeRoomId) {
      showToast('You must be connected to another participant in a room to share files.', 'warning');
      return;
    }

    // Security validation against executable malware formats and traversal
    const fileSecurity = validateAndSanitizeFileName(file.name);
    if (fileSecurity.isBlocked) {
      showToast(
        fileSecurity.reason || 'Executable scripts or binaries are restricted for room protection.',
        'error'
      );
      return;
    }

    const tempId = 'temp_' + Math.random().toString(36).substring(2, 9);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentReply = replyingTo;
    setReplyingTo(null);
    const textToSend = (customCaption !== undefined ? customCaption : inputText).trim();

    // Initial placeholder optimistic attachment
    const placeholderAttachment: FileAttachment = {
      fileId: 'file_' + Math.random().toString(36).substring(2, 9),
      fileName: fileSecurity.safeName,
      fileSize: file.size,
      compressedSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      isCompressed: false,
      chunkCount: 1,
    };

    // Add optimistic sending bubble to chat feed immediately!
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: textToSend,
        sender: 'me',
        senderId: myUserId,
        time: currentTime,
        file: placeholderAttachment,
        replyTo: currentReply || undefined,
        status: 'sending',
        uploadProgress: 10,
      },
    ]);

    setCompressModal({
      fileName: file.name,
      fileSize: file.size,
      step: 'Compressing package...',
      percent: 15,
    });

    try {
      // 1. Process & compress with native gzip / image downscale
      const { attachment, chunks } = await prepareFileForSharing(file, (step, progress) => {
        setCompressModal((prev) => (prev ? { ...prev, step, percent: progress } : null));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, uploadProgress: Math.min(progress, 60) } : m
          )
        );
      });

      // Update optimistic bubble with actual metadata
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, file: attachment, uploadProgress: 60 } : m))
      );

      // 2. If multi-chunk large file, write chunks to Firestore subcollection
      if (chunks.length > 1) {
        setCompressModal((prev) =>
          prev ? { ...prev, step: 'Uploading chunks to database...', percent: 65 } : null
        );

        for (let i = 0; i < chunks.length; i++) {
          const chunkPercent = 65 + Math.round(((i + 1) / chunks.length) * 28);
          setCompressModal((prev) =>
            prev
              ? {
                  ...prev,
                  step: `Uploading chunk ${i + 1} of ${chunks.length}...`,
                  percent: chunkPercent,
                }
              : null
          );

          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, uploadProgress: chunkPercent } : m))
          );

          const roomPwd = activePasswordRef.current || password.trim();
          const chunkEnvelope = await encryptWithEnclave(
            {
              chunkIndex: i,
              data: chunks[i],
            },
            roomPwd,
            activeRoomId
          );

          await setDoc(
            doc(db, 'rooms', activeRoomId, 'files', attachment.fileId, 'chunks', String(i)),
            sanitizeForFirestore({
              chunkIndex: i,
              enc: true,
              v: chunkEnvelope.v,
              iv: chunkEnvelope.iv,
              ct: chunkEnvelope.ct,
              nonce: chunkEnvelope.nonce,
              ts: chunkEnvelope.ts,
            })
          );
        }
      }

      setCompressModal((prev) =>
        prev ? { ...prev, step: 'Broadcasting to chat...', percent: 96 } : null
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, uploadProgress: 96 } : m))
      );

      // 3. Post canonical message with file attachment metadata sealed in cryptographic enclave
      const roomPwd = activePasswordRef.current || password.trim();
      const durationMs = ephemeralEnabled ? getDurationMs(ephemeralDurationOption) : 0;
      const expiresAt = ephemeralEnabled && durationMs > 0 ? Date.now() + durationMs : null;

      if (isViewOnce) {
        attachment.viewOnce = true;
      }

      const fileEnvelope = await encryptWithEnclave(
        {
          text: textToSend,
          file: attachment,
          replyTo: currentReply || undefined,
          isEphemeral: ephemeralEnabled,
          ephemeralDuration: durationMs,
          expiresAt: expiresAt || undefined,
        },
        roomPwd,
        activeRoomId
      );

      const messageDocPayload = sanitizeForFirestore({
        roomId: activeRoomId,
        senderId: myUserId,
        time: currentTime,
        createdAt: new Date().toISOString(),
        enc: true,
        v: fileEnvelope.v,
        iv: fileEnvelope.iv,
        ct: fileEnvelope.ct,
        nonce: fileEnvelope.nonce,
        ts: fileEnvelope.ts,
        isEphemeral: ephemeralEnabled,
        ephemeralDuration: durationMs,
        expiresAt: expiresAt,
      });

      await addDoc(collection(db, 'rooms', activeRoomId, 'messages'), messageDocPayload);
      setIsViewOnce(false);
      if (soundEnabled) {
        playSentMessageSound();
      }

      // Remove temporary optimistic bubble now that real message is written
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: any) {
      console.error('File sharing error:', err);
      showToast('Failed to compress or upload file: ' + (err?.message || 'Network error'), 'error');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setCompressModal(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const stageFileForUpload = (file: File) => {
    if (editingMessage) {
      handleCancelEditMessage();
    }
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setStagedPreviewUrl(url);
    } else {
      setStagedPreviewUrl(null);
    }
  };

  // Image Editor Handlers (Crop, Annotate, Redact, Blur sensitive data)
  const handleOpenImageEditor = () => {
    if (!stagedFile || !stagedFile.type.startsWith('image/')) return;
    setImageToEdit(stagedFile);
    setImageEditorPreviewUrl(stagedPreviewUrl || URL.createObjectURL(stagedFile));
    setImageEditorOpen(true);
  };

  const handleSaveEditedImage = (editedFile: File) => {
    setImageEditorOpen(false);
    setImageToEdit(null);
    if (imageEditorPreviewUrl && imageEditorPreviewUrl !== stagedPreviewUrl && imageEditorPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageEditorPreviewUrl);
    }
    setImageEditorPreviewUrl(null);
    if (stagedPreviewUrl && stagedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    stageFileForUpload(editedFile);
    setSecurityToastMessage('Edited & redacted image applied');
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stageFileForUpload(file);
    }
  };

  // Drag & Drop event handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (connectionState === 'connected') {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (connectionState === 'connected' && e.dataTransfer.files?.[0]) {
      stageFileForUpload(e.dataTransfer.files[0]);
    }
  };

  // Multiline Textarea handlers
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

    // Detect slash command typing
    if (val.startsWith('/') && !val.includes(' ')) {
      setSlashMenuOpen(true);
      setSlashFilter(val);
    } else {
      setSlashMenuOpen(false);
    }

    if (connectionState !== 'connected' || !activeRoomId) return;

    // Fast socket typing indicator (<2ms)
    realTimeSocket.sendTyping(true);

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1800) {
      lastTypingSentRef.current = now;
      updateDoc(doc(db, 'rooms', activeRoomId), {
        [`participants.${myUserId}.typing`]: true,
        [`participants.${myUserId}.typingTimestamp`]: now,
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      realTimeSocket.sendTyping(false);
      if (activeRoomId) {
        updateDoc(doc(db, 'rooms', activeRoomId), {
          [`participants.${myUserId}.typing`]: false,
        }).catch(() => {});
      }
    }, 2600);
  };

  const handleExecuteSlashCommand = (cmd: SlashCommand) => {
    setSlashMenuOpen(false);
    if (cmd.id === 'canvas') {
      setScratchpadOpen(true);
      setInputText('');
    } else if (cmd.id === 'code') {
      handleOpenCodeSandbox();
      setInputText('');
    } else if (cmd.id === 'blur') {
      handleToggleBlurGuard();
      setInputText('');
    } else if (cmd.id === 'call') {
      handleStartVoiceCall();
      setInputText('');
    } else if (cmd.id === 'video') {
      handleStartVideoCall();
      setInputText('');
    } else if (cmd.id === 'vault') {
      setVaultOpen(true);
      setInputText('');
    } else if (cmd.id === 'theme') {
      setThemeModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'qr') {
      setRoomQrOpen(true);
      setInputText('');
    } else if (cmd.id === 'diag') {
      setDiagnosticsModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'timer') {
      setEphemeralModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'shrug') {
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + '¯\\_(ツ)_/¯ ');
      textareaRef.current?.focus();
    } else if (cmd.id === 'tableflip') {
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + '(╯°□°)╯︵ ┻━┻ ');
      textareaRef.current?.focus();
    } else if (cmd.id === 'unflip') {
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + '┬─┬ ノ( ゜-゜ノ) ');
      textareaRef.current?.focus();
    } else if (cmd.id === 'lenny') {
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + '( ͡° ͜ʖ ͡°) ');
      textareaRef.current?.focus();
    } else if (cmd.id === 'lock') {
      setSessionLockReason('Manual privacy lock invoked (/lock)');
      setSessionLocked(true);
      setInputText('');
    } else if (cmd.id === 'shield') {
      setSecurityModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'clear') {
      const allIds = new Set(messages.map((m) => m.id));
      setHiddenMessageIds(allIds);
      setSecurityToastMessage('Local chat cleared for this session.');
      setInputText('');
    } else if (cmd.id === 'burn') {
      setSecurityModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'quick') {
      setQuickRepliesModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'appearance') {
      setAppearanceModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'notes') {
      setPersonalNotesModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'sounds') {
      setNotificationModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'dictate') {
      handleToggleVoiceDictation();
      setInputText('');
    } else if (cmd.id === 'search') {
      setIsSearchOpen(true);
      setInputText('');
    } else if (cmd.id === 'poll') {
      setCreatePollModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'starred') {
      setStarredModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'cipher') {
      setCryptoCipherModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'password') {
      setPasswordGenModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'burn') {
      // Check if user passed text like /burn my secret code
      const match = inputText.match(/^\/(?:burn|secret)(?:\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        try {
          const b64 = btoa(unescape(encodeURIComponent(match[1].trim())));
          setInputText(`BURN_SECRET::15::${b64}`);
        } catch {
          setBurnOnReadModalOpen(true);
          setInputText('');
        }
      } else {
        setBurnOnReadModalOpen(true);
        setInputText('');
      }
    } else if (cmd.id === 'stego') {
      const match = inputText.match(/^\/(?:stego|hide)(?:\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        setSteganographyInspectText(match[1].trim());
      }
      setSteganographyModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'todo') {
      const match = inputText.match(/^\/(?:todo|checklist)(?:\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        const raw = match[1].trim();
        const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
        if (items.length > 0) {
          setInputText(`📋 [CHECKLIST:Team Checklist:${items.join(', ')}]`);
        } else {
          setInputText(`📋 [CHECKLIST:Tasks:${raw}]`);
        }
      } else {
        setInputText('📋 [CHECKLIST:Checklist:Review updates, Test endpoints, Confirm sync]');
      }
      textareaRef.current?.focus();
    } else if (cmd.id === 'shield') {
      setAcousticShieldModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'shred') {
      setFileShredderModalOpen(true);
      setInputText('');
    } else if (cmd.id === 'pick') {
      const match = inputText.match(/^\/(?:pick|choose)(?:\s+(.+))?$/i);
      if (match && match[1]?.trim()) {
        const raw = match[1].trim();
        const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
        if (items.length > 0) {
          setInputText(`🎲 [CHOICE:Quick Decision:${items.join(', ')}]`);
        } else {
          setInputText(`🎲 [CHOICE:Decision:${raw}]`);
        }
      } else {
        setInputText('🎲 [CHOICE:Decision Picker:Option Alpha, Option Beta, Option Gamma]');
      }
      textareaRef.current?.focus();
    } else if (cmd.id === 'timer') {
      const match = inputText.match(/^\/(?:timer|countdown)(?:\s+(\d+))?(?:\s+(.*))?$/i);
      const minutes = match && match[1] ? parseInt(match[1], 10) : 5;
      const label = match && match[2] ? match[2].trim() : `${minutes}-Min Timer`;
      const seconds = minutes * 60;
      setInputText(`⏱️ [TIMER:${seconds}:${label}]`);
      textareaRef.current?.focus();
    } else if (cmd.id === 'roll') {
      const roll = Math.floor(Math.random() * 6) + 1;
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + `🎲 Rolled a ${roll}! (1-6) `);
      textareaRef.current?.focus();
    } else if (cmd.id === 'coin') {
      const flip = Math.random() < 0.5 ? 'Heads' : 'Tails';
      setInputText((prev) => (prev.startsWith('/') ? '' : prev) + `🪙 Coin Flip: ${flip}! `);
      textareaRef.current?.focus();
    }
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If slash menu is open, let SlashCommandMenu handle arrows/enter/tab/escape
    if (slashMenuOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        return;
      }
    }

    if (e.key === 'Escape') {
      if (editingMessage) {
        e.preventDefault();
        handleCancelEditMessage();
        return;
      }
      if (replyingTo) {
        e.preventDefault();
        setReplyingTo(null);
        return;
      }
      if (stagedFile) {
        e.preventDefault();
        clearStagedFile();
        return;
      }
    }

    // Check user's preferred send shortcut (Enter vs Ctrl+Enter / Cmd+Enter)
    if (displaySettings.sendKeyPreference === 'ctrl_enter') {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSendMessageOrFile();
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessageOrFile();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          stageFileForUpload(file);
          break;
        }
      }
    }
  };

  // Voice recording engine handlers
  const handleStartVoiceRecording = async () => {
    if (connectionState !== 'connected' || !activeRoomId) return;
    try {
      await voiceRecorderRef.current.start((vol) => setVoiceVolume(vol));
      setIsRecordingVoice(true);
      voiceTranscriptRef.current = '';
      setVoiceLiveTranscript('');

      // Auto-start zero-knowledge speech transcription alongside audio recording if supported
      if (isSpeechRecognitionSupported()) {
        startSpeechRecognition({
          continuous: true,
          interimResults: true,
          onResult: (transcript, isFinal) => {
            if (isFinal) {
              voiceTranscriptRef.current = ((voiceTranscriptRef.current ? voiceTranscriptRef.current + ' ' : '') + transcript).trim();
              setVoiceLiveTranscript(voiceTranscriptRef.current);
            } else {
              const current = voiceTranscriptRef.current ? `${voiceTranscriptRef.current} ${transcript}` : transcript;
              setVoiceLiveTranscript(current);
            }
          },
          onError: () => {},
        });
      }
    } catch (err: any) {
      console.error('Voice recorder error:', err);
      showToast('Microphone access is needed to record voice messages.', 'warning');
    }
  };

  const handleCancelVoiceRecording = () => {
    voiceRecorderRef.current.cancel();
    stopSpeechRecognition();
    setIsRecordingVoice(false);
    setVoiceVolume(0);
    setVoiceLiveTranscript('');
    voiceTranscriptRef.current = '';
  };

  const handleSendVoiceRecording = async () => {
    try {
      stopSpeechRecognition();
      const result = await voiceRecorderRef.current.stop();
      setIsRecordingVoice(false);
      setVoiceVolume(0);

      const { attachment } = prepareVoiceAttachment(
        result.blob,
        result.base64,
        result.duration,
        result.waveformData
      );

      // Attach client-side generated transcript if captured
      if (voiceTranscriptRef.current.trim()) {
        attachment.transcription = voiceTranscriptRef.current.trim();
      }
      setVoiceLiveTranscript('');
      voiceTranscriptRef.current = '';

      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentReply = replyingTo;
      setReplyingTo(null);

      // Save voice message into Firestore sealed in cryptographic enclave
      const roomPwd = activePasswordRef.current || password.trim();
      const durationMs = ephemeralEnabled ? getDurationMs(ephemeralDurationOption) : 0;
      const expiresAt = ephemeralEnabled && durationMs > 0 ? Date.now() + durationMs : null;

      if (isViewOnce) {
        attachment.viewOnce = true;
      }

      const voiceEnvelope = await encryptWithEnclave(
        {
          text: '',
          file: attachment,
          replyTo: currentReply || undefined,
          isEphemeral: ephemeralEnabled,
          ephemeralDuration: durationMs,
          expiresAt: expiresAt || undefined,
        },
        roomPwd,
        activeRoomId
      );

      const messageDocPayload = sanitizeForFirestore({
        roomId: activeRoomId,
        senderId: myUserId,
        time: currentTime,
        createdAt: new Date().toISOString(),
        enc: true,
        v: voiceEnvelope.v,
        iv: voiceEnvelope.iv,
        ct: voiceEnvelope.ct,
        nonce: voiceEnvelope.nonce,
        ts: voiceEnvelope.ts,
        isEphemeral: ephemeralEnabled,
        ephemeralDuration: durationMs,
        expiresAt: expiresAt,
      });

      await addDoc(collection(db, 'rooms', activeRoomId, 'messages'), messageDocPayload);
      setIsViewOnce(false);
    } catch (err) {
      console.error('Failed to send voice message:', err);
      showToast('Could not send voice note. Please check microphone permissions.', 'error');
      setIsRecordingVoice(false);
    }
  };

  // Tag / Reply handler
  const handleReplyToMessage = useCallback((msg: ChatMessage) => {
    setReplyingTo({
      id: msg.id,
      senderName: msg.sender === 'me' ? 'You' : 'Peer',
      senderId: msg.senderId,
      text: msg.text || (msg.file?.isVoice ? '🎤 Voice message' : msg.file ? `📎 ${msg.file.fileName}` : ''),
      fileName: msg.file?.fileName,
      isVoice: !!msg.file?.isVoice,
    });
    inputRef.current?.focus();
  }, []);

  const handleJumpToMessage = useCallback((targetMsgId: string) => {
    const el = document.getElementById(`msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  }, []);

  const handleCopyMessageText = useCallback(async (msg: ChatMessage) => {
    if (msg.text) {
      await copyToClipboardSafe(msg.text);
      scheduleClipboardAutoWipe(45000);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 1800);
    }
  }, []);

  // Load deleted-for-me messages from local storage when activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) return;
    try {
      const saved = localStorage.getItem(`deleted_for_me_${activeRoomId}_${myUserId}`);
      if (saved) {
        setHiddenMessageIds(new Set(JSON.parse(saved)));
      } else {
        setHiddenMessageIds(new Set());
      }
    } catch (e) {
      setHiddenMessageIds(new Set());
    }
  }, [activeRoomId, myUserId]);

  const handleOpenDeleteDialog = useCallback((msg: ChatMessage) => {
    setMessageToDelete(msg);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteForMe = (messageId: string) => {
    setHiddenMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      try {
        localStorage.setItem(
          `deleted_for_me_${activeRoomId}_${myUserId}`,
          JSON.stringify(Array.from(next))
        );
      } catch (e) {}
      return next;
    });
    setSecurityToastMessage('Message deleted for you on this device.');
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (editingMessage?.id === messageId) {
      handleCancelEditMessage();
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, isDeleted: true, deletedForEveryone: true, text: '', file: undefined }
          : m
      )
    );

    // Call server-authorized delete endpoint (Fix Bug 6 & 7)
    const sessionToken = realTimeSocket.getSessionToken();
    if (sessionToken) {
      fetch('/api/rooms/delete-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          messageId,
          deleteForEveryone: true,
        }),
      }).catch(() => {});
    }

    try {
      const msgRef = doc(db, 'rooms', activeRoomId, 'messages', messageId);
      await updateDoc(msgRef, {
        isDeleted: true,
        deletedForEveryone: true,
        deletedAt: new Date().toISOString(),
        text: '',
        file: null,
        enc: false,
        ct: deleteField(),
        iv: deleteField(),
        v: deleteField(),
      });
      setSecurityToastMessage('Message deleted for everyone.');
    } catch (err) {
      console.warn('Error marking message deleted:', err);
      try {
        await deleteDoc(doc(db, 'rooms', activeRoomId, 'messages', messageId));
        setSecurityToastMessage('Message deleted.');
      } catch (e) {
        console.error('Failed to delete message:', e);
      }
    }
  };

  const handleShowMessageDetails = useCallback((msg: ChatMessage) => {
    setMessageForDetails(msg);
    setDetailsModalOpen(true);
  }, []);

  // Helper to format date groups for chat dividers
  const formatDateGroup = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => !hiddenMessageIds.has(m.id));
  }, [messages, hiddenMessageIds]);

  // Pinned Message Resolution
  const pinnedMessage = useMemo(() => {
    if (!pinnedMessageId) return null;
    return messages.find((m) => m.id === pinnedMessageId && !m.isDeleted) || null;
  }, [messages, pinnedMessageId]);

  const handleTogglePinMessage = useCallback((messageId: string) => {
    setPinnedMessageId((prev) => {
      const next = prev === messageId ? null : messageId;
      setSecurityToastMessage(next ? 'Message pinned to chat top.' : 'Message unpinned.');
      return next;
    });
  }, []);

  // Chat In-Room Search
  const matchedMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q && searchFilter === 'all') return [];
    return visibleMessages.filter((m) => {
      if (m.isDeleted) return false;
      const textMatch = (m.text || '').toLowerCase().includes(q);
      const isVoice = Boolean(m.file?.isVoice || m.file?.mimeType?.includes('audio'));
      const isMedia = Boolean(m.file?.mimeType?.startsWith('image/') || m.file?.mimeType?.startsWith('video/'));
      const fileMatch = m.file && !isVoice ? (m.file.fileName || '').toLowerCase().includes(q) : false;
      const mediaMatch = isMedia && (!q || (m.file?.fileName || '').toLowerCase().includes(q) || (m.text || '').toLowerCase().includes(q));
      const voiceMatch = isVoice && (!q || (m.text || '').toLowerCase().includes(q) || (m.file?.fileName || '').toLowerCase().includes(q));
      const links = m.text ? extractUrlsFromText(m.text) : [];
      const linkMatch = links.some(
        (l) => l.url.toLowerCase().includes(q) || l.domain.toLowerCase().includes(q)
      );
      const starredMatch = Boolean(m.isStarred) && (!q || textMatch || fileMatch || linkMatch);

      if (searchFilter === 'text') return q ? textMatch : true;
      if (searchFilter === 'media') return mediaMatch;
      if (searchFilter === 'files') return q ? fileMatch : Boolean(m.file && !isVoice && !isMedia);
      if (searchFilter === 'voice') return voiceMatch;
      if (searchFilter === 'links') return q ? linkMatch : links.length > 0;
      if (searchFilter === 'starred') return starredMatch;
      return textMatch || fileMatch || voiceMatch || linkMatch;
    });
  }, [visibleMessages, searchQuery, searchFilter]);

  const scrollToMessage = (messageId: string) => {
    setHighlightedMsgId(messageId);
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedMsgId((prev) => (prev === messageId ? null : prev));
    }, 2800);
  };

  const handleNextMatch = () => {
    if (matchedMessages.length === 0) return;
    const next = (currentMatchIndex + 1) % matchedMessages.length;
    setCurrentMatchIndex(next);
    scrollToMessage(matchedMessages[next].id);
  };

  const handlePrevMatch = () => {
    if (matchedMessages.length === 0) return;
    const prev = (currentMatchIndex - 1 + matchedMessages.length) % matchedMessages.length;
    setCurrentMatchIndex(prev);
    scrollToMessage(matchedMessages[prev].id);
  };

  useEffect(() => {
    setCurrentMatchIndex(0);
    if (matchedMessages.length > 0) {
      scrollToMessage(matchedMessages[0].id);
    }
  }, [searchQuery, searchFilter]);

  // Global keyboard shortcuts (Ctrl/Cmd+K, Ctrl/Cmd+F, Escape, ?)
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl instanceof HTMLElement && activeEl.isContentEditable));

      // Instant Privacy Lock screen (Ctrl/Cmd + Shift + L)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        if (activeRoomId) {
          e.preventDefault();
          setSessionLockReason('Manual privacy lock invoked (Ctrl+Shift+L)');
          setSessionLocked(true);
        }
        return;
      }

      // Search shortcut (Ctrl/Cmd + K or Ctrl/Cmd + F)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'k')) {
        if (activeRoomId) {
          e.preventDefault();
          setIsSearchOpen((prev) => !prev);
        }
        return;
      }

      // Collaborative Scratchpad shortcut (Alt + S)
      if (e.altKey && e.key.toLowerCase() === 's') {
        if (activeRoomId) {
          e.preventDefault();
          setScratchpadOpen((prev) => !prev);
        }
        return;
      }

      // Code Snippet Sandbox shortcut (Alt + C)
      if (e.altKey && e.key.toLowerCase() === 'c') {
        if (activeRoomId) {
          e.preventDefault();
          handleOpenCodeSandbox();
        }
        return;
      }

      // Screenshot & Blur Guard toggle shortcut (Alt + B)
      if (e.altKey && e.key.toLowerCase() === 'b') {
        if (activeRoomId) {
          e.preventDefault();
          handleToggleBlurGuard();
        }
        return;
      }

      // Escape shortcut to close modals, search, or cancel drafts
      if (e.key === 'Escape') {
        if (scratchpadOpen) {
          setScratchpadOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (diagnosticsModalOpen) {
          setDiagnosticsModalOpen(false);
          return;
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (replyingTo) {
          setReplyingTo(null);
          return;
        }
        if (stagedFile) {
          clearStagedFile();
          return;
        }
        if (activeRoomId && !sessionLocked) {
          setSessionLockReason('Quick privacy lock invoked (Esc)');
          setSessionLocked(true);
          return;
        }
        return;
      }

      // '?' to open shortcuts cheatsheet when not focused on an input
      if (e.key === '?' && !isInputActive) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    activeRoomId,
    sessionLocked,
    scratchpadOpen,
    shortcutsModalOpen,
    diagnosticsModalOpen,
    isSearchOpen,
    replyingTo,
    stagedFile,
    clearStagedFile,
  ]);

  // Track chat feed scrolling to show floating "Scroll to Bottom" button
  const handleFeedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distanceToBottom > 160;
    setShowScrollBottom(isUp);
    if (!isUp) {
      setUnreadScrolledCount(0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadScrolledCount(0);
    setShowScrollBottom(false);
  };

  // Toggle emoji reactions on messages
  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!activeRoomId) return;

    // Optimistic update in local state
    let hasUserReacted = false;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || {};
        const currentList = currentReactions[emoji] || [];
        const hasReacted = currentList.includes(myUserId);
        hasUserReacted = hasReacted;
        const nextList = hasReacted
          ? currentList.filter((uid) => uid !== myUserId)
          : [...currentList, myUserId];

        return {
          ...m,
          reactions: {
            ...currentReactions,
            [emoji]: nextList,
          },
        };
      })
    );

    // Ultra-low latency reaction relay over WebSocket (<2ms)
    realTimeSocket.sendReaction({
      messageId,
      emoji,
      type: hasUserReacted ? 'remove' : 'add',
    });

    try {
      const msgRef = doc(db, 'rooms', activeRoomId, 'messages', messageId);
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        const data = snap.data();
        const currentReactions: Record<string, string[]> = data.reactions || {};
        const currentList: string[] = currentReactions[emoji] || [];
        const hasReacted = currentList.includes(myUserId);
        const nextList = hasReacted
          ? currentList.filter((uid) => uid !== myUserId)
          : [...currentList, myUserId];

        await updateDoc(msgRef, {
          [`reactions.${emoji}`]: nextList,
        });
      }
    } catch (err) {
      console.warn('Error toggling reaction:', err);
    }
  }, [activeRoomId, myUserId]);

  // Insert emoji from emoji picker into input/textarea
  const handleSelectEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart ?? inputText.length;
      const end = ta.selectionEnd ?? inputText.length;
      const nextText = inputText.substring(0, start) + emoji + inputText.substring(end);
      setInputText(nextText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + emoji.length, start + emoji.length);
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
      }, 10);
    } else if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart ?? inputText.length;
      const end = input.selectionEnd ?? inputText.length;
      const nextText = inputText.substring(0, start) + emoji + inputText.substring(end);
      setInputText(nextText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setInputText((prev) => prev + emoji);
    }
  };

  // Video & Voice call controls
  const handleStartVideoCall = () => {
    if (connectionState !== 'connected') return;
    callAudioEffects.unlock();
    setCallType('video');
    setIsVideoCaller(true);
    setIncomingCallData(null);
    setVideoCallModalOpen(true);
  };

  const handleStartVoiceCall = () => {
    if (connectionState !== 'connected') return;
    callAudioEffects.unlock();
    setCallType('audio');
    setIsVideoCaller(true);
    setIncomingCallData(null);
    setVideoCallModalOpen(true);
  };

  const handleLeaveRoom = async () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    clearTitleAlert();
    initialMessagesLoadedRef.current = false;
    seenMessageIdsRef.current.clear();
    previousPeerCountRef.current = 0;

    if (activeRoomId) {
      try {
        const roomRef = doc(db, 'rooms', activeRoomId);
        await updateDoc(roomRef, {
          [`participants.${myUserId}`]: deleteField(),
          lastActiveAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error clearing participant on leave:', err);
      }
    }
    stopSpeaking();
    purgeEnclaveKey();
    activePasswordRef.current = '';
    setActiveRoomId('');
    setConnectionState('unauthenticated');
    setMessages([]);
    setAuthError('');
    setIsPeerTyping(false);
    setReplyingTo(null);
    setEditingMessage(null);
    draftBeforeEditRef.current = '';
    setInputText('');
    clearStagedFile();
    setIsViewOnce(false);
  };

  const handleCopyRoomId = async () => {
    if (!activeRoomId) return;
    await copyToClipboardSafe(activeRoomId);
    scheduleClipboardAutoWipe(45000);
    setCopiedCode(true);
    showToast(`Room code "${activeRoomId}" copied to clipboard.`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1. Unauthenticated Login Screen (Full-Screen Landing & Access Terminal)
  if (connectionState === 'unauthenticated') {
    return (
      <>
        <LandingHeroView
          roomId={roomId}
          setRoomId={setRoomId}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          authError={authError}
          setAuthError={setAuthError}
          isSubmitting={isSubmitting}
          lockoutTimer={lockoutTimer}
          handleRoomSubmit={handleRoomSubmit}
          generateRandomRoom={generateRandomRoom}
          setSecurityModalOpen={setSecurityModalOpen}
          setQrScannerOpen={setQrScannerOpen}
          setRoomQrOpen={setRoomQrOpen}
          onOpenPolicyModal={(tab) => {
            setPolicyTab(tab || 'privacy');
            setPolicyModalOpen(true);
          }}
          onOpenDiagnosticsModal={() => setDiagnosticsModalOpen(true)}
          pingMs={pingMs}
        />

        {/* Modals Accessible from Landing Screen */}
        <SecurityShieldModal
          isOpen={securityModalOpen}
          onClose={() => setSecurityModalOpen(false)}
        />
        <QrScannerModal
          isOpen={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onScanSuccess={handleQrScanSuccess}
        />
        <RoomQrModal
          isOpen={roomQrOpen}
          onClose={() => setRoomQrOpen(false)}
          roomId={roomId.trim().toUpperCase() || 'SAMPLE-ROOM'}
          password={password}
        />
        <PolicyTermsModal
          isOpen={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          defaultTab={policyTab}
        />
        <SystemDiagnosticsModal
          isOpen={diagnosticsModalOpen}
          onClose={() => setDiagnosticsModalOpen(false)}
          currentPing={pingMs}
          activeRoomId={activeRoomId || roomId}
          pingQuality={pingQuality}
          jitterMs={jitterMs}
          avgPingMs={avgPingMs}
          minPingMs={minPingMs}
          maxPingMs={maxPingMs}
          targetName={targetName}
          pingHistory={pingHistory}
        />
        {securityToastMessage && (
          <SecurityToast
            message={securityToastMessage}
            type={securityToastType}
            onDismiss={() => setSecurityToastMessage(null)}
          />
        )}
      </>
    );
  }

  // 2. Room is Full Screen
  if (connectionState === 'room_full') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 antialiased relative selection:bg-emerald-500 selection:text-neutral-950">
        <InteractiveCheckeredBackground palette="amber" cellSize={38} />
        <div
          id="room-full-card"
          className="w-full max-w-sm bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-7 shadow-2xl text-center space-y-5 relative z-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider uppercase text-neutral-100">
              Room is Full (2/2)
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Room <span className="font-mono text-neutral-200 font-semibold">{activeRoomId || roomId}</span> already has two active participants.
            </p>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Each private room strictly enforces a 2-person limit for zero-knowledge 1-to-1 encryption.
          </p>

          <div className="space-y-2 pt-1">
            <button
              id="retry-room-full-button"
              type="button"
              onClick={() => handleRoomSubmit(undefined, roomId, password)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check If Slot Opened</span>
            </button>

            <button
              id="new-room-from-full-button"
              type="button"
              onClick={() => {
                generateRandomRoom();
                handleLeaveRoom();
              }}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>Create New Private Room</span>
            </button>

            <button
              id="back-from-full-button"
              type="button"
              onClick={handleLeaveRoom}
              className="w-full text-neutral-400 hover:text-neutral-200 py-2 text-xs transition-colors cursor-pointer"
            >
              Back to Access Terminal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Disconnected Screen
  if (connectionState === 'disconnected') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 antialiased relative selection:bg-emerald-500 selection:text-neutral-950">
        <InteractiveCheckeredBackground palette="cyan" cellSize={38} />
        <div
          id="disconnected-card"
          className="w-full max-w-sm bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-7 shadow-2xl text-center space-y-5 relative z-10"
        >
          <div>
            <h1 className="text-base font-bold tracking-wider uppercase text-neutral-100">
              Disconnected
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Connection to room <span className="font-mono text-neutral-200">{activeRoomId}</span> was closed.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              id="reconnect-button"
              onClick={handleRoomSubmit}
              className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reconnect
            </button>
            <button
              id="leave-room-button"
              onClick={handleLeaveRoom}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Room Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. FULL SCREEN CHAT INTERFACE WITH CUSTOM THEMES, WALLPAPER, VOICE, AND REPLIES
  return (
    <div
      id="chat-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`fixed inset-0 w-screen h-screen flex flex-col overflow-hidden select-none ${currentTheme.bgStyle}`}
    >
      {/* Interactive Checkered Neon Grid Background Layer */}
      <InteractiveCheckeredBackground
        palette={
          currentTheme.id === 'emerald'
            ? 'emerald'
            : currentTheme.id === 'neon'
            ? 'cyan'
            : currentTheme.id === 'sunset'
            ? 'violet'
            : currentTheme.id === 'ocean'
            ? 'cyan'
            : 'multi'
        }
        cellSize={38}
        opacity={currentTheme.type === 'custom' ? 0.25 : 0.65}
      />
      {/* Custom Wallpaper Background Image & Dimming Layer if Custom Theme */}
      {currentTheme.type === 'custom' && currentTheme.customBgUrl && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <img
            src={currentTheme.customBgUrl}
            alt="Custom wallpaper"
            className="w-full h-full object-cover"
          />
          <div
            style={{ backgroundColor: `rgba(0, 0, 0, ${(currentTheme.customDim ?? 50) / 100})` }}
            className="absolute inset-0 backdrop-blur-[1.5px]"
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Header & Integrated Tools */}
      <ChatHeader
        activeRoomId={activeRoomId}
        copiedCode={copiedCode}
        onCopyRoomId={handleCopyRoomId}
        connectionState={connectionState}
        pingMs={pingMs}
        pingQuality={pingQuality}
        jitterMs={jitterMs}
        avgPingMs={avgPingMs}
        targetName={targetName}
        onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onStartVoiceCall={handleStartVoiceCall}
        onStartVideoCall={handleStartVideoCall}
        onOpenSearch={() => setIsSearchOpen((prev) => !prev)}
        isSearchOpen={isSearchOpen}
        onOpenVault={() => setVaultOpen(true)}
        vaultItemCount={vaultItemCount}
        onOpenScratchpad={() => setScratchpadOpen(true)}
        onOpenCodeSandbox={() => handleOpenCodeSandbox()}
        onToggleBlurGuard={handleToggleBlurGuard}
        blurGuardActive={blurGuardActive}
        onToggleMusic={() => setMusicPlayerOpen((prev) => !prev)}
        isMusicOpen={musicPlayerOpen}
        activeSongName={activeSongName}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onOpenShareModal={() => {
          setShareLinkInitialMode('share_room');
          setShareLinkModalOpen(true);
        }}
        onOpenQrModal={() => setRoomQrOpen(true)}
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
        onOpenNotificationModal={() => setNotificationModalOpen(true)}
        soundEnabled={soundEnabled}
        onOpenPolicyModal={() => {
          setPolicyTab('privacy');
          setPolicyModalOpen(true);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onLeaveRoom={handleLeaveRoom}
        currentTheme={currentTheme}
        notifPermission={notifPermission}
        onRequestDesktopPermission={handleRequestDesktopPermission}
        ephemeralEnabled={ephemeralEnabled}
        ephemeralDurationOption={ephemeralDurationOption}
        onOpenEphemeralSettings={() => setEphemeralModalOpen(true)}
        onLockSession={() => {
          setSessionLockReason('Manual privacy lock invoked');
          setSessionLocked(true);
        }}
        starredCount={starredCount}
        onOpenStarredMessages={() => setStarredModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onTriggerStealthDecoy={() => setStealthDecoyOpen(true)}
        onOpenDisplaySettings={() => setAppearanceModalOpen(true)}
        onOpenQuickReplies={() => setQuickRepliesModalOpen(true)}
        onOpenPersonalNotes={() => setPersonalNotesModalOpen(true)}
        onOpenCryptoCipher={() => setCryptoCipherModalOpen(true)}
        onOpenPasswordGenerator={() => setPasswordGenModalOpen(true)}
        onOpenBurnOnRead={() => setBurnOnReadModalOpen(true)}
        onOpenSteganography={() => {
          setSteganographyInspectText('');
          setSteganographyModalOpen(true);
        }}
        onOpenAcousticShield={() => setAcousticShieldModalOpen(true)}
        onOpenFileShredder={() => setFileShredderModalOpen(true)}
      />

      {/* Real-time In-Chat Search Bar */}
      <ChatSearchBar
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        matchCount={matchedMessages.length}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        filterType={searchFilter}
        setFilterType={setSearchFilter}
        accentColor={currentTheme.accentColor}
      />

      {/* Pinned Message Sticky Banner */}
      <PinnedMessageBanner
        message={pinnedMessage}
        onJumpTo={scrollToMessage}
        onUnpin={() => setPinnedMessageId(null)}
        accentColor={currentTheme.accentColor}
      />

      {/* Desktop Notification Banner if permission not requested yet */}
      {showNotifBanner && notifPermission === 'default' && (
        <div className="w-full px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Desktop Notifications:</strong> Enable desktop popups to never miss private incoming messages while in other tabs.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="banner-allow-notifications-btn"
              onClick={handleRequestDesktopPermission}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Allow Notifications
            </button>
            <button
              type="button"
              onClick={() => setShowNotifBanner(false)}
              className="p-1 hover:bg-amber-500/20 rounded-md text-amber-400/80 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Screen Chat Feed */}
      <main
        id="messages-feed"
        onScroll={handleFeedScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 w-full flex flex-col relative z-10"
      >
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-end space-y-4">
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center text-center p-8 space-y-4 select-none">
              {connectionState === 'connected' ? (
                <ConversationStarters
                  onSendMessage={(text) => handleSendMessage(undefined, text)}
                  onOpenVoice={handleStartVoiceRecording}
                  onOpenFile={() => fileInputRef.current?.click()}
                  onOpenPoll={() => setCreatePollModalOpen(true)}
                  onOpenDraw={() => setQuickDrawModalOpen(true)}
                  accentColor={currentTheme.accentColor}
                />
              ) : (
                <div className="space-y-3 max-w-md">
                  <h2 className="text-base font-semibold">
                    Waiting for the second person
                  </h2>
                  <p className="text-xs opacity-75 leading-relaxed">
                    Share your room code{' '}
                    <span className="font-mono text-amber-300 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      {activeRoomId}
                    </span>{' '}
                    and room password with your peer to begin chatting in full screen.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyRoomId}
                      className="inline-flex items-center gap-2 text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-neutral-950" /> : <Copy className="w-4 h-4" />}
                      {copiedCode ? 'Room Code Copied!' : 'Copy Room Code (Manual Join)'}
                    </button>
                    <button
                      id="waiting-show-qr-button"
                      type="button"
                      onClick={() => setRoomQrOpen(true)}
                      className="inline-flex items-center gap-2 text-xs opacity-90 hover:opacity-100 bg-black/40 hover:bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 transition-colors cursor-pointer text-emerald-300"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show QR Code (Optional)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : visibleMessages.length === 0 && messages.length > 0 ? (
            <div className="my-auto text-center p-6 text-xs text-neutral-400">
              All messages in this room were deleted or hidden.
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {visibleMessages.map((msg, idx) => {
                if (msg.sender === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="flex justify-center my-3"
                    >
                      <span className="bg-black/40 border border-white/10 backdrop-blur-md text-xs px-3.5 py-1 rounded-full shadow-sm opacity-80">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === 'me';
                const isHighlighted = highlightedMsgId === msg.id;

                // Compute Date Divider
                const currentDateGroup = formatDateGroup(msg.createdAt);
                const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                const prevDateGroup = prevMsg ? formatDateGroup(prevMsg.createdAt) : null;
                const showDateDivider = currentDateGroup && currentDateGroup !== prevDateGroup;

                const nextMsg = idx < visibleMessages.length - 1 ? visibleMessages[idx + 1] : null;

                // Consecutive checks (within 3 minutes from same sender, with no date divider between)
                const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
                const prevTime = prevMsg?.createdAt ? new Date(prevMsg.createdAt).getTime() : 0;
                const nextTime = nextMsg?.createdAt ? new Date(nextMsg.createdAt).getTime() : 0;

                const isPrevSameSender = !showDateDivider && prevMsg && prevMsg.sender === msg.sender && Math.abs(msgTime - prevTime) < 180000;
                const isNextSameSender = nextMsg && nextMsg.sender === msg.sender && Math.abs(nextTime - msgTime) < 180000;

                // Dynamic bubble border radii for a sleek conversation flow
                let bubbleRadiusClass = '';
                if (isMe) {
                  if (!isPrevSameSender && !isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-br-xs';
                  } else if (!isPrevSameSender && isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-br-sm';
                  } else if (isPrevSameSender && isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-r-sm';
                  } else {
                    bubbleRadiusClass = 'rounded-2xl rounded-tr-sm rounded-br-xs';
                  }
                } else {
                  if (!isPrevSameSender && !isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-bl-xs';
                  } else if (!isPrevSameSender && isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-bl-sm';
                  } else if (isPrevSameSender && isNextSameSender) {
                    bubbleRadiusClass = 'rounded-2xl rounded-l-sm';
                  } else {
                    bubbleRadiusClass = 'rounded-2xl rounded-tl-sm rounded-bl-xs';
                  }
                }

                const isSeen = Boolean(
                  isMe &&
                  peerLastReadTimestamp > 0 &&
                  msgTime > 0 &&
                  peerLastReadTimestamp >= msgTime
                );

                return (
                  <ChatMessageItem
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    isSeen={isSeen}
                    isHighlighted={isHighlighted}
                    showDateDivider={Boolean(showDateDivider)}
                    currentDateGroup={currentDateGroup}
                    isPrevSameSender={Boolean(isPrevSameSender)}
                    bubbleRadiusClass={bubbleRadiusClass}
                    targetName={targetName}
                    myUserId={myUserId}
                    isPinned={pinnedMessageId === msg.id}
                    isCopied={copiedMsgId === msg.id}
                    currentTheme={currentTheme}
                    activeRoomId={activeRoomId}
                    roomPassword={activePasswordRef.current || password.trim()}
                    onToggleReaction={handleToggleReaction}
                    onReplyToMessage={handleReplyToMessage}
                    onTogglePinMessage={handleTogglePinMessage}
                    onShowMessageDetails={handleShowMessageDetails}
                    onOpenDeleteDialog={handleOpenDeleteDialog}
                    onCopyMessageText={handleCopyMessageText}
                    onJumpToMessage={handleJumpToMessage}
                    onExpireMessage={handleExpireMessage}
                    blurGuardActive={blurGuardActive}
                    onOpenCodeInSandbox={(code, lang) => handleOpenCodeSandbox(code, lang)}
                    onEditMessage={handleStartEditMessage}
                    onBurnMedia={handleBurnMedia}
                    onToggleStarMessage={handleToggleStarMessage}
                    onVoteOption={handleVoteOption}
                    onToggleClosePoll={handleToggleClosePoll}
                    onSaveToNotes={handleSaveToNotes}
                    displayDensity={displaySettings.density}
                    fontSizePref={displaySettings.fontSize}
                    timeFormatPref={displaySettings.timeFormat}
                    fontFamilyPref={displaySettings.fontFamily}
                    bubbleCornerPref={displaySettings.bubbleRadius}
                    showTimestamps={displaySettings.showTimestamps !== false}
                    speechEnabled={true}
                    onInspectSteganography={(txt) => {
                      setSteganographyInspectText(txt);
                      setSteganographyModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Real-Time Live Writing Floating Animation */}
          <FloatingTypingIndicator isVisible={isPeerTyping} />

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Sticky Floating Scroll-to-Bottom Button with Unread Badge */}
      <ScrollToBottomButton
        show={showScrollBottom}
        unreadCount={unreadScrolledCount}
        onClick={scrollToBottom}
        accentColor={currentTheme.accentColor}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm border-2 border-dashed border-amber-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-lg font-bold">Drop any file here</h2>
          <p className="text-xs opacity-75 max-w-sm mt-1">
            Transmits any media type (txt, photos, videos, md, pdf, ppt, docx, tar, zip) directly to your peer.
          </p>
        </div>
      )}

      {/* Compression & Upload Progress Modal */}
      {compressModal && (
        <FileCompressProgressModal
          fileName={compressModal.fileName}
          fileSize={compressModal.fileSize}
          progressStep={compressModal.step}
          progressPercent={compressModal.percent}
        />
      )}

      {/* Theme Selector Modal */}
      {themeModalOpen && (
        <ThemeSelectorModal
          currentTheme={currentTheme}
          onSelectTheme={(theme) => {
            setCurrentTheme(theme);
            saveThemeSelection(theme);
          }}
          onClose={() => setThemeModalOpen(false)}
        />
      )}

      {/* Bottom Sticky Input Bar - Full Width with Centered Controls */}
      <footer
        id="chat-input-bar"
        className={`w-full border-t backdrop-blur-md p-3 sm:p-4 z-30 shrink-0 ${currentTheme.inputStyle}`}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
          {/* Ephemeral / Auto-Disappearing Messages Active Status Banner */}
          {ephemeralEnabled && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>
                  Auto-disappear is <strong>ON</strong> ({ephemeralDurationOption} timer)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEphemeralModalOpen(true)}
                  className="underline hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  Change timer
                </button>
                <span className="text-amber-600/70">•</span>
                <button
                  type="button"
                  onClick={() => handleChangeEphemeralSetting(false, 'off')}
                  className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-300 transition-colors cursor-pointer text-[11px] font-medium"
                >
                  Turn off
                </button>
              </div>
            </div>
          )}

          {/* Scheduled Messages Tray */}
          {scheduledMessages.length > 0 && (
            <ScheduledMessagesTray
              scheduledMessages={scheduledMessages}
              onCancel={handleCancelScheduled}
              onSendNow={handleSendScheduledImmediately}
            />
          )}

          {/* Chat Input Bar with auto-expanding multiline, voice recorder, reply staging, file staging, slash commands, emojis */}
          <ChatInputBar
            connectionState={connectionState}
            inputText={inputText}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            stagedFile={stagedFile}
            stagedPreviewUrl={stagedPreviewUrl}
            onClearStagedFile={clearStagedFile}
            isRecordingVoice={isRecordingVoice}
            voiceVolume={voiceVolume}
            onStartVoiceRecording={handleStartVoiceRecording}
            onCancelVoiceRecording={handleCancelVoiceRecording}
            onSendVoiceRecording={handleSendVoiceRecording}
            slashMenuOpen={slashMenuOpen}
            setSlashMenuOpen={setSlashMenuOpen}
            slashFilter={slashFilter}
            setSlashFilter={setSlashFilter}
            onExecuteSlashCommand={handleExecuteSlashCommand}
            emojiPickerOpen={emojiPickerOpen}
            setEmojiPickerOpen={setEmojiPickerOpen}
            ephemeralEnabled={ephemeralEnabled}
            ephemeralDurationOption={ephemeralDurationOption}
            onOpenEphemeralModal={() => setEphemeralModalOpen(true)}
            onOpenShareLinkModal={() => {
              setShareLinkInitialMode('send_link');
              setShareLinkModalOpen(true);
            }}
            onOpenCodeSandbox={() => handleOpenCodeSandbox()}
            onOpenCreatePoll={() => setCreatePollModalOpen(true)}
            onOpenQuickDraw={() => setQuickDrawModalOpen(true)}
            onOpenScheduleMessage={() => setScheduleModalOpen(true)}
            onOpenQuickReplies={() => setQuickRepliesModalOpen(true)}
            onOpenPersonalNotes={() => setPersonalNotesModalOpen(true)}
            onOpenCryptoCipher={() => setCryptoCipherModalOpen(true)}
            onOpenPasswordGenerator={() => setPasswordGenModalOpen(true)}
            onOpenBurnOnRead={() => setBurnOnReadModalOpen(true)}
            onOpenSteganography={() => {
              setSteganographyInspectText('');
              setSteganographyModalOpen(true);
            }}
            onOpenAcousticShield={() => setAcousticShieldModalOpen(true)}
            onOpenFileShredder={() => setFileShredderModalOpen(true)}
            sendKeyPreference={displaySettings.sendKeyPreference}
            showCharacterCount={displaySettings.showCharacterCount !== false}
            showWordCount={displaySettings.showWordCount !== false}
            isDictating={isDictating}
            onToggleDictate={handleToggleVoiceDictation}
            voiceLiveTranscript={voiceLiveTranscript}
            onSendMessageOrFile={handleSendMessageOrFile}
            onFileSelect={handleFileSelect}
            fileInputRef={fileInputRef}
            textareaRef={textareaRef}
            currentTheme={currentTheme}
            onPaste={handlePaste}
            onTextareaChange={handleTextareaChange}
            onTextareaKeyDown={handleTextareaKeyDown}
            editingMessage={editingMessage}
            onCancelEditMessage={handleCancelEditMessage}
            onEditImage={handleOpenImageEditor}
            isViewOnce={isViewOnce}
            onToggleViewOnce={() => setIsViewOnce((prev) => !prev)}
          />

          {/* Micro-status & Security Enclave Bar */}
          <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 pt-0.5 select-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">AES-256-GCM Hardware Enclave</span>
                <span className="sm:hidden">E2EE</span>
              </span>
              <span className="text-neutral-600 hidden md:inline">•</span>
              <span className="text-neutral-400 hidden md:inline">
                Paste screenshots from clipboard
              </span>
            </div>

            <div className="flex items-center gap-2.5 font-mono text-neutral-400">
              {inputText.length > 0 && (
                <span>
                  {inputText.length} {inputText.length === 1 ? 'char' : 'chars'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(true)}
                className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                title="View keyboard shortcuts (?)"
              >
                <Keyboard className="w-3 h-3" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Video & Voice Call Full-Screen Modal */}
      {videoCallModalOpen && (
        <VideoCallModal
          roomId={activeRoomId}
          myUserId={myUserId}
          myUserName="You"
          peerUserName={incomingCallData?.callerName || 'Peer'}
          callType={callType}
          isOpen={videoCallModalOpen}
          isCaller={isVideoCaller}
          incomingCallData={incomingCallData}
          onClose={() => {
            setVideoCallModalOpen(false);
            setIncomingCallData(null);
          }}
        />
      )}

      {/* Emoji Picker Popover */}
      <EmojiPickerPopover
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      {/* Military-Grade Security Shield & Anti-Tamper Modal */}
      <SecurityShieldModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        activeRoomId={activeRoomId || roomId.trim().toUpperCase()}
        onBurnRoom={handleBurnRoom}
        isLockedOut={lockoutTimer.isLocked}
        lockoutRemaining={lockoutTimer.remainingSeconds}
      />

      {/* Security Deterrence Toast Notification */}
      <SecurityToast
        message={securityToastMessage}
        type={securityToastType}
        onDismiss={() => setSecurityToastMessage(null)}
      />

      {/* Room QR Code Modal (Generate & Share) */}
      <RoomQrModal
        isOpen={roomQrOpen}
        onClose={() => setRoomQrOpen(false)}
        roomId={activeRoomId || roomId.trim().toUpperCase()}
        password={password}
      />

      {/* QR Scanner Modal (Live Camera Viewfinder + Image Upload) */}
      <QrScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* Audio & Desktop Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        desktopEnabled={desktopEnabled}
        setDesktopEnabled={setDesktopEnabled}
      />

      {/* Chat Vault Modal (All Messages, Files, Audio & Links Date-Sorted) */}
      <ChatVaultModal
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        roomId={activeRoomId}
        messages={messages}
        myUserId={myUserId}
        roomPassword={activePasswordRef.current || password.trim()}
        onJumpToMessage={handleJumpToMessage}
        onOpenShareModal={() => {
          setShareLinkInitialMode('send_link');
          setShareLinkModalOpen(true);
        }}
      />

      {/* Collaborative Live Scratchpad & Whiteboard Canvas Modal */}
      <CollaborativeScratchpadModal
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        roomId={activeRoomId}
        myUserId={myUserId}
        myUserName={`User ${myUserId.slice(-4)}`}
        accentColor={currentTheme.accentColor}
        onSendMessageToChat={(text) => handleSendMessage(undefined, text)}
        onSendImageToChat={(file, caption) => processAndUploadFile(file, caption || '🎨 Shared Whiteboard Drawing')}
      />

      {/* Share Links & Room Invites Modal */}
      <ShareLinkModal
        isOpen={shareLinkModalOpen}
        onClose={() => setShareLinkModalOpen(false)}
        roomId={activeRoomId || roomId.trim().toUpperCase()}
        roomPassword={password}
        initialMode={shareLinkInitialMode}
        onSendLinkToChat={handleSendSharedLink}
        onOpenQrModal={() => setRoomQrOpen(true)}
      />

      {/* Message Deletion Dialog (Delete for me vs Delete for everyone) */}
      <MessageDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setMessageToDelete(null);
        }}
        message={messageToDelete}
        isMyMessage={messageToDelete?.sender === 'me' || messageToDelete?.senderId === myUserId}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />

      {/* Message Timestamp & Security Inspector Modal (Sent when, time, date) */}
      <MessageDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setMessageForDetails(null);
        }}
        message={messageForDetails}
        isSeen={Boolean(
          messageForDetails &&
          messageForDetails.sender === 'me' &&
          peerLastReadTimestamp > 0 &&
          (messageForDetails.createdAt ? new Date(messageForDetails.createdAt).getTime() : 0) <= peerLastReadTimestamp
        )}
        onSaveToNotes={handleSaveToNotes}
      />

      {/* Background Music Player (Supports Royalty-Free Full Tracks & Local Song Uploads) */}
      <BackgroundMusicPlayer
        isOpen={musicPlayerOpen}
        onClose={() => setMusicPlayerOpen(false)}
        onTrackChange={(title) => setActiveSongName(title)}
      />

      {/* Privacy Policy & Terms and Conditions Modal */}
      <PolicyTermsModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        defaultTab={policyTab}
      />

      {/* System Diagnostics & Error Recovery Modal */}
      <SystemDiagnosticsModal
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        currentPing={pingMs}
        activeRoomId={activeRoomId || roomId}
        pingQuality={pingQuality}
        jitterMs={jitterMs}
        avgPingMs={avgPingMs}
        minPingMs={minPingMs}
        maxPingMs={maxPingMs}
        targetName={targetName}
        pingHistory={pingHistory}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        accentColor={currentTheme.accentColor}
      />

      {/* Auto-Disappearing / Ephemeral Messages Settings Modal */}
      <EphemeralSettingsModal
        isOpen={ephemeralModalOpen}
        onClose={() => setEphemeralModalOpen(false)}
        enabled={ephemeralEnabled}
        durationOption={ephemeralDurationOption}
        onChangeSetting={handleChangeEphemeralSetting}
        accentColor={currentTheme.accentColor}
      />

      {/* Session Privacy Lock Screen (Manual & 5-minute Inactivity Guard) */}
      <PrivacyLockGuard
        isLocked={sessionLocked}
        onUnlock={handleUnlockSession}
        onBurnRoom={handleEmergencyBurn}
        activeRoomId={activeRoomId}
        expectedPassword={activePasswordRef.current || password.trim()}
        autoLockReason={sessionLockReason}
      />

      {/* Interactive Code Snippet Sandbox Modal */}
      <CodeSandboxModal
        isOpen={codeSandboxOpen}
        onClose={() => setCodeSandboxOpen(false)}
        onSendToChat={(formattedCode) => {
          handleSendMessage(undefined, formattedCode);
          setCodeSandboxOpen(false);
        }}
        initialCode={codeSandboxSnippet?.code}
        initialLanguage={codeSandboxSnippet?.language}
        initialTitle={codeSandboxSnippet?.title}
        accentColor={currentTheme.accentColor}
      />

      {/* Image Drawing & Redaction Editor Modal (Crop, Draw, Arrows, Blur, Blackout) */}
      {imageEditorOpen && imageToEdit && (
        <ImageEditorModal
          isOpen={imageEditorOpen}
          imageFile={imageToEdit}
          previewUrl={imageEditorPreviewUrl || undefined}
          onClose={() => {
            setImageEditorOpen(false);
            setImageToEdit(null);
            if (imageEditorPreviewUrl && imageEditorPreviewUrl !== stagedPreviewUrl && imageEditorPreviewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(imageEditorPreviewUrl);
            }
            setImageEditorPreviewUrl(null);
          }}
          onSave={handleSaveEditedImage}
          accentColor={currentTheme.accentColor}
        />
      )}

      {/* Screenshot & Blur Guard Veil Overlay */}
      <BlurGuardShield
        isShieldActive={blurGuardActive && blurGuardTriggered}
        onDismiss={() => setBlurGuardTriggered(false)}
        roomId={activeRoomId || roomId}
        triggerReason={blurGuardReason}
      />

      {/* Starred / Bookmarked Messages Modal */}
      <StarredMessagesModal
        isOpen={starredModalOpen}
        onClose={() => setStarredModalOpen(false)}
        messages={messages}
        onToggleStar={handleToggleStarMessage}
        onJumpToMessage={(id) => {
          setStarredModalOpen(false);
          scrollToMessage(id);
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Chat Transcript Export Modal (.txt & .json) */}
      <ChatExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        roomId={activeRoomId || roomId}
        messages={messages}
      />

      {/* Panic Stealth Camouflage Decoy Screen */}
      <StealthDecoyModal
        isOpen={stealthDecoyOpen}
        onClose={() => setStealthDecoyOpen(false)}
      />

      {/* Encrypted Poll Creation Modal */}
      <CreatePollModal
        isOpen={createPollModalOpen}
        onClose={() => setCreatePollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
        accentColor={currentTheme.accentColor}
      />

      {/* Quick Hand-Drawn Sketch / Doodle Modal */}
      <QuickDrawModal
        isOpen={quickDrawModalOpen}
        onClose={() => setQuickDrawModalOpen(false)}
        onSendDoodle={handleSendDoodle}
        accentColor={currentTheme.accentColor}
      />

      {/* Scheduled Delayed Message Dispatch Modal */}
      <ScheduleMessageModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleScheduleMessage}
        messageText={inputText}
      />

      {/* Chat Appearance & Display Settings Modal */}
      <ChatAppearanceModal
        isOpen={appearanceModalOpen}
        onClose={() => setAppearanceModalOpen(false)}
        settings={displaySettings}
        onUpdateSettings={handleUpdateDisplaySettings}
        accentColor={currentTheme.accentColor}
      />

      {/* Quick Canned Replies & Response Templates Modal */}
      <QuickRepliesModal
        isOpen={quickRepliesModalOpen}
        onClose={() => setQuickRepliesModalOpen(false)}
        onSelectReply={(text) => {
          setInputText((prev) => (prev.trim() ? `${prev} ${text}` : text));
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Encrypted Personal Notes, Saved Messages & Scratchpad Modal */}
      <PersonalNotesModal
        isOpen={personalNotesModalOpen}
        onClose={() => setPersonalNotesModalOpen(false)}
        onSendToChat={(text) => {
          setInputText((prev) => (prev.trim() ? `${prev}\n${text}` : text));
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Cryptographic Cipher, Hash & Morse Toolkit Modal */}
      <CryptoCipherModal
        isOpen={cryptoCipherModalOpen}
        onClose={() => setCryptoCipherModalOpen(false)}
        onInsertToChat={(text) => {
          setInputText((prev) => (prev.trim() ? `${prev}\n${text}` : text));
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
        initialText={inputText}
      />

      {/* CSPRNG Password & Entropy Generator Modal */}
      <PasswordGeneratorModal
        isOpen={passwordGenModalOpen}
        onClose={() => setPasswordGenModalOpen(false)}
        onInsertToChat={(password) => {
          setInputText((prev) => (prev.trim() ? `${prev}\n${password}` : password));
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Burn-After-Reading Confidential Note Modal */}
      <BurnOnReadModal
        isOpen={burnOnReadModalOpen}
        onClose={() => setBurnOnReadModalOpen(false)}
        onInsertToChat={(payload) => {
          setInputText(payload);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Steganography Invisible Ink Concealer & Inspector Modal */}
      <SteganographyModal
        isOpen={steganographyModalOpen}
        onClose={() => {
          setSteganographyModalOpen(false);
          setSteganographyInspectText('');
        }}
        initialText={steganographyInspectText || inputText}
        onInsertToChat={(encodedText) => {
          setInputText(encodedText);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />

      {/* Acoustic Privacy & Speech Jammer Shield Modal */}
      <AcousticShieldModal
        isOpen={acousticShieldModalOpen}
        onClose={() => setAcousticShieldModalOpen(false)}
        accentColor={currentTheme.accentColor}
      />

      {/* Digital File Shredder & DoD Destruction Certifier Modal */}
      <FileShredderModal
        isOpen={fileShredderModalOpen}
        onClose={() => setFileShredderModalOpen(false)}
        onInsertToChat={(certificate) => {
          setInputText(certificate);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        accentColor={currentTheme.accentColor}
      />
    </div>
  );
}
