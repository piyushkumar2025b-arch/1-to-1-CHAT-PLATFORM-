/**
 * Client-side Text-To-Speech (TTS) helper using Web Speech API.
 * 100% private, client-side, zero network calls or server dependencies.
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentSpeakingMessageId: string | null = null;
let listeners: Array<(speakingId: string | null) => void> = [];

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function subscribeSpeechStatus(callback: (speakingId: string | null) => void): () => void {
  listeners.push(callback);
  callback(currentSpeakingMessageId);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => cb(currentSpeakingMessageId));
}

/**
 * Strips markdown tags, code block wrappers, and URLs so speech sounds natural.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, ' web link ')
    .replace(/[*_~#>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakMessage(messageId: string, text: string): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  const synth = window.speechSynthesis;

  // If already speaking this message, toggle stop
  if (currentSpeakingMessageId === messageId) {
    stopSpeaking();
    return false;
  }

  // Cancel any active speech
  stopSpeaking();

  const clean = cleanTextForSpeech(text);
  if (!clean) return false;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Pick a pleasant natural voice if available
  const voices = synth.getVoices();
  if (voices && voices.length > 0) {
    const preferred = voices.find(
      (v) => (v.lang.startsWith('en') || v.lang.startsWith(navigator.language)) && !v.name.includes('Google')
    ) || voices[0];
    if (preferred) utterance.voice = preferred;
  }

  utterance.onstart = () => {
    currentSpeakingMessageId = messageId;
    notifyListeners();
  };

  utterance.onend = () => {
    currentSpeakingMessageId = null;
    activeUtterance = null;
    notifyListeners();
  };

  utterance.onerror = () => {
    currentSpeakingMessageId = null;
    activeUtterance = null;
    notifyListeners();
  };

  activeUtterance = utterance;
  synth.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
  currentSpeakingMessageId = null;
  activeUtterance = null;
  notifyListeners();
}
