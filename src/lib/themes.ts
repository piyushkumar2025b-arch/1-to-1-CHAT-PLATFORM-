import { ChatTheme } from '../types';

export const PRESET_THEMES: ChatTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Amber',
    type: 'preset',
    accentColor: '#f59e0b',
    bgStyle: 'bg-neutral-950 text-neutral-100',
    headerStyle: 'bg-neutral-900/90 border-neutral-800 text-neutral-100',
    inputStyle: 'bg-neutral-900/90 border-neutral-800 text-neutral-100',
    myBubbleStyle: 'bg-neutral-100 text-neutral-950 font-medium',
    peerBubbleStyle: 'bg-neutral-900 text-neutral-100 border border-neutral-800',
    previewColor: 'from-neutral-950 via-neutral-900 to-amber-950 border-amber-500/40',
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    type: 'preset',
    accentColor: '#06b6d4',
    bgStyle: 'bg-[#0a0a16] text-neutral-100',
    headerStyle: 'bg-[#121226]/90 border-cyan-900/50 text-cyan-200',
    inputStyle: 'bg-[#121226]/90 border-cyan-900/50 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-cyan-900/40 shadow-lg',
    peerBubbleStyle: 'bg-[#181832] text-neutral-100 border border-cyan-900/40',
    previewColor: 'from-[#0a0a16] via-[#121226] to-cyan-950 border-cyan-400/60',
  },
  {
    id: 'sunset',
    name: 'Sunset Horizon',
    type: 'preset',
    accentColor: '#f43f5e',
    bgStyle: 'bg-[#140b17] text-neutral-100',
    headerStyle: 'bg-[#211225]/90 border-rose-950 text-rose-200',
    inputStyle: 'bg-[#211225]/90 border-rose-950 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white font-medium shadow-rose-950 shadow-md',
    peerBubbleStyle: 'bg-[#28152e] text-neutral-100 border border-rose-900/30',
    previewColor: 'from-[#140b17] via-[#28152e] to-rose-950 border-rose-500/50',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    type: 'preset',
    accentColor: '#10b981',
    bgStyle: 'bg-[#06140e] text-neutral-100',
    headerStyle: 'bg-[#0c2219]/90 border-emerald-950 text-emerald-300',
    inputStyle: 'bg-[#0c2219]/90 border-emerald-950 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-emerald-950 shadow-md',
    peerBubbleStyle: 'bg-[#102d21] text-neutral-100 border border-emerald-900/40',
    previewColor: 'from-[#06140e] via-[#0c2219] to-emerald-950 border-emerald-500/50',
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    type: 'preset',
    accentColor: '#38bdf8',
    bgStyle: 'bg-[#061325] text-neutral-100',
    headerStyle: 'bg-[#0b1f3b]/90 border-sky-950 text-sky-300',
    inputStyle: 'bg-[#0b1f3b]/90 border-sky-950 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium shadow-sky-950 shadow-md',
    peerBubbleStyle: 'bg-[#0f294e] text-neutral-100 border border-sky-900/40',
    previewColor: 'from-[#061325] via-[#0b1f3b] to-sky-950 border-sky-500/50',
  },
  {
    id: 'amethyst',
    name: 'Cosmic Violet',
    type: 'preset',
    accentColor: '#a855f7',
    bgStyle: 'bg-[#11071f] text-neutral-100',
    headerStyle: 'bg-[#1d0d33]/90 border-purple-950 text-purple-300',
    inputStyle: 'bg-[#1d0d33]/90 border-purple-950 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium shadow-purple-950 shadow-md',
    peerBubbleStyle: 'bg-[#251142] text-neutral-100 border border-purple-900/40',
    previewColor: 'from-[#11071f] via-[#1d0d33] to-purple-950 border-purple-500/50',
  },
  {
    id: 'crimson',
    name: 'Crimson Velvet',
    type: 'preset',
    accentColor: '#ef4444',
    bgStyle: 'bg-[#1a0808] text-neutral-100',
    headerStyle: 'bg-[#290d0d]/90 border-red-950 text-red-300',
    inputStyle: 'bg-[#290d0d]/90 border-red-950 text-neutral-100',
    myBubbleStyle: 'bg-gradient-to-r from-red-600 to-rose-700 text-white font-medium shadow-red-950 shadow-md',
    peerBubbleStyle: 'bg-[#331212] text-neutral-100 border border-red-900/40',
    previewColor: 'from-[#1a0808] via-[#290d0d] to-red-950 border-red-500/50',
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    type: 'preset',
    accentColor: '#94a3b8',
    bgStyle: 'bg-slate-950 text-slate-100',
    headerStyle: 'bg-slate-900/90 border-slate-800 text-slate-200',
    inputStyle: 'bg-slate-900/90 border-slate-800 text-slate-100',
    myBubbleStyle: 'bg-slate-100 text-slate-950 font-medium shadow-sm',
    peerBubbleStyle: 'bg-slate-900 text-slate-100 border border-slate-800',
    previewColor: 'from-slate-950 via-slate-900 to-slate-800 border-slate-400/40',
  },
  {
    id: 'light',
    name: 'Clean Studio',
    type: 'preset',
    accentColor: '#4f46e5',
    bgStyle: 'bg-stone-100 text-stone-900',
    headerStyle: 'bg-white/90 border-stone-200 text-stone-900 shadow-xs',
    inputStyle: 'bg-white/90 border-stone-300 text-stone-900',
    myBubbleStyle: 'bg-indigo-600 text-white font-medium shadow-sm',
    peerBubbleStyle: 'bg-white text-stone-900 border border-stone-200 shadow-xs',
    previewColor: 'from-stone-100 via-stone-200 to-indigo-100 border-indigo-400/40',
  },
];

export const DEFAULT_THEME = PRESET_THEMES[0];

const STORAGE_KEY = 'chat_selected_theme_id';
const CUSTOM_BG_KEY = 'chat_custom_theme_bg';
const CUSTOM_DIM_KEY = 'chat_custom_theme_dim';
const CUSTOM_ACCENT_KEY = 'chat_custom_theme_accent';

export function getSavedTheme(): ChatTheme {
  try {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId === 'custom') {
      const customBg = localStorage.getItem(CUSTOM_BG_KEY) || '';
      const customDim = parseInt(localStorage.getItem(CUSTOM_DIM_KEY) || '50', 10);
      const customAccent = localStorage.getItem(CUSTOM_ACCENT_KEY) || '#f59e0b';
      return {
        id: 'custom',
        name: 'Custom Photo',
        type: 'custom',
        accentColor: customAccent,
        bgStyle: 'bg-neutral-950 text-neutral-100',
        headerStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
        inputStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
        myBubbleStyle: 'bg-neutral-100 text-neutral-950 font-medium shadow-md',
        peerBubbleStyle: 'bg-neutral-900/90 backdrop-blur-md text-neutral-100 border border-neutral-700/60 shadow-md',
        previewColor: 'from-neutral-900 to-neutral-950 border-amber-400',
        customBgUrl: customBg,
        customDim: isNaN(customDim) ? 50 : customDim,
      };
    }
    const found = PRESET_THEMES.find((t) => t.id === savedId);
    if (found) return found;
  } catch (err) {
    console.warn('Error reading saved theme:', err);
  }
  return DEFAULT_THEME;
}

export function saveThemeSelection(theme: ChatTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
    if (theme.type === 'custom') {
      if (theme.customBgUrl) localStorage.setItem(CUSTOM_BG_KEY, theme.customBgUrl);
      if (theme.customDim !== undefined) localStorage.setItem(CUSTOM_DIM_KEY, String(theme.customDim));
      if (theme.accentColor) localStorage.setItem(CUSTOM_ACCENT_KEY, theme.accentColor);
    }
  } catch (err) {
    console.warn('Error saving theme:', err);
  }
}
