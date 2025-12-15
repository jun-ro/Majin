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
const InputService = Game.InputService

const squareOne = Game.Scene.createRect(40,40, 10,10, "black");
const squareTwo = Game.Scene.createRect(40,40, 10,10, "black");
const line = Game.Scene.createLine(squareOne.x, squareOne.y, squareTwo.x, squareTwo.y, 'blue', 1);

const currentPoint = squareOne

Game.Renderer.setOnFrameRender((deltaTime: number) => {
  if(InputService.IsKeyPressed("KeyD")){
    currentPoint.x += 1;
  }


  if(InputService.IsKeyPressed("KeyA")){
    currentPoint.x -= 1;
  }

  if(InputService.IsKeyPressed("KeyW")){
    currentPoint.y -= 1;
  }

  if(InputService.IsKeyPressed("KeyS")){
    currentPoint.y += 1;
  }

  line.x1 = squareOne.x
  line.y1 = squareOne.y
})


