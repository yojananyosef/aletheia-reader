import { TTSVoiceOption, Verse } from '@/types/bible';

class BibleTTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onVoicesLoadedCallbacks: Array<() => void> = [];
  private keepAliveInterval: NodeJS.Timeout | null = null;

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

  private startKeepAlive() {
    this.stopKeepAlive();
    // Previene que Chromium/WebKit pause la síntesis de voz en lecturas largas (>14s)
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
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
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!this.synth) {
      options.onError?.(new Error('SpeechSynthesis no está disponible en este navegador'));
      return;
    }

    // Cancel previous speech and stop keep-alive
    this.stopKeepAlive();
    this.synth.cancel();

    const cleanText = this.cleanTextForSpeech(verse.text);
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // Locución bíblica natural y fluida sin interrupciones de numeración
    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Pin utterance to window to prevent Chromium / Safari garbage collection bug
    if (typeof window !== 'undefined') {
      (window as any)._activeBibleUtterance = utterance;
    }

    utterance.rate = options.rate || 1.0;
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

    utterance.onstart = () => {
      this.startKeepAlive();
      options.onStart?.();
    };

    utterance.onend = () => {
      this.stopKeepAlive();
      this.currentUtterance = null;
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
      }
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.stopKeepAlive();
      this.currentUtterance = null;
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
      }
      // If manually canceled by user, don't trigger error
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      options.onError?.(e);
    };

    // Ensure synth is active
    if (this.synth.paused) {
      this.synth.resume();
    }
    this.synth.speak(utterance);
  }

  public pause() {
    this.stopKeepAlive();
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.startKeepAlive();
    }
  }

  public cancel() {
    this.stopKeepAlive();
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      if (typeof window !== 'undefined') {
        (window as any)._activeBibleUtterance = null;
      }
    }
  }
}

export const ttsService = new BibleTTSService();
