import { TTSVoiceOption, Verse } from '@/types/bible';

// Safari/iOS rate correction factor: WebKit internally doubles/triples the rate
// so we divide by ~1.8 to get natural-sounding output.
const SAFARI_RATE_FACTOR = 0.55;
const isSafari = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Safari explicitly says "Safari" but NOT "Chrome" and NOT "Android"
  // Android Chrome has WebKit/Mobile but is NOT Safari
  return /^((?!chrome|android).)*safari/i.test(ua);
})();

// Android keepalive interval: reanuda el synth cada 10s para evitar que Chrome lo pause
const KEEPALIVE_INTERVAL_MS = 10_000;

class BibleTTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onVoicesLoadedCallbacks: Array<() => void> = [];
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  // Callbacks for prev/next verse (used by Media Session)
  private onPrevVerseCallback: (() => void) | null = null;
  private onNextVerseCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      if (!this.synth) return;
      const allVoices = this.synth.getVoices();
      if (allVoices.length > 0) {
        this.voices = allVoices;
        this.onVoicesLoadedCallbacks.forEach((cb) => cb());
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public onVoicesLoaded(callback: () => void) {
    this.onVoicesLoadedCallbacks.push(callback);
    if (this.voices.length > 0) {
      callback();
    }
  }

  /**
   * Obtiene la lista de voces en español disponibles en el navegador/sistema (Deduplicadas)
   */
  public getSpanishVoices(): TTSVoiceOption[] {
    if (!this.voices || this.voices.length === 0) {
      if (this.synth) {
        this.voices = this.synth.getVoices();
      }
    }

    // Filter Spanish voices first, or fallback to system voices
    const spanish = this.voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
    const sourceList = spanish.length > 0 ? spanish : this.voices;

    // Deduplicate voices by voiceURI, name and lang to prevent React duplicate key warnings
    const seen = new Set<string>();
    const uniqueVoices: TTSVoiceOption[] = [];

    for (const v of sourceList) {
      const key = `${v.voiceURI || v.name}::${v.lang}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueVoices.push({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
          default: v.default,
        });
      }
    }

    return uniqueVoices;
  }

  /**
   * Limpia el texto de notas al pie y caracteres especiales para una locución bíblica natural
   */
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/\[\s*[\d*†‡a-zA-Z]+\s*\]/g, '') // Elimina indicadores de notas al pie [1], [*]
      .replace(/\(\s*[\d*†‡a-zA-Z]+\s*\)/g, '')
      .replace(/[«»"]/g, '') // Elimina comillas latinas
      .replace(/—/g, ', ') // Convierte rayas en pausas naturales
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Apply Safari/iOS rate correction to compensate for WebKit bug
   */
  private correctRate(rate: number): number {
    return isSafari ? rate * SAFARI_RATE_FACTOR : rate;
  }

  // --- Keepalive Heartbeat (Android Chrome) ---

  private startKeepalive() {
    this.stopKeepalive();
    this.keepaliveTimer = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.resume();
      } else {
        this.stopKeepalive();
      }
    }, KEEPALIVE_INTERVAL_MS);
  }

  private stopKeepalive() {
    if (this.keepaliveTimer !== null) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  // --- Media Session ---

  private updateMediaSession(verse: Verse, bookName?: string, chapterNumber?: number) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const verseLabel = bookName && chapterNumber
      ? `${bookName} ${chapterNumber}:${verse.number}`
      : `Versículo ${verse.number}`;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: verseLabel,
      artist: 'Alethia Reader',
      album: 'Nueva Biblia Viva',
    });

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      this.onPrevVerseCallback?.();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      this.onNextVerseCallback?.();
    });
  }

  public setMediaSessionCallbacks(onPrev: () => void, onNext: () => void) {
    this.onPrevVerseCallback = onPrev;
    this.onNextVerseCallback = onNext;
  }

  /**
   * Sintetiza la voz para un versículo específico de forma fluida y sincronizada
   */
  public speakVerse(
    verse: Verse,
    options: {
      voiceURI?: string | null;
      rate?: number;
      onStart?: () => void;
      onBoundary?: (charIndex: number, text: string) => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      bookName?: string;
      chapterNumber?: number;
    }
  ) {
    if (!this.synth) {
      options.onError?.(new Error('SpeechSynthesis no está disponible en este navegador'));
      return;
    }

    const cleanText = this.cleanTextForSpeech(verse.text);
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // Clean up any previous speech state before starting
    try {
      this.synth.cancel();
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Pin utterance to window to prevent Chromium / Safari garbage collection bug
    if (typeof window !== 'undefined') {
      (window as any)._activeBibleUtterance = utterance;
    }

    // Apply Safari rate correction
    const requestedRate = options.rate || 1.0;
    utterance.rate = this.correctRate(requestedRate);
    utterance.pitch = 1.0;
    utterance.lang = 'es-ES';

    // Match selected voice if provided
    if (options.voiceURI) {
      const selected = this.voices.find((v) => v.voiceURI === options.voiceURI);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      }
    } else {
      // Default to best natural Spanish voice
      const preferred = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('es') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Neural') ||
            v.name.includes('Sabina') ||
            v.name.includes('Helena') ||
            v.name.includes('Jorge') ||
            v.name.includes('Mónica') ||
            v.name.includes('Paulina'))
      ) || this.voices.find((v) => v.lang.toLowerCase().startsWith('es'));

      if (preferred) {
        utterance.voice = preferred;
        utterance.lang = preferred.lang;
      }
    }

    let hasStarted = false;
    let hasEnded = false;
    let startTime = 0;

    utterance.onstart = () => {
      hasStarted = true;
      startTime = Date.now();
      // Update Media Session with verse info
      this.updateMediaSession(verse, options.bookName, options.chapterNumber);
      options.onStart?.();
    };

    if (options.onBoundary) {
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.charIndex !== undefined) {
          options.onBoundary?.(e.charIndex, cleanText);
        }
      };
    }

    utterance.onend = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none';
        }
      }

      // Phantom onend guard: if onend fires before onstart or in < 50ms for real text, ignore phantom loop
      if (!hasStarted && cleanText.length > 5) {
        console.warn('TTS onend fired before onstart, ignoring phantom cascade');
        return;
      }

      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (hasEnded) return;
      hasEnded = true;
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none';
        }
      }
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      options.onError?.(e);
    };

    // Ensure synth is active before speaking
    if (this.synth.paused) {
      this.synth.resume();
    }

    try {
      this.synth.speak(utterance);
      this.startKeepalive();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } catch (err) {
      options.onError?.(err);
    }
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
      this.stopKeepalive();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.startKeepalive();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    }
  }

  public cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none';
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
        }
      }
    }
  }
}

export const ttsService = new BibleTTSService();
