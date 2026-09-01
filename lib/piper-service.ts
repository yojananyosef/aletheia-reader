'use client';

/**
 * Piper WASM español — solo español, rhasspy/piper-voices
 * Voces es_ES: sharvard-medium (recomendada), davefx-medium, carlfm-x_low
 * https://huggingface.co/rhasspy/piper-voices
 * Usa piper-tts-web (onnxruntime-web + piper_phonemize.wasm) 100% local
 * Peso voz ~60MB onnx, phonemizer ~18MB data, cacheado
 */

let piperEngine: any | null = null;
let loadingPromise: Promise<any> | null = null;
let isLoading = false;

export const SPANISH_VOICE = 'es_ES-sharvard-medium';
export const FALLBACK_SPANISH_VOICE = 'es_ES-davefx-medium';

function setLoading(v: boolean) {
  isLoading = v;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kokoro-loading', { detail: v }));
    // Reusamos mismo evento para no cambiar UI
    window.dispatchEvent(new CustomEvent('piper-loading', { detail: v }));
  }
}

export function isPiperLoading(): boolean {
  return isLoading;
}

export function onPiperProgress(_cb: (pct: number) => void) {}

async function getPiperEngine(): Promise<any> {
  if (piperEngine) return piperEngine;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // No setLoading aquí — el loading lo controla tryPiperFallback hasta que suene
    const mod: any = await import('piper-tts-web');

    // Usar Worker Engine para no bloquear hilo principal (fix UI pesada al pausar)
    // Worker + numThreads:1 evita warning crossOriginIsolated y fallback single-thread
    const WorkerEngine = (mod as any).PiperWebWorkerEngine;
    const OnnxWorkerRuntime = (mod as any).OnnxWebWorkerRuntime;
    const PhonemizeWorkerRuntime = (mod as any).PhonemizeWebWorkerRuntime;

    let engine: any;
    if (WorkerEngine && OnnxWorkerRuntime && PhonemizeWorkerRuntime) {
      try {
        engine = new WorkerEngine({
          onnxRuntime: new OnnxWorkerRuntime({ basePath: '/onnx/', numThreads: 1 }),
          phonemizeRuntime: new PhonemizeWorkerRuntime({ basePath: '/piper/' }),
        });
      } catch (e) {
        console.warn('Piper worker engine falló, fallback a main thread', e);
        const Fallback = (mod as any).PiperWebEngine ?? mod.default?.PiperWebEngine ?? mod.default;
        if (!Fallback) throw new Error('PiperWebEngine not found');
        const OnnxRuntime = (mod as any).OnnxWebRuntime;
        engine = new Fallback(
          OnnxRuntime ? { onnxRuntime: new OnnxRuntime({ basePath: '/onnx/', numThreads: 1 }) } : undefined
        );
      }
    } else {
      const Fallback = (mod as any).PiperWebEngine ?? mod.default?.PiperWebEngine ?? mod.default;
      if (!Fallback) throw new Error('PiperWebEngine not found');
      engine = new Fallback();
    }

    piperEngine = engine;
    return engine;
  })().catch((e) => {
    loadingPromise = null;
    throw e;
  });

  // Safety timeout
  setTimeout(() => {
    if (isLoading) {
      console.warn('Piper loading colgado >120s');
      setLoading(false);
    }
  }, 125000);

  return loadingPromise;
}

export async function speakWithPiper(
  text: string,
  opts: {
    voice?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (e: any) => void;
    signal?: AbortSignal;
  } = {}
): Promise<HTMLAudioElement | null> {
  try {
    const engine = await getPiperEngine();
    if (opts.signal?.aborted) return null;

    const voice = opts.voice ?? SPANISH_VOICE;

    // No onStart antes de generate — toast debe quedarse hasta que suene (playStarted)
    // piper-tts-web: engine.generate(text, voice, speaker=0) → { file: Blob, duration, phonemeData }
    const result: any = await engine.generate(text, voice, 0);

    if (opts.signal?.aborted) return null;

    // Marcar voz como cargada tras primer generate exitoso
    voiceLoaded = true;

    let blob: Blob | null = null;
    if (result?.file instanceof Blob) {
      blob = result.file as Blob;
    } else if (result?.audio?.data) {
      // fallback PCM
      const pcm = result.audio.data as Float32Array;
      const sr = result.audio.sampleRate ?? 22050;
      blob = encodeWav(pcm, sr);
    } else if (result?.data) {
      const pcm = result.data as Float32Array;
      blob = encodeWav(pcm, result.sampleRate ?? 22050);
    }

    if (!blob) throw new Error('Formato de audio Piper no reconocido');

    const url = URL.createObjectURL(blob);
    // onStart se dispara cuando el audio realmente empieza (playStarted), no antes
    return playAudioElement(url, opts);
  } catch (e: any) {
    // Cancelación durante generate no debe reportarse como error
    if (opts.signal?.aborted) return null;
    opts.onError?.(e);
    return null;
  }
}

function playAudioElement(
  url: string,
  opts: { onStart?: () => void; onEnd?: () => void; onError?: (e: any) => void; signal?: AbortSignal }
): Promise<HTMLAudioElement> {
  const el = new Audio(url);
  el.preload = 'auto';
  el.style.display = 'none';
  try { document.body.appendChild(el); } catch {}

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try { URL.revokeObjectURL(url); } catch {}
    try { el.remove(); } catch {}
  };

  let playStarted = false;
  let abortHandler: any = null;
  if (opts.signal) {
    abortHandler = () => {
      if (playStarted && !el.paused) {
        try { el.pause(); } catch {}
      }
      try { el.currentTime = 0; } catch {}
      cleanup();
    };
    if (opts.signal.aborted) {
      abortHandler();
      return Promise.resolve(el);
    }
    opts.signal.addEventListener('abort', abortHandler, { once: true });
  }

  return new Promise<HTMLAudioElement>((resolve, reject) => {
    el.onended = () => {
      cleanup();
      if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
      opts.onEnd?.();
      resolve(el);
    };
    el.onerror = (e) => {
      // No reportar error si fue cancelación intencional
      if (opts.signal?.aborted) {
        cleanup();
        if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
        resolve(el);
        return;
      }
      cleanup();
      if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
      opts.onError?.(e);
      reject(e);
    };
    // Pre-cargar antes de play para evitar ERR_FILE_NOT_FOUND si revoke es temprano
    el.load();
    el.play()
      .then(() => {
        playStarted = true;
        // onStart real: cuando el audio efectivamente empieza
        opts.onStart?.();
      })
      .catch((playErr: any) => {
        if (opts.signal?.aborted) {
          cleanup();
          if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
          resolve(el);
          return;
        }
        if (
          playErr?.name === 'AbortError' ||
          String(playErr).includes('interrupted') ||
          String(playErr).includes('removed') ||
          String(playErr).includes('pause') ||
          String(playErr).includes('NotSupportedError')
        ) {
          // NotSupportedError tras abort también es cancel silencioso
          if (opts.signal?.aborted) {
            cleanup();
            if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
            resolve(el);
            return;
          }
          cleanup();
          if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
          opts.onError?.(playErr);
          reject(playErr);
          return;
        }
        cleanup();
        if (opts.signal && abortHandler) opts.signal.removeEventListener('abort', abortHandler);
        opts.onError?.(playErr);
        reject(playErr);
      });
  });
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

export function isPiperAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function isPiperEngineReady(): boolean {
  return !!piperEngine;
}

let voiceLoaded = false;
export function isPiperVoiceReady(): boolean {
  return voiceLoaded;
}
export function markVoiceLoaded() {
  voiceLoaded = true;
}

export function preloadPiper() {
  getPiperEngine().catch(() => {});
}
