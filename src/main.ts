import { Engine, InputState, type InputObject } from "./Engine/index.ts";
import gridModule from "./modules/grid.ts";
import createModule from "./modules/create/index.ts";

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
const InputService = Game.InputService
Game.setModules([gridModule, createModule])