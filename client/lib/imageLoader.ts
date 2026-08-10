"use client";

export type ImageSource = ImageBitmap | HTMLImageElement;

export type CachedFrame = {
  index: number;
  bitmap: ImageSource;
};

// Global registries to prevent duplication across React renders/Strict Mode
const frameRegistry: Record<number, ImageSource> = {};
const loadingFrames: Record<number, Promise<ImageSource | null>> = {};
const failedFrames: Set<number> = new Set();

const TOTAL_FRAMES = 566;

export class HeroFrameController {
  private isDestroyed = false;
  private preloadAbortController: AbortController | null = null;
  private currentFrame = 1;

  constructor() {}

  /**
   * CRITICAL PATH: Load Frame 1 FIRST
   */
  public async loadCriticalFrame(): Promise<ImageSource | null> {
    if (this.isDestroyed) return null;
    return this.loadFrame(1, true);
  }

  /**
   * BACKGROUND PATH: Load remaining frames 2 through 566
   */
  public startBackgroundPreload() {
    if (this.isDestroyed || this.preloadAbortController) return;

    this.preloadAbortController = new AbortController();
    const signal = this.preloadAbortController.signal;

    const maxConcurrency = typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 4;
    this.runBackgroundPreload(maxConcurrency, signal).catch(() => {});
  }

  private async runBackgroundPreload(concurrency: number, signal: AbortSignal) {
    let currentPreloadIndex = 2; // Start from frame 2

    const workers = Array(concurrency).fill(0).map(async () => {
      while (!signal.aborted && currentPreloadIndex <= TOTAL_FRAMES) {
        const frameIndex = currentPreloadIndex++;

        if (frameRegistry[frameIndex] || failedFrames.has(frameIndex)) {
          continue;
        }

        try {
          await this.loadFrame(frameIndex, false);
        } catch (e) {
          // Failure is recorded, worker continues
        }
      }
    });

    await Promise.all(workers);
  }

  private async loadFrame(frameIndex: number, isCritical: boolean): Promise<ImageSource | null> {
    if (frameRegistry[frameIndex]) return frameRegistry[frameIndex];
    if (failedFrames.has(frameIndex)) return null;
    if (loadingFrames[frameIndex]) return loadingFrames[frameIndex];

    const loadPromise = (async () => {
      try {
        const frameNum = String(frameIndex).padStart(5, "0");
        const url = `/assets/chilli-animation/${frameNum}.jpg`;

        const response = await fetch(url, {
          priority: isCritical ? "high" : "low",
        } as RequestInit);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (this.isDestroyed) return null; // Abort processing if destroyed

        let source: ImageSource | null = null;
        if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
          try {
            source = await createImageBitmap(blob);
          } catch {
            source = await this.loadFromBlob(blob);
          }
        } else {
          source = await this.loadFromBlob(blob);
        }

        frameRegistry[frameIndex] = source;
        return source;
      } catch (e) {
        failedFrames.add(frameIndex);
        return null;
      } finally {
        delete loadingFrames[frameIndex];
      }
    })();

    loadingFrames[frameIndex] = loadPromise;
    return loadPromise;
  }

  private loadFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      };
      img.src = blobUrl;
    });
  }

  public seek(frame: number) {
    if (this.isDestroyed || frame === this.currentFrame) return;
    this.currentFrame = frame;
  }

  public getFrame(frameIndex: number): ImageSource | null {
    if (this.isDestroyed) return null;
    return frameRegistry[frameIndex] || null;
  }

  public destroy() {
    this.isDestroyed = true;
    
    if (this.preloadAbortController) {
      this.preloadAbortController.abort();
      this.preloadAbortController = null;
    }
  }
}
