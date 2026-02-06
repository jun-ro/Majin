import { Engine, type InputObject } from "../Engine/index.ts";

const gridSize = 10;
const moveDelay = 0.1;

let itemStorage: any[] = [];
let pathItems: any[] = []; 
let dynamicLines: { line: any; startItem: any; endItem: any }[] = []; 

let currentHighlight: any = null;
var currentItem: number = 0;
let state = "DEFAULT";
let moveTimer = 0;

function createHighlight(engine: Engine) {
  if (currentHighlight !== null) currentHighlight.destroy();
  currentHighlight = engine.Scene.createRect(0, 0, gridSize + 5, gridSize + 5, "orange", 1);
}

export default {
  async onSetup(engine: Engine) {
    
    // --- CREATE ITEM (Shift + A) ---
    engine.InputService.BindShortcut(["ShiftLeft", "KeyA"], (input, gpe) => {
      if (gpe) return;
      createHighlight(engine);
      const item = engine.Scene.createRect(0, 0, gridSize, gridSize, "black", 2);
      itemStorage.push(item);
      currentItem = itemStorage.length - 1;
      state = "DEFAULT"; 
    });

    // --- ENTER PATH MODE (Shift + E) ---
    engine.InputService.BindShortcut(["ShiftLeft", "KeyE"], () => {
      state = "PATH";
      console.log("MODE: PATH. Press Enter to mark points.");
    });

    // --- ENTER SELECTION MODE (Shift + Q) ---
    engine.InputService.BindShortcut(["ShiftLeft", "KeyQ"], () => {
      state = "SELECT";
      console.log("MODE: SELECT. A/D to cycle. Enter or Esc to confirm.");
    });

    engine.InputService.BindAction("InputBegan", (input: InputObject, gpe: boolean) => {
      if (gpe || itemStorage.length === 0) return;

      // --- ESCAPE KEY LOGIC ---
      if (input.keyCode === "Escape") {
        if (state === "PATH") {
          pathItems = []; 
          console.log("Path cleared.");
        }
        state = "DEFAULT";
        return;
      }

      // --- SELECTION MODE LOGIC ---
      if (state === "SELECT") {
        if (input.keyCode === "KeyA") {
          currentItem = (currentItem - 1 + itemStorage.length) % itemStorage.length;
          createHighlight(engine);
        }
        if (input.keyCode === "KeyD") {
          currentItem = (currentItem + 1) % itemStorage.length;
          createHighlight(engine);
        }
        // New: Enter also takes user out of select mode
        if (input.keyCode === "Enter") {
          state = "DEFAULT";
          console.log("Selection confirmed. Returned to DEFAULT.");
        }
        return;
      }

      // --- PATH MODE LOGIC ---
      if (state === "PATH") {
        if (input.keyCode === "Enter") {
          pathItems.push(itemStorage[currentItem]);
          console.log(`Point added. Total: ${pathItems.length}`);
        }

        if (input.keyCode === "KeyF") {
          if (pathItems.length >= 2) {
            for (let i = 0; i < pathItems.length - 1; i++) {
              const start = pathItems[i];
              const end = pathItems[i + 1];
              const line = engine.Scene.createLine(start.x, start.y, end.x, end.y, "black", 2, 0);
              dynamicLines.push({ line, startItem: start, endItem: end });
            }
          }
          pathItems = [];
          state = "DEFAULT";
        }
      }
    });
  },

  onRender(engine: Engine, deltaTime: number) {
    if (itemStorage.length === 0) return;
    const activeItem = itemStorage[currentItem];

    // Movement is allowed in DEFAULT and PATH
    if ((state === "DEFAULT" || state === "PATH") && activeItem) {
      const input = engine.InputService;
      const isPressingMove = 
        input.IsKeyPressed("KeyA") || input.IsKeyPressed("KeyD") || 
        input.IsKeyPressed("KeyW") || input.IsKeyPressed("KeyS");

      if (isPressingMove) {
        moveTimer -= deltaTime;
        if (moveTimer <= 0) {
          if (input.IsKeyPressed("KeyA")) activeItem.x -= gridSize;
          else if (input.IsKeyPressed("KeyD")) activeItem.x += gridSize;
          else if (input.IsKeyPressed("KeyW")) activeItem.y -= gridSize;
          else if (input.IsKeyPressed("KeyS")) activeItem.y += gridSize;
          moveTimer = moveDelay;
        }
      } else {
        moveTimer = 0;
      }
    }

    if (currentHighlight && activeItem) {
      currentHighlight.x = activeItem.x;
      currentHighlight.y = activeItem.y;
    }

    for (const connection of dynamicLines) {
      connection.line.x1 = connection.startItem.x;
      connection.line.y1 = connection.startItem.y;
      connection.line.x2 = connection.endItem.x;
      connection.line.y2 = connection.endItem.y;
    }
  },
};