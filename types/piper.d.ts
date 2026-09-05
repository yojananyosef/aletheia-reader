declare module 'piper-tts-web' {
  /** Result of engine.generate() as consumed by lib/piper-service.ts */
  export interface PiperGenerateResult {
    file?: Blob;
    audio?: { data: Float32Array; sampleRate?: number };
    data?: Float32Array;
    sampleRate?: number;
  }

  /** Minimal engine surface used by the reader (main-thread or worker engine) */
  export interface PiperEngineLike {
    generate(text: string, voice: string, speaker?: number): Promise<PiperGenerateResult>;
  }

  export interface PiperRuntimeOptions {
    basePath?: string;
    numThreads?: number;
    worker?: Worker;
  }

  export interface PiperEngineOptions {
    onnxRuntime?: OnnxWebRuntime | OnnxWebWorkerRuntime;
    phonemizeRuntime?: PhonemizeWebRuntime | PhonemizeWebWorkerRuntime;
    expressionRuntime?: unknown;
    voiceProvider?: unknown;
  }

  export class OnnxWebRuntime {
    constructor(opts?: PiperRuntimeOptions);
  }
  export class OnnxWebWorkerRuntime {
    constructor(opts?: PiperRuntimeOptions);
  }
  export class PhonemizeWebRuntime {
    constructor(opts?: PiperRuntimeOptions);
  }
  export class PhonemizeWebWorkerRuntime {
    constructor(opts?: PiperRuntimeOptions);
  }
  export class PiperWebEngine implements PiperEngineLike {
    constructor(opts?: PiperEngineOptions);
    generate(text: string, voice: string, speaker?: number): Promise<PiperGenerateResult>;
  }
  export class PiperWebWorkerEngine extends PiperWebEngine {}
}
declare module 'copy-webpack-plugin';
