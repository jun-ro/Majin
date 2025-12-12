import { Engine } from "./Engine/index.ts";

const canvas: HTMLCanvasElement | null = document.querySelector('#app') as HTMLCanvasElement | null;
if (!canvas) {
  console.error('Canvas #app not found');
  throw new Error('Canvas element is required');
}

const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
if (!ctx) {
  console.error('2D context not available');
  throw new Error('Canvas 2D context is required');
}

Engine.mountApp(canvas)

const Game = Engine.Create();
Game.Scene.createRect(canvas.width/2, canvas.height/2, 200, 200, "green")
