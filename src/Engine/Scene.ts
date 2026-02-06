// ./utils/Scene.ts
import { RendererClass } from "./Renderer.ts";

export class SceneClass {
  private renderer: RendererClass;
  private buffer: any[] = [];

  constructor(renderer: RendererClass) {
    this.renderer = renderer;
  }

  private removeItem(item: any) {
    const index = this.buffer.indexOf(item);
    if (index > -1) {
      this.buffer.splice(index, 1);
    }
  }

  createRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    zIndex: number = 0, // Added zIndex parameter
  ) {
    const rect = {
      type: "rect",
      x,
      y,
      width,
      height,
      color,
      zIndex, // Store zIndex
      destroy: () => this.removeItem(rect),
    };

    this.buffer.push(rect);
    return rect;
  }

  createLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number = 1,
    zIndex: number = 0, // Added zIndex parameter
  ) {
    const line = {
      type: "line" as const,
      x1,
      y1,
      x2,
      y2,
      color,
      lineWidth,
      zIndex, // Store zIndex
      destroy: () => this.removeItem(line),
    };

    this.buffer.push(line);
    return line;
  }

  getBuffer() {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
  }

  start() {
    this.renderer.startLoop(() => this.getBuffer());
  }

  stop() {
    this.renderer.stopLoop();
  }
}