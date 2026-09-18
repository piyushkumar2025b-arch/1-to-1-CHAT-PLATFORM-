import { useState, ChangeEvent } from 'react';
import { X, Check, Image as ImageIcon, Sparkles, Sliders, Trash2, AlertCircle } from 'lucide-react';
import { ChatTheme } from '../types';
import { PRESET_THEMES, saveThemeSelection } from '../lib/themes';

interface ThemeSelectorModalProps {
  currentTheme: ChatTheme;
  onSelectTheme: (theme: ChatTheme) => void;
  onClose: () => void;
}

const ACCENT_OPTIONS = ['#f59e0b', '#06b6d4', '#f43f5e', '#10b981', '#38bdf8', '#a855f7', '#ef4444', '#ffffff'];

export default function ThemeSelectorModal({
  currentTheme,
  onSelectTheme,
  onClose,
}: ThemeSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(currentTheme.customBgUrl || '');
  const [customDim, setCustomDim] = useState<number>(currentTheme.customDim ?? 50);
  const [customAccent, setCustomAccent] = useState<string>(currentTheme.accentColor || '#f59e0b');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleApplyPreset = (theme: ChatTheme) => {
    onSelectTheme(theme);
    saveThemeSelection(theme);
  };

  const handleCustomPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (e.g. JPG, PNG, WebP).');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomPhotoUrl(result);
        const updatedCustomTheme: ChatTheme = {
          id: 'custom',
          name: 'Custom Wallpaper',
          type: 'custom',
          accentColor: customAccent,
          bgStyle: 'bg-neutral-950 text-neutral-100',
          headerStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
          inputStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
          myBubbleStyle: 'bg-neutral-100 text-neutral-950 font-medium shadow-md',
          peerBubbleStyle: 'bg-neutral-900/90 backdrop-blur-md text-neutral-100 border border-neutral-700/60 shadow-md',
          previewColor: 'from-neutral-900 to-neutral-950 border-amber-400',
          customBgUrl: result,
          customDim,
        };
        onSelectTheme(updatedCustomTheme);
        saveThemeSelection(updatedCustomTheme);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCustomSettings = (dim: number, accent: string) => {
    setCustomDim(dim);
    setCustomAccent(accent);
    if (customPhotoUrl) {
      const updatedCustomTheme: ChatTheme = {
        id: 'custom',
        name: 'Custom Wallpaper',
        type: 'custom',
        accentColor: accent,
        bgStyle: 'bg-neutral-950 text-neutral-100',
        headerStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
        inputStyle: 'bg-neutral-900/80 backdrop-blur-md border-neutral-800/80 text-neutral-100',
        myBubbleStyle: 'bg-neutral-100 text-neutral-950 font-medium shadow-md',
        peerBubbleStyle: 'bg-neutral-900/90 backdrop-blur-md text-neutral-100 border border-neutral-700/60 shadow-md',
        previewColor: 'from-neutral-900 to-neutral-950 border-amber-400',
        customBgUrl: customPhotoUrl,
        customDim: dim,
      };
      onSelectTheme(updatedCustomTheme);
      saveThemeSelection(updatedCustomTheme);
    }
  };

  const handleRemoveCustomPhoto = () => {
    setCustomPhotoUrl('');
    handleApplyPreset(PRESET_THEMES[0]);
  };

  return (
    <div
      id="theme-selector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 text-neutral-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold uppercase tracking-wider">Chat Themes & Wallpaper</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Vibrant Presets ({PRESET_THEMES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload My Wallpaper</span>
          </button>
        </div>

        {/* Tab 1: Presets Grid */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {PRESET_THEMES.map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleApplyPreset(theme)}
                  className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 bg-gradient-to-br ${theme.previewColor} ${
                    isSelected
                      ? 'border-white ring-2 ring-white/30 shadow-lg scale-[1.02]'
                      : 'hover:border-neutral-500/80 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      style={{ backgroundColor: theme.accentColor }}
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                    />
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-white tracking-wide truncate drop-shadow-sm">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Custom Photo Upload & Sliders */}
        {activeTab === 'custom' && (
          <div className="space-y-4 pt-1">
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {/* Upload Area */}
            <label className="border-2 border-dashed border-neutral-700 hover:border-amber-500/80 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors bg-neutral-950/50 group">
              <ImageIcon className="w-8 h-8 text-neutral-400 group-hover:text-amber-400 transition-colors" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-200">
                  {customPhotoUrl ? 'Change Background Photo' : 'Upload Any Wallpaper or Photo'}
                </span>
                <p className="text-[11px] text-neutral-500">Supports JPG, PNG, WebP, GIF</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomPhotoUpload}
                className="hidden"
              />
            </label>

            {customPhotoUrl && (
              <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                {/* Photo Preview Thumbnail */}
                <div className="relative h-28 rounded-lg overflow-hidden border border-neutral-700">
                  <img
                    src={customPhotoUrl}
                    alt="Custom theme background"
                    className="w-full h-full object-cover"
                  />
                  <div
                    style={{ backgroundColor: `rgba(0, 0, 0, ${customDim / 100})` }}
                    className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/90"
                  >
                    <span>Readability Dimming: {customDim}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomPhoto}
                    title="Remove custom photo"
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dimming Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                      Background Darkness / Dimming
                    </span>
                    <span className="font-mono text-amber-400 font-semibold">{customDim}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={customDim}
                    onChange={(e) => handleUpdateCustomSettings(parseInt(e.target.value, 10), customAccent)}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Higher dimming ensures message text is always crystal clear to read over bright photos.
                  </p>
                </div>

                {/* Accent Color Picker for Custom Theme */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-300 block">Accent Color</label>
                  <div className="flex items-center gap-2">
                    {ACCENT_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleUpdateCustomSettings(customDim, color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          customAccent === color ? 'scale-115 ring-2 ring-white' : 'hover:scale-105'
                        }`}
                      >
                        {customAccent === color && (
                          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
