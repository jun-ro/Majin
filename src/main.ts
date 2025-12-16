import { Engine, InputState, type InputObject } from "./Engine/index.ts";

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

// Define an interface for your selectable objects if they are not all identical to Rect
interface SelectableObject {
  x: number;
  y: number;
  // Add other properties if needed for your specific objects
}

const selectSquare = Game.Scene.createRect(40,40, 12.5, 12.5, "red");
const squareOne = Game.Scene.createRect(40,40, 10,10, "black");
const squareTwo = Game.Scene.createRect(40,40, 10,10, "black");
const line = Game.Scene.createLine(squareOne.x, squareOne.y, squareTwo.x, squareTwo.y, 'blue', 1);

// Create an array of selectable points and an index
const selectablePoints: SelectableObject[] = [squareOne, squareTwo];
let currentPointIndex = 0;
let currentPoint: SelectableObject = selectablePoints[currentPointIndex]; // Initialize currentPoint
let currentMode: string = "Default"

// Function to handle the shortcut
const handleCycleSquare = (input: InputObject, _gameProcessedEvent: boolean) => {
  // We only want to cycle when the shortcut combination is *first* activated
  if (input.state === InputState.Begin && currentMode == "Default") {
    currentMode = "PointSelect";
  }
};

// Bind the shortcut: Ctrl + W + ArrowRight
InputService.BindShortcut(["ControlLeft", "KeyQ"], handleCycleSquare);
InputService.BindAction("InputBegan", (input: InputObject, gameProcessedEvent: boolean) => {
  if(gameProcessedEvent) return;
  if(input.keyCode == "ArrowRight" && currentMode == "PointSelect"){
    if(currentPointIndex < 1){
      currentPointIndex++
    } else {
      currentPointIndex = 0
    }

    currentPoint = selectablePoints[currentPointIndex]
    currentMode = "Default"
  }
})

Game.Renderer.setOnFrameRender((_deltaTime: number) => {
  // Update the currentPoint's position based on input
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

  // Always update the line to connect the two squares
  line.x1 = squareOne.x;
  line.y1 = squareOne.y;
  line.x2 = squareTwo.x; // Make sure line.x2 and y2 also reflect squareTwo
  line.y2 = squareTwo.y;

  selectSquare.x = currentPoint.x;
  selectSquare.y = currentPoint.y;
})
