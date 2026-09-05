import { TTSVoiceOption, Verse, AVAILABLE_TRANSLATIONS, TranslationId } from '@/types/bible';
import EasySpeech from 'easy-speech';
import { speakWithPiper, SPANISH_VOICE as PIPER_VOICE, isPiperEngineReady, isPiperVoiceReady } from './piper-service';

// Safari/iOS rate correction factor: WebKit internally doubles/triples the rate
const SAFARI_RATE_FACTOR = 0.55;
const isSafari = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
})();

// GC pin: utterance must stay reachable or Chrome collects it mid-speech
declare global {
  interface Window {
    _activeBibleUtterance?: SpeechSynthesisUtterance | null;
  }
}

/** Opciones de speakVerse, reutilizadas por el fallback Piper */
export interface SpeakVerseOptions {
  voiceURI?: string | null;
  rate?: number;
  onStart?: () => void;
  onBoundary?: (charIndex: number, text: string) => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  bookName?: string;
  chapterNumber?: number;
  versionId?: TranslationId;
}

/** Error con código legible por UI (bloqueo de autoplay, fallo total, …) */
export interface TTSCodedError extends Error {
  code?: string;
  originalEvent?: unknown;
}

function ttsCodedError(message: string, code: string, originalEvent?: unknown): TTSCodedError {
  const err = new Error(message) as TTSCodedError;
  err.code = code;
  if (originalEvent !== undefined) err.originalEvent = originalEvent;
  return err;
}

/** Mensaje legible para cualquier throwable del pipeline TTS */
export function ttsErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'error' in err) return String((err as { error: unknown }).error);
  return String(err);
}

/** Código de error de EasySpeech/WebSpeech cuando el rechazo trae { error: 'canceled' | … } */
function speechRejectCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'error' in err) return String((err as { error: unknown }).error);
  return '';
}

// EasySpeech handles cross-browser quirks (voices async, cancel->speak race, GC pin)
// We also keep native fallbacks for boundary/mediaSession/wakeLock
const KEEPALIVE_INTERVAL_MS = 10_000;

class BibleTTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onVoicesLoadedCallbacks: Array<() => void> = [];
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private easyReady = false;
  private easyVoices: SpeechSynthesisVoice[] = [];
  private piperAudio: HTMLAudioElement | null = null;
  private piperAbort: AbortController | null = null;

  private onPrevVerseCallback: (() => void) | null = null;
  private onNextVerseCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoicesRobust();
      this.initEasySpeech();
    }
  }

  private initEasySpeech() {
    try {
      const det = EasySpeech.detect();
      if (!det.speechSynthesis || !det.speechSynthesisUtterance) return;
      EasySpeech.init({ maxTimeout: 5000, interval: 250 })
        .then(() => {
          this.easyReady = true;
          this.easyVoices = EasySpeech.voices() as unknown as SpeechSynthesisVoice[];
          if (this.easyVoices.length > 0) {
            this.voices = this.easyVoices;
            this.onVoicesLoadedCallbacks.forEach((cb) => cb());
          }
        })
        .catch(() => {
          // Fallback to native polling already running
        });
    } catch {
      // EasySpeech not available, native fallback will handle
    }
  }

  private initVoicesRobust() {
    if (!this.synth) return;

    let attempts = 0;
    const maxAttempts = 20; // 5000 / 250 like EasySpeech
    const interval = 250;

    const loadVoices = () => {
      if (!this.synth) return;
      const allVoices = this.synth.getVoices();
      if (allVoices.length > 0) {
        this.voices = allVoices;
        this.onVoicesLoadedCallbacks.forEach((cb) => cb());
        return;
      }
      if (attempts++ < maxAttempts) {
        setTimeout(loadVoices, interval);
      }
    };

    loadVoices();
    // Also hook onvoiceschanged for browsers that fire it (Chrome)
    try {
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    } catch {}
    // Also listen via addEventListener where available
    try {
      this.synth.addEventListener?.('voiceschanged', loadVoices);
    } catch {}
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public onVoicesLoaded(callback: () => void) {
    this.onVoicesLoadedCallbacks.push(callback);
    if (this.voices.length > 0) callback();
  }

  public getSpanishVoices(): TTSVoiceOption[] {
    // Prefer EasySpeech voices if available (more reliable cross-browser)
    const sourceVoices = this.easyReady && this.easyVoices.length > 0 ? this.easyVoices : this.voices;
    if (sourceVoices.length === 0) {
      // Try fresh fetch (Chrome Linux may populate late)
      if (this.synth) {
        const fresh = this.synth.getVoices();
        if (fresh.length > 0) {
          this.voices = fresh;
          return this.getSpanishVoices();
        }
      }
      return [];
    }

    const spanish = sourceVoices.filter((v) => v.lang.toLowerCase().startsWith('es'));
    const sourceList = spanish.length > 0 ? spanish : sourceVoices;

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

  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/\[\s*[\d*†‡a-zA-Z]+\s*\]/g, '')
      .replace(/\(\s*[\d*†‡a-zA-Z]+\s*\)/g, '')
      .replace(/[«»"]/g, '')
      .replace(/—/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private correctRate(rate: number): number {
    return isSafari ? rate * SAFARI_RATE_FACTOR : rate;
  }

  private startKeepalive() {
    this.stopKeepalive();
    this.keepaliveTimer = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        try {
          this.synth.resume();
        } catch {}
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

  private updateMediaSession(verse: Verse, bookName?: string, chapterNumber?: number, versionId?: TranslationId) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const verseLabel = bookName && chapterNumber ? `${bookName} ${chapterNumber}:${verse.number}` : `Versículo ${verse.number}`;
    const album = (versionId && AVAILABLE_TRANSLATIONS[versionId]?.name) || 'Aletheia Reader';
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: verseLabel,
        artist: 'Aletheia Reader',
        album,
      });
      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.onPrevVerseCallback?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.onNextVerseCallback?.());
    } catch {}
  }

  public setMediaSessionCallbacks(onPrev: () => void, onNext: () => void) {
    this.onPrevVerseCallback = onPrev;
    this.onNextVerseCallback = onNext;
  }

  public async speakVerse(verse: Verse, options: SpeakVerseOptions) {
    if (!this.synth) {
      options.onError?.(new Error('SpeechSynthesis no está disponible en este navegador'));
      return;
    }

    // Ensure voices are loaded — poll like EasySpeech if needed
    if (this.voices.length === 0) {
      // Try EasySpeech voices
      if (this.easyReady && this.easyVoices.length > 0) {
        this.voices = this.easyVoices;
      } else {
        const fresh = this.synth.getVoices();
        if (fresh.length > 0) {
          this.voices = fresh;
          this.onVoicesLoadedCallbacks.forEach((cb) => cb());
        }
      }
    }

    const cleanText = this.cleanTextForSpeech(verse.text);
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // No early-return for empty pool — try with default voice (some browsers synthesize even if getVoices() === [])
    // Only warn, don't block English fallback as user requested

    // Chrome quirk: cancel pending speech before speak (prevents synthesis-failed).
    // Only wait when something is actually queued; poll for idle with a cap
    // instead of a fixed 80ms sleep on every verse.
    try {
      if (this.synth.speaking || this.synth.pending) {
        this.synth.cancel();
        const start = Date.now();
        while ((this.synth.speaking || this.synth.pending) && Date.now() - start < 150) {
          await new Promise((r) => setTimeout(r, 10));
        }
      } else {
        this.synth.cancel();
      }
    } catch {}

    // If paused, resume first (Chrome Android)
    try {
      if (this.synth.paused) this.synth.resume();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    if (typeof window !== 'undefined') {
      window._activeBibleUtterance = utterance;
    }

    const requestedRate = options.rate || 1.0;
    utterance.rate = this.correctRate(requestedRate);
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'es-ES';

    // Voice selection: prefer explicit voiceURI, else best Spanish Google/Natural
    const pool = this.easyReady && this.easyVoices.length > 0 ? this.easyVoices : this.voices;
    if (options.voiceURI) {
      const selected = pool.find((v) => v.voiceURI === options.voiceURI);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      }
    } else {
      const preferred =
        pool.find(
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
        ) || pool.find((v) => v.lang.toLowerCase().startsWith('es'));
      if (preferred) {
        utterance.voice = preferred;
        utterance.lang = preferred.lang;
      } else {
        // Solo español: no fallback a inglés. Dejar lang es-ES para que falle y caiga a Kokoro español.
        // No asignar pool[0] si es en
      }
    }

    let hasStarted = false;
    let hasEnded = false;

    utterance.onstart = () => {
      hasStarted = true;
      this.updateMediaSession(verse, options.bookName, options.chapterNumber, options.versionId);
      options.onStart?.();
    };

    if (options.onBoundary) {
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.charIndex !== undefined) options.onBoundary?.(e.charIndex, cleanText);
      };
    }

    utterance.onend = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        window._activeBibleUtterance = null;
        try {
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        } catch {}
      }
      if (!hasStarted && cleanText.length > 5) {
        console.warn('TTS onend fired before onstart, ignoring phantom cascade');
        return;
      }
      options.onEnd?.();
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (hasEnded) return;
      if (!hasStarted && e.error === 'synthesis-failed' && cleanText.length > 0) {
        this.currentUtterance = null;
        this.stopKeepalive();
        this.tryPiperFallback(cleanText, options);
        hasEnded = true;
        return;
      }
      hasEnded = true;
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        window._activeBibleUtterance = null;
        try {
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        } catch {}
      }
      if (e.error === 'canceled' || e.error === 'interrupted') return;

      if (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable' || e.error === 'not-allowed' || e.error === 'language-unavailable' || e.error === 'voice-unavailable') {
        const hasVoices = pool.length > 0;
        const hasSpanish = pool.some((v) => v.lang.toLowerCase().startsWith('es'));
        if (!hasVoices) {
          console.warn('TTS Web Speech sin voces, probando Piper español...');
          this.tryPiperFallback(cleanText, options);
          hasEnded = true;
          return;
        } else if (!hasSpanish) {
          console.warn(`TTS: synthesis failed (${e.error}) sin voz es-ES, usando Piper español.`);
          this.tryPiperFallback(cleanText, options);
          hasEnded = true;
          return;
        }
        if (e.error === 'not-allowed') {
          options.onError?.(
            ttsCodedError('El navegador bloqueó el audio (requiere interacción). Pulsa de nuevo 🔊.', 'not-allowed', e)
          );
          return;
        }
        if (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable') {
          this.tryPiperFallback(cleanText, options);
          hasEnded = true;
          return;
        }
      }
      options.onError?.(e);
    };

    // Ensure resume before speak (Chrome resume quirk)
    try {
      if (this.synth.paused) this.synth.resume();
    } catch {}

    // Use EasySpeech.speak if ready — it handles chunking and cross-browser quirks better
    if (this.easyReady) {
      try {
        await EasySpeech.speak({
          text: cleanText,
          voice: utterance.voice ?? undefined,
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume,
          boundary: options.onBoundary ? (e) => options.onBoundary?.(e.charIndex, cleanText) : undefined,
        });
        // EasySpeech resolves on end — trigger our handlers
        if (!hasEnded) {
          hasEnded = true;
          this.stopKeepalive();
          options.onEnd?.();
        }
        return;
      } catch (err: unknown) {
        // Fallback to native if EasySpeech fails
        const code = speechRejectCode(err);
        if (code === 'canceled' || code === 'interrupted') return;
      }
    }

    try {
      this.synth.speak(utterance);
      this.startKeepalive();
      try {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      } catch {}
      // Safety: if no onstart/onerror within 3s, try Piper español before failing
      setTimeout(() => {
        if (!hasStarted && !hasEnded) {
          hasEnded = true;
          this.currentUtterance = null;
          this.stopKeepalive();
          console.warn('TTS Web Speech timeout 3s, probando Piper español...');
          this.tryPiperFallback(cleanText, options);
        }
      }, 3000);
    } catch {
      this.tryPiperFallback(cleanText, options);
    }
  }

  private async tryPiperFallback(cleanText: string, options: SpeakVerseOptions) {
    // Fallback único: Piper español rhasspy/piper-voices es_ES-sharvard-medium (solo español)
    const needsLoading = !isPiperEngineReady() || !isPiperVoiceReady();
    if (needsLoading && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kokoro-loading', { detail: true }));
    if (this.piperAudio) {
      try { this.piperAudio.pause(); } catch {}
      this.piperAudio = null;
    }
    if (this.piperAbort) {
      try { this.piperAbort.abort(); } catch {}
    }
    // Referencia local: cancel() puede null-ear this.piperAbort mientras generamos
    const abort = new AbortController();
    this.piperAbort = abort;
    const stopLoading = () => {
      if (needsLoading && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kokoro-loading', { detail: false }));
    };
    try {
      const audio = await speakWithPiper(cleanText, {
        voice: PIPER_VOICE,
        rate: options.rate ?? 1.0,
        onStart: () => {
          stopLoading();
          options.onStart?.();
        },
        onEnd: () => {
          stopLoading();
          options.onEnd?.();
        },
        onError: (e) => {
          stopLoading();
          console.warn('Piper onError:', e);
        },
        signal: abort.signal,
      });
      if (audio) {
        // cancel() llegó durante el generate: no resucitar el audio
        if (abort.signal.aborted) return;
        this.piperAudio = audio;
        stopLoading();
        return;
      }
      stopLoading();
      // Cancelación intencional (pausa/stop): silencio, sin error falso
      if (abort.signal.aborted) return;
    } catch (e) {
      stopLoading();
      if (abort.signal.aborted) return;
      console.warn('Piper fallback falló:', e);
    }
    setTimeout(
      () => options.onError?.(ttsCodedError('TTS no disponible. Web Speech falló y Piper español no pudo sintetizar. Verifica conexión.', 'all-failed')),
      100
    );
  }

  public pause() {
    if (this.piperAudio && !this.piperAudio.paused && this.piperAudio.readyState >= 2) {
      try { this.piperAudio.pause(); } catch {}
    }
    if (this.synth && this.synth.speaking) {
      try {
        this.synth.pause();
      } catch {}
      this.stopKeepalive();
      try {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
  }

  public resume() {
    if (this.piperAudio && this.piperAudio.paused) {
      try { this.piperAudio.play()?.catch(() => {}); } catch {}
      return;
    }
    // meSpeak no soporta resume real — re-speak se maneja en el reader
    if (this.synth && this.synth.paused) {
      try {
        this.synth.resume();
      } catch {}
      this.startKeepalive();
      try {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      } catch {}
    }
  }

  public cancel() {
    if (this.piperAbort) {
      try {
        this.piperAbort.abort();
      } catch {}
      this.piperAbort = null;
    }
    if (this.piperAudio) {
      try {
        if (this.piperAudio.readyState >= 2 && !this.piperAudio.paused) this.piperAudio.pause();
      } catch {}
      try { this.piperAudio.src = ''; } catch {}
      this.piperAudio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.currentUtterance = null;
      this.stopKeepalive();
      if (typeof window !== 'undefined') {
        window._activeBibleUtterance = null;
        try {
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
          }
        } catch {}
      }
    }
  }
}

export const ttsService = new BibleTTSService();
