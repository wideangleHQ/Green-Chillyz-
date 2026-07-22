"use client";

export type ImageSource = ImageBitmap | HTMLImageElement;

class ImageLoader {
  private images: (ImageSource | null)[] = [];
  private totalFrames = 566;
  private step = 1;
  private indicesToLoad: number[] = [];
  private priorityIndices: number[] = [];

  private loadedCount = 0;
  private totalToLoad = 0;
  private priorityLoadedCount = 0;
  private priorityTotal = 0;

  private isPriorityDone = false;
  private isAllDone = false;
  private isStarted = false;

  private progressListeners = new Set<(progress: number, loadedCount: number, totalToLoad: number, isPriorityDone: boolean) => void>();
  private activeConnections = 0;
  private concurrencyLimit = 25;
  private loadQueue: number[] = [];

  constructor() {
    // Initialized in start()
  }

  public subscribe(listener: (progress: number, loadedCount: number, totalToLoad: number, isPriorityDone: boolean) => void) {
    this.progressListeners.add(listener);
    const progress = this.priorityTotal > 0 ? Math.round((this.priorityLoadedCount / this.priorityTotal) * 100) : 0;
    listener(progress, this.priorityLoadedCount, this.priorityTotal, this.isPriorityDone);
    return () => this.progressListeners.delete(listener);
  }

  public start() {
    if (typeof window === "undefined") return;
    if (this.indicesToLoad.length === 0) {
      const width = window.innerWidth;
      if (width < 768) {
        this.step = 3;
        this.concurrencyLimit = 6;
      } else if (width < 1024) {
        this.step = 2;
        this.concurrencyLimit = 8;
      } else {
        this.step = 1;
        this.concurrencyLimit = 16;
      }

      const tempIndices: number[] = [];
      for (let i = 1; i <= this.totalFrames; i += this.step) {
        tempIndices.push(i);
      }
      if (tempIndices[tempIndices.length - 1] !== this.totalFrames) {
        tempIndices.push(this.totalFrames);
      }

      this.indicesToLoad = tempIndices;
      this.totalToLoad = this.indicesToLoad.length;
      this.images = new Array(this.totalFrames + 1).fill(null);

      this.priorityIndices = this.indicesToLoad.filter(idx => idx <= 75);
      this.priorityTotal = this.priorityIndices.length;

      const remainingIndices = this.indicesToLoad.filter(idx => idx > 75);

      this.loadQueue = [...this.priorityIndices, ...remainingIndices];
      this.isStarted = true;
    }

    if (this.isPriorityDone) {
      this.progressListeners.forEach(l => l(100, this.priorityLoadedCount, this.priorityTotal, true));
    }

    this.processQueue();
  }

  private processQueue() {
    while (this.activeConnections < this.concurrencyLimit && this.loadQueue.length > 0) {
      const idx = this.loadQueue.shift()!;
      this.activeConnections++;
      this.loadFrame(idx);
    }
  }

  private async loadFrame(frameIndex: number) {
    const frameNum = String(frameIndex).padStart(5, "0");
    const url = `/assets/chilli-animation/${frameNum}.jpg`;

    let source: ImageSource | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();

      if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
        try {
          source = await createImageBitmap(blob);
        } catch {
          source = await this.loadFromBlob(blob);
        }
      } else {
        source = await this.loadFromBlob(blob);
      }
    } catch {
      try {
        source = await this.loadAsImageElement(url);
      } catch {
        // Frame failed — continue with remaining frames
      }
    }

    if (!this.isStarted) return;

    this.images[frameIndex] = source;
    this.activeConnections--;

    this.loadedCount++;
    if (frameIndex <= 75) {
      this.priorityLoadedCount++;
    }

    if (!this.isPriorityDone && this.priorityLoadedCount === this.priorityTotal) {
      this.isPriorityDone = true;
    }

    if (this.loadedCount === this.totalToLoad) {
      this.isAllDone = true;
    }

    const progress = this.isPriorityDone
      ? 100
      : Math.round((this.priorityLoadedCount / this.priorityTotal) * 100);

    this.progressListeners.forEach(l => l(progress, this.priorityLoadedCount, this.priorityTotal, this.isPriorityDone));

    this.processQueue();
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

  private loadAsImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        reject(new Error(`Timeout: ${url}`));
      }, 8000);

      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = (e) => {
        clearTimeout(timer);
        reject(e);
      };
      img.src = url;
    });
  }

  public getFrame(frameIndex: number): ImageSource | null {
    if (frameIndex < 1 || frameIndex > this.totalFrames) return null;

    if (this.images[frameIndex]) {
      return this.images[frameIndex];
    }

    let nearestIndex = -1;
    let minDiff = Infinity;

    for (let i = 1; i <= this.totalFrames; i++) {
      if (this.images[i]) {
        const diff = Math.abs(i - frameIndex);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      return this.images[nearestIndex];
    }

    return null;
  }

  public clear() {
    this.isStarted = false;
    this.images.forEach((img) => {
      if (img && typeof (img as any).close === "function") {
        (img as any).close();
      }
    });
    this.images = [];
    this.indicesToLoad = [];
    this.priorityIndices = [];
    this.loadQueue = [];
    this.loadedCount = 0;
    this.priorityLoadedCount = 0;
    this.priorityTotal = 0;
    this.isPriorityDone = false;
    this.isAllDone = false;
    this.activeConnections = 0;
  }
}

export const imageLoader = new ImageLoader();
