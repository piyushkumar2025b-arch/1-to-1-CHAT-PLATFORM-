/**
 * Client-Side Zero-Knowledge Speech Recognition & Voice Dictation
 * Utilizes the browser's native Web Speech API (zero external third-party servers).
 */

type SpeechRecognitionInstance = any;

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let activeRecognition: SpeechRecognitionInstance | null = null;
let isCurrentlyListening = false;

/**
 * Checks if browser supports native Web Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Starts real-time voice speech recognition
 */
export function startSpeechRecognition(options: SpeechRecognitionOptions): boolean {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('Speech recognition is not supported in this browser.');
    return false;
  }

  // If already listening, stop previous session first
  stopSpeechRecognition();

  try {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

    recognition.onstart = () => {
      isCurrentlyListening = true;
      options.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        options.onResult(finalTranscript, true);
      } else if (interimTranscript) {
        options.onResult(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied for voice dictation.';
      } else if (event.error === 'no-speech') {
        // No speech detected, ignore or silently restart
        return;
      } else if (event.error === 'network') {
        errorMessage = 'Network connection issue for speech recognition.';
      }
      options.onError?.(errorMessage);
    };

    recognition.onend = () => {
      isCurrentlyListening = false;
      activeRecognition = null;
      options.onEnd?.();
    };

    activeRecognition = recognition;
    recognition.start();
    return true;
  } catch (err: any) {
    console.warn('Failed to start speech recognition:', err);
    options.onError?.(err?.message || 'Could not start voice dictation');
    isCurrentlyListening = false;
    activeRecognition = null;
    return false;
  }
}

/**
 * Stops active speech recognition
 */
export function stopSpeechRecognition(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      try {
        activeRecognition.abort();
      } catch (err) {}
    }
    activeRecognition = null;
  }
  isCurrentlyListening = false;
}

export function getIsSpeechListening(): boolean {
  return isCurrentlyListening;
}
