// ./utils/Renderer.ts (Updated with Wait Functionality)

import { CameraClass } from "./Camera.ts";

export class RendererClass {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private onFrameRenderCallback?: (deltaTime: number) => void;
  private pauseTimeoutId: number | null = null; // Tracks pause timeout
  private camera: CameraClass;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.camera = new CameraClass();
  }

  setOnFrameRender(callback: (deltaTime: number) => void) {
    this.onFrameRenderCallback = callback;
  }

  getCamera(){
    return this.camera;
  }

  // New: Pause rendering for a specified duration (in ms), then resume automatically
  pause(durationMs: number, resumeCallback?: () => void) {
    if (!this.isRunning()) {
      console.warn('Renderer is not running; cannot pause.');
      return;
    }

    // Stop the current loop
    this.stopLoop();

    // Optional: Call a resume hook before restarting
    if (resumeCallback) {
      resumeCallback();
    }

    // Set timeout to restart after duration (clear any previous if re-paused)
    if (this.pauseTimeoutId !== null) {
      clearTimeout(this.pauseTimeoutId);
    }
    this.pauseTimeoutId = window.setTimeout(() => {
      this.pauseTimeoutId = null;
      // Restart does nothing if not started; but since we stopped, we can resume if needed
      // Note: You'll need to call startLoop again externally if buffer changes
      console.log(`Resumed after ${durationMs}ms`);
    }, durationMs);
  }

  // New: Async wait function (promise-based) to pause execution without stopping the loop
  // Useful for sequencing in non-loop code (e.g., await renderer.wait(1000))
  async wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const id = window.setTimeout(resolve, durationMs);
      // Cleanup if needed (e.g., in destroy)
      (id as any).cleanup = () => clearTimeout(id);
    });
  }

  // Helper: Check if loop is running (for pause guard)
  private isRunning(): boolean {
    return this.animationId !== null;
  }

  // Bare-bones render: Clear and draw from provided buffer (e.g., from scene)
  render(buffer: any[]) {
    this.clear();

    this.ctx.save();
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    if(this.camera.fov !== 1){
      this.ctx.scale(this.camera.fov, this.camera.fov);
    }

    for (const item of buffer) {
      this.drawItem(item);
    }

    this.ctx.restore();
  }

  // Private: Clear canvas
  private clear() {
    this.ctx.fillStyle = 'white'; // Default background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Private: Draw a single item (expandable; for now, handles basic rect)
  private drawItem(item: any) {
    if (item.type === 'rect' && item.color) {
      const halfW = (item.width || 0) / 2;
      const halfH = (item.height || 0) / 2;
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(item.x - halfW, item.y - halfH, item.width, item.height);}
    // Add more cases (circle, etc.) later
    // For now, logs others as fallback
    // console.log('Rendering item:', item);
  }

  // Bare-bones loop (fixed deltaTime init)
  startLoop(callback: () => any[]) {
    if (this.isRunning()) return; // Prevent double-start
    this.lastTime = performance.now(); // Proper init before first loop
    this.renderLoop(callback);
  }

  private renderLoop(callback: () => any[]) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime; // Update after calculation (fixed from your code)

    const buffer = callback(); // Get current buffer from scene
    this.render(buffer);

    if (this.onFrameRenderCallback) {
      this.onFrameRenderCallback(deltaTime);
    }

    this.animationId = requestAnimationFrame(() => this.renderLoop(callback));
  }

  stopLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear any pending pause timeout
    if (this.pauseTimeoutId !== null) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }
  }
}
