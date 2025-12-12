// Your main file (updated to work)
import { CameraClass } from "./utils/Camera.ts";
import { InputService } from "./utils/Input.ts";
import { RendererClass } from "./utils/Renderer.ts";
import { SceneClass } from "./utils/Scene.ts";

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

// Set fixed internal size to match CSS (prevents any distortion)
const FIXED_WIDTH = 800;
const FIXED_HEIGHT = 600;

canvas.width = FIXED_WIDTH;
canvas.height = FIXED_HEIGHT;

const renderer = new RendererClass(canvas);
const scene = new SceneClass(renderer);
const Camera = renderer.getCamera();
const inputService = InputService.GetInstance();
inputService.Start();

var block = scene.createRect(10,10, 200, 200, "green");



// Start the loop to see the rect
scene.start();
