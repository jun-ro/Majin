// ./utils/Scene.ts
import { RendererClass } from "./Renderer.ts";

export class SceneClass {
  private renderer: RendererClass;
  private buffer: any[] = []; // Holds scene items (e.g., rects)

  constructor(renderer: RendererClass) {
    this.renderer = renderer;
  }

  // Create and add a rect to the buffer
  createRect(x: number, y: number, width: number, height: number, color: string) {
    const rect = {
      type: 'rect',
      x,
      y,
      width,
      height,
      color
    };
    this.buffer.push(rect);
    return rect;
    // Optionally: Trigger a render here if not in loop
  }

  // Add more create methods later (e.g., createCircle)

  // Get current buffer (for renderer loop)
  getBuffer() {
    return this.buffer;
  }

  // Clear scene buffer
  clear() {
    this.buffer = [];
  }

  // Start the render loop with this scene
  start() {
    this.renderer.startLoop(() => this.getBuffer()); // Passes scene buffer to renderer
  }

  stop() {
    this.renderer.stopLoop();
  }
}
