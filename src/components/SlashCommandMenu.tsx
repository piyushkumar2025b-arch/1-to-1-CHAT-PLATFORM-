import React, { useEffect, useState, useRef } from 'react';
import {
  PenTool,
  Phone,
  Video,
  Archive,
  Palette,
  QrCode,
  Activity,
  Flame,
  Trash2,
  Smile,
  Terminal,
  Lock,
  ShieldCheck,
  Code2,
  EyeOff,
  Zap,
  Sliders,
  Bookmark,
  Bell,
  Mic,
  KeyRound,
  Dices,
  Sparkles,
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  name: string;
  alias: string;
  description: string;
  icon: React.ReactNode;
  category: 'Tools' | 'Calls' | 'Actions' | 'Text';
  action: (insertText?: (t: string) => void) => void;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  filter: string;
  onClose: () => void;
  onExecuteCommand: (cmd: SlashCommand) => void;
  accentColor?: string;
}

export function SlashCommandMenu({
  isOpen,
  filter,
  onClose,
  onExecuteCommand,
  accentColor = '#f59e0b',
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Available commands definitions
  const commands: Omit<SlashCommand, 'action'>[] = [
    {
      id: 'code',
      name: '/code',
      alias: '/sandbox',
      description: 'Open interactive code sandbox with syntax highlighting & REPL',
      icon: <Code2 className="w-4 h-4 text-cyan-400" />,
      category: 'Tools',
    },
    {
      id: 'cipher',
      name: '/cipher',
      alias: '/encrypt',
      description: 'Open Cryptographic Cipher & Hash Toolkit (AES-GCM, SHA, Morse)',
      icon: <KeyRound className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'blur',
      name: '/blur',
      alias: '/guard',
      description: 'Toggle Screenshot & Blur Guard privacy veil',
      icon: <EyeOff className="w-4 h-4 text-emerald-400" />,
      category: 'Actions',
    },
    {
      id: 'canvas',
      name: '/canvas',
      alias: '/draw',
      description: 'Open collaborative live whiteboard & scratchpad',
      icon: <PenTool className="w-4 h-4 text-teal-400" />,
      category: 'Tools',
    },
    {
      id: 'call',
      name: '/call',
      alias: '/voice',
      description: 'Start 1-to-1 private voice call',
      icon: <Phone className="w-4 h-4 text-sky-400" />,
      category: 'Calls',
    },
    {
      id: 'video',
      name: '/video',
      alias: '/cam',
      description: 'Start HD video call with screen sharing',
      icon: <Video className="w-4 h-4 text-emerald-400" />,
      category: 'Calls',
    },
    {
      id: 'vault',
      name: '/vault',
      alias: '/archive',
      description: 'Open media vault and shared files archive',
      icon: <Archive className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'notes',
      name: '/notes',
      alias: '/scratchpad',
      description: 'Open Encrypted Notes to Self, saved messages & checklists',
      icon: <Bookmark className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'timer',
      name: '/timer',
      alias: '/disappear',
      description: 'Configure or toggle auto-disappearing messages',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'theme',
      name: '/theme',
      alias: '/style',
      description: 'Customize chat theme, colors & wallpapers',
      icon: <Palette className="w-4 h-4 text-fuchsia-400" />,
      category: 'Tools',
    },
    {
      id: 'quick',
      name: '/quick',
      alias: '/canned',
      description: 'Open quick canned replies & response templates',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'sounds',
      name: '/sounds',
      alias: '/alerts',
      description: 'Customize audio chime themes, volume & notification alerts',
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'dictate',
      name: '/dictate',
      alias: '/speech',
      description: 'Start live speech-to-text voice dictation into chat input',
      icon: <Mic className="w-4 h-4 text-rose-400" />,
      category: 'Tools',
    },
    {
      id: 'search',
      name: '/search',
      alias: '/find',
      description: 'Open in-chat search to search text, files, voice & starred',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'poll',
      name: '/poll',
      alias: '/vote',
      description: 'Create interactive real-time voting poll',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      category: 'Tools',
    },
    {
      id: 'starred',
      name: '/starred',
      alias: '/stars',
      description: 'View saved starred messages and bookmarks',
      icon: <Bookmark className="w-4 h-4 text-amber-400" />,
      category: 'Tools',
    },
    {
      id: 'appearance',
      name: '/appearance',
      alias: '/display',
      description: 'Customize chat font size, message density & shortcuts',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      category: 'Tools',
    },
    {
      id: 'qr',
      name: '/qr',
      alias: '/invite',
      description: 'Show shareable room QR invite code',
      icon: <QrCode className="w-4 h-4 text-emerald-400" />,
      category: 'Tools',
    },
    {
      id: 'diag',
      name: '/diag',
      alias: '/ping',
      description: 'Open network health, latency & diagnostics',
      icon: <Activity className="w-4 h-4 text-sky-400" />,
      category: 'Tools',
    },
    {
      id: 'shrug',
      name: '/shrug',
      alias: '',
      description: 'Insert ¯\\_(ツ)_/¯ into message',
      icon: <Smile className="w-4 h-4 text-amber-300" />,
      category: 'Text',
    },
    {
      id: 'tableflip',
      name: '/tableflip',
      alias: '/flip',
      description: 'Insert (╯°□°)╯︵ ┻━┻ into message',
      icon: <Smile className="w-4 h-4 text-rose-400" />,
      category: 'Text',
    },
    {
      id: 'unflip',
      name: '/unflip',
      alias: '',
      description: 'Insert ┬─┬ ノ( ゜-゜ノ) into message',
      icon: <Smile className="w-4 h-4 text-emerald-300" />,
      category: 'Text',
    },
    {
      id: 'lenny',
      name: '/lenny',
      alias: '',
      description: 'Insert ( ͡° ͜ʖ ͡°) into message',
      icon: <Smile className="w-4 h-4 text-purple-300" />,
      category: 'Text',
    },
    {
      id: 'roll',
      name: '/roll',
      alias: '/dice',
      description: 'Roll a random d6 / d20 die (e.g. 🎲 Rolled 6 [1-6])',
      icon: <Dices className="w-4 h-4 text-amber-400" />,
      category: 'Text',
    },
    {
      id: 'coin',
      name: '/coin',
      alias: '/flip',
      description: 'Flip a coin (🪙 Heads or Tails)',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      category: 'Text',
    },
    {
      id: 'clear',
      name: '/clear',
      alias: '',
      description: 'Clear visible chat messages for me on this device',
      icon: <Trash2 className="w-4 h-4 text-neutral-400" />,
      category: 'Actions',
    },
    {
      id: 'lock',
      name: '/lock',
      alias: '/privacy',
      description: 'Lock chat session immediately for privacy',
      icon: <Lock className="w-4 h-4 text-amber-400" />,
      category: 'Actions',
    },
    {
      id: 'shield',
      name: '/shield',
      alias: '/security',
      description: 'View active E2EE security audit & zero-knowledge shield',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      category: 'Tools',
    },
    {
      id: 'burn',
      name: '/burn',
      alias: '/destroy',
      description: 'Eradicate & burn room across all devices',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      category: 'Actions',
    },
  ];

  const searchClean = filter.trim().toLowerCase().replace(/^\//, '');

  const filteredCommands = commands.filter((cmd) => {
    if (!searchClean) return true;
    return (
      cmd.name.toLowerCase().includes(searchClean) ||
      cmd.alias.toLowerCase().includes(searchClean) ||
      cmd.description.toLowerCase().includes(searchClean)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  // Handle keyboard navigation when menu is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredCommands.length > 0) {
          e.preventDefault();
          const target = filteredCommands[selectedIndex];
          if (target) {
            onExecuteCommand(target as any);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onExecuteCommand, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={containerRef}
      id="slash-command-menu"
      className="absolute bottom-full mb-2 left-0 right-0 sm:right-auto sm:w-84 max-h-64 overflow-y-auto rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 scrollbar-thin"
    >
      <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-amber-400" />
          <span>Quick Commands</span>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 lowercase">
          navigate ↑↓ • Enter to select
        </span>
      </div>

      {filteredCommands.map((cmd, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={cmd.id}
            type="button"
            onClick={() => onExecuteCommand(cmd as any)}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
              isSelected ? 'bg-white/15 text-white' : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded-lg bg-black/40 border border-white/10 shrink-0">
                {cmd.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-neutral-100">
                    {cmd.name}
                  </span>
                  {cmd.alias && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      {cmd.alias}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {cmd.description}
                </p>
              </div>
            </div>
            <kbd className="hidden sm:inline-block text-[9px] font-mono text-neutral-400 px-1 py-0.5 rounded bg-black/50 border border-white/10 shrink-0">
              ↵
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
