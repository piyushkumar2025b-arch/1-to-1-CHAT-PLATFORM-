export type MessageDensity = 'compact' | 'comfortable' | 'spacious';
export type FontSizePreference = 'small' | 'medium' | 'large';
export type TimeFormatPreference = '12h' | '24h';
export type SendKeyPreference = 'enter' | 'ctrl_enter';

export interface DisplaySettings {
  density: MessageDensity;
  fontSize: FontSizePreference;
  timeFormat: TimeFormatPreference;
  sendKey: SendKeyPreference;
  sendKeyPreference?: SendKeyPreference;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  density: 'comfortable',
  fontSize: 'medium',
  timeFormat: '12h',
  sendKey: 'enter',
  sendKeyPreference: 'enter',
};

const STORAGE_KEY = 'private_chat_display_settings';

export function getSavedDisplaySettings(): DisplaySettings {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DISPLAY_SETTINGS;
    const parsed = JSON.parse(raw);
    const resolvedSendKey: SendKeyPreference = ['enter', 'ctrl_enter'].includes(parsed.sendKey || parsed.sendKeyPreference)
      ? (parsed.sendKey || parsed.sendKeyPreference)
      : 'enter';
    return {
      density: ['compact', 'comfortable', 'spacious'].includes(parsed.density) ? parsed.density : 'comfortable',
      fontSize: ['small', 'medium', 'large'].includes(parsed.fontSize) ? parsed.fontSize : 'medium',
      timeFormat: ['12h', '24h'].includes(parsed.timeFormat) ? parsed.timeFormat : '12h',
      sendKey: resolvedSendKey,
      sendKeyPreference: resolvedSendKey,
    };
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export const getDisplaySettings = getSavedDisplaySettings;

export function saveDisplaySettings(settings: DisplaySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Fail silently in restricted sandbox
  }
}

export function formatTimeWithSetting(date: Date | string | number, format: TimeFormatPreference): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  });
}
