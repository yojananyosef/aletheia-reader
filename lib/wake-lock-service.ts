class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  private isSupported = false;
  private onReleaseCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      this.isSupported = true;
      this.setupVisibilityRecovery();
    }
  }

  /**
   * Re-adquire wake lock when returning to the tab (Chrome releases it when tab is hidden)
   */
  private setupVisibilityRecovery() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.isHoldingLock === false && this.wantsLock) {
        await this.request();
      }
    });
  }

  // Track if we intentionally want the lock active
  private wantsLock = false;
  private isHoldingLock = false;

  /**
   * Request Screen Wake Lock to keep screen on during TTS playback
   */
  async request(): Promise<void> {
    if (!this.isSupported) return;
    this.wantsLock = true;

    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.isHoldingLock = true;

      this.sentinel.addEventListener('release', () => {
        this.isHoldingLock = false;
        this.sentinel = null;
        this.onReleaseCallback?.();
      });
    } catch {
      // Silent fallback - wake lock not available (e.g. permission denied, PWA limitation)
      this.isHoldingLock = false;
    }
  }

  /**
   * Release the wake lock explicitly
   */
  async release(): Promise<void> {
    this.wantsLock = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Already released or error
      }
      this.sentinel = null;
      this.isHoldingLock = false;
    }
  }

  /**
   * Check if wake lock is currently active
   */
  get active(): boolean {
    return this.isHoldingLock;
  }

  /**
   * Register callback for when wake lock is released unexpectedly
   */
  onRelease(callback: () => void) {
    this.onReleaseCallback = callback;
  }
}

export const wakeLockService = new WakeLockService();
