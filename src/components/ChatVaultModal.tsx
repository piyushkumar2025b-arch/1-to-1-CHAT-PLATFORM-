import { useState, useMemo } from 'react';
import {
  X,
  Archive,
  Image as ImageIcon,
  FileText,
  Mic,
  Link2,
  MessageSquare,
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Eye,
  Loader2,
  HardDrive,
  Filter,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  Play,
  Pause,
  ArrowUpRight,
  ShieldCheck,
  Share2,
  Star,
  FileDown,
} from 'lucide-react';
import { ChatMessage, FileAttachment } from '../types';
import { formatBytes, triggerBlobDownload } from '../lib/file-compression';
import { extractUrlsFromText, ExtractedLink } from '../lib/link-utils';
import { downloadRoomFile, getRoomFileBlob, getFileCategoryInfo } from '../lib/file-retrieval';
import { copyToClipboardSafe } from '../lib/security';

interface ChatVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  messages: ChatMessage[];
  myUserId: string;
  onJumpToMessage?: (msgId: string) => void;
  onOpenShareModal?: () => void;
  roomPassword?: string;
}

type VaultTab = 'all' | 'media' | 'voice' | 'documents' | 'links' | 'messages';
type SortDirection = 'newest' | 'oldest';

interface VaultItem {
  id: string;
  messageId: string;
  type: 'media' | 'voice' | 'document' | 'link' | 'text';
  title: string;
  subtitle?: string;
  sender: 'me' | 'peer' | 'system';
  senderName: string;
  date: Date;
  dateKey: string; // YYYY-MM-DD
  formattedDate: string;
  timeString: string;
  file?: FileAttachment;
  link?: ExtractedLink;
  text?: string;
  sizeBytes?: number;
}

function formatDateGroupKey(d: Date): { key: string; label: string } {
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

  if (isToday) return { key, label: 'Today' };
  if (isYesterday) return { key, label: 'Yesterday' };

  return {
    key,
    label: d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export function ChatVaultModal({
  isOpen,
  onClose,
  roomId,
  messages,
  myUserId,
  onJumpToMessage,
  onOpenShareModal,
  roomPassword,
}: ChatVaultModalProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>('all');
  const [sortOrder, setSortOrder] = useState<SortDirection>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [dateHorizon, setDateHorizon] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);

  // Starred/bookmarked items persisted per room
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`vault_starred_${roomId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`vault_starred_${roomId}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Preview & media player state
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    fileName: string;
  } | null>(null);

  // Download state tracker: fileId -> boolean
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});
  const [copiedLinkUrl, setCopiedLinkUrl] = useState<string | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [vaultToast, setVaultToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Playing audio in vault state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  // 1. Parse and extract all vault items from messages
  const allVaultItems = useMemo<VaultItem[]>(() => {
    const items: VaultItem[] = [];

    messages.forEach((msg, idx) => {
      // Determine timestamp
      let itemDate = new Date();
      if (msg.createdAt) {
        const parsed = new Date(msg.createdAt);
        if (!isNaN(parsed.getTime())) itemDate = parsed;
      }

      const { key: dateKey, label: formattedDate } = formatDateGroupKey(itemDate);
      const timeString =
        msg.time ||
        itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const senderName = msg.sender === 'me' ? 'You' : msg.sender === 'peer' ? 'Peer' : 'System';

      // 1. Files & Media & Voice
      if (msg.file) {
        const file = msg.file;
        const catInfo = getFileCategoryInfo(file.mimeType, file.fileName);

        if (file.isVoice || catInfo.category === 'audio') {
          items.push({
            id: `voice_${file.fileId}_${idx}`,
            messageId: msg.id,
            type: 'voice',
            title: file.fileName,
            subtitle: file.duration ? `${Math.round(file.duration)}s Voice Note` : 'Audio Note',
            sender: msg.sender,
            senderName,
            date: itemDate,
            dateKey,
            formattedDate,
            timeString,
            file,
            sizeBytes: file.fileSize,
          });
        } else if (catInfo.category === 'image' || catInfo.category === 'video') {
          items.push({
            id: `media_${file.fileId}_${idx}`,
            messageId: msg.id,
            type: 'media',
            title: file.fileName,
            subtitle: `${catInfo.label} • ${formatBytes(file.fileSize)}`,
            sender: msg.sender,
            senderName,
            date: itemDate,
            dateKey,
            formattedDate,
            timeString,
            file,
            sizeBytes: file.fileSize,
          });
        } else {
          // Documents, archives, code, etc.
          items.push({
            id: `doc_${file.fileId}_${idx}`,
            messageId: msg.id,
            type: 'document',
            title: file.fileName,
            subtitle: `${catInfo.label} • ${formatBytes(file.fileSize)}`,
            sender: msg.sender,
            senderName,
            date: itemDate,
            dateKey,
            formattedDate,
            timeString,
            file,
            sizeBytes: file.fileSize,
          });
        }
      }

      // 2. Extract URLs / Shared Links
      if (msg.text) {
        const extractedLinks = extractUrlsFromText(msg.text);
        extractedLinks.forEach((link, linkIdx) => {
          items.push({
            id: `link_${msg.id}_${linkIdx}`,
            messageId: msg.id,
            type: 'link',
            title: link.domain,
            subtitle: link.displayUrl,
            sender: msg.sender,
            senderName,
            date: itemDate,
            dateKey,
            formattedDate,
            timeString,
            link,
            text: msg.text,
          });
        });

        // 3. Regular chat transcript record
        if (msg.text.trim()) {
          items.push({
            id: `msg_${msg.id}_${idx}`,
            messageId: msg.id,
            type: 'text',
            title: msg.text,
            sender: msg.sender,
            senderName,
            date: itemDate,
            dateKey,
            formattedDate,
            timeString,
            text: msg.text,
          });
        }
      }
    });

    return items;
  }, [messages]);

  // Distinct dates list for filter dropdown
  const availableDates = useMemo(() => {
    const map = new Map<string, string>();
    allVaultItems.forEach((item) => {
      if (!map.has(item.dateKey)) {
        map.set(item.dateKey, item.formattedDate);
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [allVaultItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = allVaultItems;

    // Filter by tab
    if (activeTab === 'media') {
      list = list.filter((i) => i.type === 'media');
    } else if (activeTab === 'voice') {
      list = list.filter((i) => i.type === 'voice');
    } else if (activeTab === 'documents') {
      list = list.filter((i) => i.type === 'document');
    } else if (activeTab === 'links') {
      list = list.filter((i) => i.type === 'link');
    } else if (activeTab === 'messages') {
      list = list.filter((i) => i.type === 'text');
    }

    // Filter by date
    if (selectedDateFilter !== 'all') {
      list = list.filter((i) => i.dateKey === selectedDateFilter);
    }

    // Filter by Starred items
    if (onlyStarred) {
      list = list.filter((i) => starredIds.has(i.id));
    }

    // Filter by date horizon preset
    if (dateHorizon !== 'all') {
      const now = Date.now();
      if (dateHorizon === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        list = list.filter((i) => i.dateKey === todayStr);
      } else if (dateHorizon === '7d') {
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        list = list.filter((i) => i.date.getTime() >= cutoff);
      } else if (dateHorizon === '30d') {
        const cutoff = now - 30 * 24 * 60 * 60 * 1000;
        list = list.filter((i) => i.date.getTime() >= cutoff);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
          (i.text && i.text.toLowerCase().includes(q)) ||
          (i.link && i.link.url.toLowerCase().includes(q)) ||
          i.senderName.toLowerCase().includes(q)
      );
    }

    // Sort by date
    return list.sort((a, b) => {
      const timeA = a.date.getTime();
      const timeB = b.date.getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [allVaultItems, activeTab, selectedDateFilter, onlyStarred, starredIds, dateHorizon, searchQuery, sortOrder]);

  // Group filtered items by date for chronological presentation
  const groupedItems = useMemo(() => {
    const groups: { dateKey: string; label: string; items: VaultItem[] }[] = [];
    const groupMap = new Map<string, VaultItem[]>();

    filteredItems.forEach((item) => {
      const existing = groupMap.get(item.dateKey);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(item.dateKey, [item]);
      }
    });

    groupMap.forEach((itemsInGroup, dateKey) => {
      const label = itemsInGroup[0]?.formattedDate || dateKey;
      groups.push({ dateKey, label, items: itemsInGroup });
    });

    return groups;
  }, [filteredItems]);

  // Summary statistics
  const stats = useMemo(() => {
    let mediaCount = 0;
    let voiceCount = 0;
    let docCount = 0;
    let linkCount = 0;
    let totalBytes = 0;

    allVaultItems.forEach((i) => {
      if (i.type === 'media') mediaCount++;
      if (i.type === 'voice') voiceCount++;
      if (i.type === 'document') docCount++;
      if (i.type === 'link') linkCount++;
      if (i.sizeBytes) totalBytes += i.sizeBytes;
    });

    return {
      mediaCount,
      voiceCount,
      docCount,
      linkCount,
      totalBytes,
      totalCount: allVaultItems.length,
    };
  }, [allVaultItems]);

  if (!isOpen) return null;

  // Handle single file download
  const handleDownloadItem = async (file: FileAttachment) => {
    try {
      setDownloadingIds((prev) => ({ ...prev, [file.fileId]: true }));
      await downloadRoomFile(roomId, file, undefined, roomPassword);
      setVaultToast({ message: `Downloaded "${file.fileName}"`, type: 'success' });
      setTimeout(() => setVaultToast(null), 3000);
    } catch (err) {
      console.error('Vault download failed:', err);
      setVaultToast({ message: 'Could not download file. Please check connection.', type: 'error' });
      setTimeout(() => setVaultToast(null), 4000);
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [file.fileId]: false }));
    }
  };

  // Handle media preview
  const handlePreviewMedia = async (file: FileAttachment) => {
    try {
      if (file.previewUrl) {
        setPreviewMedia({
          url: file.previewUrl,
          type: file.mimeType.startsWith('video/') ? 'video' : 'image',
          fileName: file.fileName,
        });
        return;
      }
      const blob = await getRoomFileBlob(roomId, file, undefined, roomPassword);
      const url = URL.createObjectURL(blob);
      setPreviewMedia({
        url,
        type: file.mimeType.startsWith('video/') ? 'video' : 'image',
        fileName: file.fileName,
      });
    } catch (err) {
      console.error('Error previewing media:', err);
      handleDownloadItem(file);
    }
  };

  // Handle audio play/pause in vault
  const handleTogglePlayAudio = async (item: VaultItem) => {
    if (!item.file) return;
    const fileId = item.file.fileId;

    if (playingAudioId === fileId) {
      // Pause
      const current = audioElements[fileId];
      if (current) current.pause();
      setPlayingAudioId(null);
      return;
    }

    try {
      // Stop any other playing audio
      if (playingAudioId && audioElements[playingAudioId]) {
        audioElements[playingAudioId].pause();
      }

      let audio = audioElements[fileId];
      if (!audio) {
        const blob = await getRoomFileBlob(roomId, item.file, undefined, roomPassword);
        const url = URL.createObjectURL(blob);
        audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        setAudioElements((prev) => ({ ...prev, [fileId]: audio }));
      }

      await audio.play();
      setPlayingAudioId(fileId);
    } catch (err) {
      console.error('Failed playing audio note:', err);
    }
  };

  // Export full vault archive backup
  const handleExportVaultBackup = () => {
    const backupData = {
      vaultVersion: '1.0',
      roomId,
      exportedAt: new Date().toISOString(),
      stats,
      items: allVaultItems.map((item) => ({
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        sender: item.senderName,
        timestamp: item.date.toISOString(),
        time: item.timeString,
        text: item.text,
        url: item.link?.url,
        file: item.file
          ? {
              fileName: item.file.fileName,
              fileSize: item.file.fileSize,
              mimeType: item.file.mimeType,
            }
          : undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    triggerBlobDownload(blob, `Vault_Backup_${roomId}_${new Date().toISOString().slice(0, 10)}.json`);
  };

  // Export clean Markdown digest report
  const handleExportVaultMarkdown = () => {
    let md = `# 🛡️ Encrypted Vault Digest\n\n`;
    md += `**Room ID:** \`${roomId}\`  \n`;
    md += `**Generated:** ${new Date().toLocaleString()}  \n`;
    md += `**Encrypted Vault Assets:** ${stats.totalCount} total items (${formatBytes(stats.totalBytes)} storage)  \n\n`;

    md += `### Summary\n`;
    md += `- **Media & Photos:** ${stats.mediaCount}\n`;
    md += `- **Files & Documents:** ${stats.docCount}\n`;
    md += `- **Voice & Audio Notes:** ${stats.voiceCount}\n`;
    md += `- **Extracted Links:** ${stats.linkCount}\n\n`;

    md += `---\n\n`;
    md += `### Vault Inventory\n\n`;

    allVaultItems.forEach((item, idx) => {
      const isStarred = starredIds.has(item.id);
      md += `#### ${idx + 1}. ${isStarred ? '⭐ ' : ''}[${item.type.toUpperCase()}] ${item.title}\n`;
      md += `- **Sender:** ${item.senderName} (${item.sender})\n`;
      md += `- **Date/Time:** ${item.formattedDate} at ${item.timeString}\n`;
      if (item.subtitle) md += `- **Metadata:** ${item.subtitle}\n`;
      if (item.link?.url) md += `- **URL:** ${item.link.url}\n`;
      if (item.file) {
        md += `- **File Details:** ${item.file.fileName} • ${formatBytes(item.file.fileSize)} • ${item.file.mimeType}\n`;
      }
      if (item.text) {
        md += `- **Content Note:** > ${item.text.replace(/\n/g, ' ')}\n`;
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    triggerBlobDownload(blob, `Vault_Digest_${roomId}_${new Date().toISOString().slice(0, 10)}.md`);
    setVaultToast({ message: 'Vault Markdown digest downloaded.', type: 'success' });
    setTimeout(() => setVaultToast(null), 3000);
  };

  const handleCopyLink = async (url: string) => {
    await copyToClipboardSafe(url);
    setCopiedLinkUrl(url);
    setVaultToast({ message: 'Link copied to clipboard.', type: 'success' });
    setTimeout(() => {
      setCopiedLinkUrl(null);
      setVaultToast(null);
    }, 2000);
  };

  const handleCopyText = async (id: string, text: string) => {
    await copyToClipboardSafe(text);
    setCopiedTextId(id);
    setVaultToast({ message: 'Message text copied.', type: 'success' });
    setTimeout(() => {
      setCopiedTextId(null);
      setVaultToast(null);
    }, 2000);
  };

  return (
    <div
      id="chat-vault-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="chat-vault-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[92vh] bg-neutral-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* In-Vault Toast Banner */}
        {vaultToast && (
          <div
            role="status"
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl text-xs font-medium backdrop-blur-md shadow-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
              vaultToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : vaultToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-neutral-900/90 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <span>{vaultToast.message}</span>
          </div>
        )}

        {/* Modal Top Header */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Chat Vault</h2>
                <span className="text-[11px] font-mono text-amber-300 font-bold bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  {roomId}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Encrypted repository for media, files, audio notes & shared links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Markdown Digest Button */}
            <button
              type="button"
              onClick={handleExportVaultMarkdown}
              title="Export formatted Markdown inventory digest (.md)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Markdown Digest</span>
            </button>

            {/* Export Backup Button */}
            <button
              type="button"
              onClick={handleExportVaultBackup}
              title="Export complete Vault archive (JSON digest)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Vault</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Statistics Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-neutral-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/70">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Storage:</span>
              <strong className="text-white font-mono">{formatBytes(stats.totalBytes)}</strong>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>Media:</span>
              <strong className="text-white font-mono">{stats.mediaCount}</strong>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Files:</span>
              <strong className="text-white font-mono">{stats.docCount}</strong>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio:</span>
              <strong className="text-white font-mono">{stats.voiceCount}</strong>
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Links:</span>
              <strong className="text-white font-mono">{stats.linkCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Encrypted in session memory</span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/10 flex items-center justify-between gap-2 bg-neutral-950/30 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Items', icon: Archive, count: stats.totalCount },
              { id: 'media', label: 'Media & Photos', icon: ImageIcon, count: stats.mediaCount },
              { id: 'documents', label: 'Files & Docs', icon: FileText, count: stats.docCount },
              { id: 'voice', label: 'Voice Notes', icon: Mic, count: stats.voiceCount },
              { id: 'links', label: 'Shared Links', icon: Link2, count: stats.linkCount },
              { id: 'messages', label: 'Chat Transcript', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as VaultTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Starred Bookmark Filter Button */}
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                onlyStarred
                  ? 'bg-amber-400/25 text-amber-300 border border-amber-400/60 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Show only starred / bookmarked vault items"
            >
              <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
              <span>Starred</span>
              {starredIds.size > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/20 text-amber-300">
                  {starredIds.size}
                </span>
              )}
            </button>
          </div>

          {/* Share Links quick launch */}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShareModal();
              }}
              title="Share a new link or room invite"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3 h-3" />
              <span>Share Link</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/40 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, URL, or message text..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Controls: Date Picker & Sort Direction */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Date Horizons */}
            <div className="flex items-center gap-0.5 bg-black/50 p-0.5 rounded-xl border border-white/10 text-[11px]">
              {(['all', 'today', '7d', '30d'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDateHorizon(h)}
                  className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    dateHorizon === h
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {h === 'all' ? 'All Time' : h === 'today' ? 'Today' : h === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-white/50" />
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-black/50 border border-white/15 text-white/80 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Dates ({allVaultItems.length})</option>
                {availableDates.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-xs text-white/80 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle date sorting order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Vault Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {groupedItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white/80">No items found</h3>
              <p className="text-xs text-white/50 max-w-sm">
                {searchQuery
                  ? `No vault items matched your search query "${searchQuery}".`
                  : activeTab === 'all'
                  ? 'Your chat vault will populate as messages, files, photos, audio notes, and links are shared in this room.'
                  : `No ${activeTab} items have been shared in this chat yet.`}
              </p>
            </div>
          ) : (
            groupedItems.map((group) => (
              <section key={group.dateKey} className="space-y-3">
                {/* Date Group Sticky Header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 py-1 bg-neutral-900/90 backdrop-blur-md">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-[11px] font-semibold text-amber-300 shadow-sm">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>{group.label}</span>
                    <span className="text-[10px] text-white/50">({group.items.length})</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>

                {/* Items Grid / List depending on Tab */}
                {activeTab === 'media' ? (
                  /* MEDIA GRID VIEW */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex flex-col aspect-square hover:border-amber-400/50 transition-all"
                      >
                        {item.file?.previewUrl ? (
                          <img
                            src={item.file.previewUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-amber-400 bg-black/50 p-2">
                            {item.file?.mimeType.startsWith('video/') ? (
                              <FileVideo className="w-10 h-10" />
                            ) : (
                              <ImageIcon className="w-10 h-10" />
                            )}
                            <span className="text-[10px] font-mono mt-1 opacity-70">
                              {item.file?.fileName.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                          <div className="flex items-center justify-between text-[10px] text-white/80">
                            <span className="font-semibold bg-black/60 px-1.5 py-0.5 rounded">
                              {item.senderName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{item.timeString}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(item.id);
                                }}
                                className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                                title={starredIds.has(item.id) ? 'Remove Star' : 'Star item'}
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    starredIds.has(item.id)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-white/60 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-white truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => item.file && handlePreviewMedia(item.file)}
                                title="View preview"
                                className="flex-1 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => item.file && handleDownloadItem(item.file)}
                                disabled={item.file ? downloadingIds[item.file.fileId] : false}
                                title="Download"
                                className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer transition-colors"
                              >
                                {item.file && downloadingIds[item.file.fileId] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* LIST / CARD VIEW FOR OTHER TABS */
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isMe = item.sender === 'me';
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* Item Left: Icon and Details */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            {/* Type Icon Badge */}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-white/5">
                              {item.type === 'media' && <ImageIcon className="w-4 h-4 text-amber-400" />}
                              {item.type === 'voice' && <Mic className="w-4 h-4 text-emerald-400" />}
                              {item.type === 'document' && <FileText className="w-4 h-4 text-sky-400" />}
                              {item.type === 'link' && <Link2 className="w-4 h-4 text-purple-400" />}
                              {item.type === 'text' && <MessageSquare className="w-4 h-4 text-amber-300" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-white/90 truncate">
                                  {item.title}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                                    isMe
                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                  }`}
                                >
                                  {item.senderName}
                                </span>
                                <span className="text-[10px] text-white/50 font-mono">
                                  {item.timeString}
                                </span>
                              </div>

                              {item.subtitle && (
                                <p className="text-[11px] text-white/60 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}

                              {item.text && item.type !== 'text' && (
                                <p className="text-[11px] text-white/50 italic truncate mt-0.5">
                                  "{item.text}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Item Right: Interactive Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            {/* Actions for Links */}
                            {item.link && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(item.link!.url)}
                                  title="Copy URL"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                                >
                                  {copiedLinkUrl === item.link.url ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline text-[11px]">Copy</span>
                                </button>

                                <a
                                  href={item.link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Visit Link</span>
                                </a>
                              </>
                            )}

                            {/* Actions for Voice / Audio */}
                            {item.type === 'voice' && item.file && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlayAudio(item)}
                                  title={playingAudioId === item.file?.fileId ? 'Pause' : 'Play'}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {playingAudioId === item.file.fileId ? (
                                    <>
                                      <Pause className="w-3.5 h-3.5" />
                                      <span>Pause</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5" />
                                      <span>Play</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadItem(item.file!)}
                                  disabled={downloadingIds[item.file.fileId]}
                                  title="Download audio recording"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                                >
                                  {downloadingIds[item.file.fileId] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}

                            {/* Actions for Files & Documents */}
                            {(item.type === 'document' || item.type === 'media') && item.file && (
                              <>
                                {item.type === 'media' && (
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewMedia(item.file!)}
                                    title="Preview media"
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDownloadItem(item.file!)}
                                  disabled={downloadingIds[item.file.fileId]}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {downloadingIds[item.file.fileId] ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                            {/* Actions for Text messages */}
                            {item.type === 'text' && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(item.id, item.title)}
                                title="Copy message text"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedTextId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Star / Bookmark Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleStar(item.id)}
                              title={starredIds.has(item.id) ? 'Remove Star' : 'Star this item'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                starredIds.has(item.id)
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                  : 'bg-white/5 hover:bg-white/15 text-white/40 hover:text-amber-400'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${starredIds.has(item.id) ? 'fill-amber-400' : ''}`} />
                            </button>

                            {/* Jump to message in chat */}
                            {onJumpToMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onJumpToMessage(item.messageId);
                                }}
                                title="Jump to this message in chat"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))
          )}
        </div>

        {/* Modal Bottom Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-white/10 bg-black/50 flex items-center justify-between text-xs shrink-0">
          <span className="text-white/60">
            Showing <strong className="text-white">{filteredItems.length}</strong> of{' '}
            <strong className="text-white">{allVaultItems.length}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportVaultBackup}
              className="sm:hidden px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/80"
            >
              Export
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </footer>
      </div>

      {/* Fullscreen Media Lightbox Preview */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a');
                a.href = previewMedia.url;
                a.download = previewMedia.fileName;
                a.click();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Download full size"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="max-w-4xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt={previewMedia.fileName}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
          <p className="text-xs text-white/70 mt-3 font-mono">{previewMedia.fileName}</p>
        </div>
      )}
    </div>
  );
}
