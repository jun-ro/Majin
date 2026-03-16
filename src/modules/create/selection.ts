import { Engine } from "../../Engine/index.ts";
import { getItemStorage, getCurrentItem } from "./items.ts";

const GRID_SIZE = 10;

let isBoxSelecting = false;
let boxCorner1: { x: number; y: number } | null = null;
let boxCorner2: { x: number; y: number } | null = null;
let selectionBox: any = null;
let moveTimer = 0;
const MOVE_DELAY = 0.15;

export function isSelecting() {
  return isBoxSelecting;
}

export function getSelectionBounds() {
  if (!boxCorner1 || !boxCorner2) return null;
  const minX = Math.min(boxCorner1.x, boxCorner2.x);
  const maxX = Math.max(boxCorner1.x, boxCorner2.x);
  const minY = Math.min(boxCorner1.y, boxCorner2.y);
  const maxY = Math.max(boxCorner1.y, boxCorner2.y);
  return { minX, maxX, minY, maxY };
}

export function getSelectedItems() {
  const items = getItemStorage();
  const bounds = getSelectionBounds();
  if (!bounds) return [];
  
  return items.filter(item => {
    const halfW = (item.width || GRID_SIZE) / 2;
    const halfH = (item.height || GRID_SIZE) / 2;
    const itemLeft = item.x - halfW;
    const itemRight = item.x + halfW;
    const itemTop = item.y - halfH;
    const itemBottom = item.y + halfH;
    
    return itemRight >= bounds.minX && itemLeft <= bounds.maxX &&
           itemBottom >= bounds.minY && itemTop <= bounds.maxY;
  });
}

function updateSelectionBox(engine: Engine) {
  if (selectionBox) {
    selectionBox.destroy();
  }
  
  if (!boxCorner1 || !boxCorner2) return;
  
  const minX = Math.min(boxCorner1.x, boxCorner2.x);
  const maxX = Math.max(boxCorner1.x, boxCorner2.x);
  const minY = Math.min(boxCorner1.y, boxCorner2.y);
  const maxY = Math.max(boxCorner1.y, boxCorner2.y);
  
  const width = Math.max(maxX - minX, GRID_SIZE);
  const height = Math.max(maxY - minY, GRID_SIZE);
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  
  selectionBox = engine.Scene.createRect(centerX, centerY, width, height, "rgba(255, 165, 0, 0.3)", 10, { isExportable: false });
}

export default {
  async onSetup(engine: Engine) {
    engine.InputService.BindShortcut(["KeyB"], (input, gpe) => {
      if (gpe) return;
      if (!isBoxSelecting) {
        const currentItem = getCurrentItem();
        isBoxSelecting = true;
        const startX = currentItem ? currentItem.x : 0;
        const startY = currentItem ? currentItem.y : 0;
        boxCorner1 = { x: startX, y: startY };
        boxCorner2 = { x: startX + GRID_SIZE, y: startY + GRID_SIZE };
        updateSelectionBox(engine);
        console.log("Box select mode - WASD to position, Shift+WASD to expand, Enter to confirm, Esc to cancel");
      } else {
        isBoxSelecting = false;
        boxCorner1 = null;
        boxCorner2 = null;
        if (selectionBox) {
          selectionBox.destroy();
          selectionBox = null;
        }
        console.log("Box select cancelled");
      }
    });

    engine.InputService.BindShortcut(["Enter"], (input, gpe) => {
      if (gpe) return;
      if (!isBoxSelecting) return;
      if (!boxCorner1 || !boxCorner2) return;
      
      const selected = getSelectedItems();
      console.log("Items in box:", selected.length);
      if (selected.length > 0) {
        selected.forEach(item => {
          item.selected = !item.selected;
        });
        console.log(`Toggled selection for ${selected.length} items`);
      }
      
      isBoxSelecting = false;
      boxCorner1 = null;
      boxCorner2 = null;
      if (selectionBox) {
        selectionBox.destroy();
        selectionBox = null;
      }
    });

    engine.InputService.BindAction("InputBegan", (input: any, gpe: boolean) => {
      if (gpe) return;
      if (input.keyCode === "Escape" && isBoxSelecting) {
        isBoxSelecting = false;
        boxCorner1 = null;
        boxCorner2 = null;
        if (selectionBox) {
          selectionBox.destroy();
          selectionBox = null;
        }
        console.log("Box select cancelled");
      }
    });
  },

  onRender(engine: Engine, deltaTime: number) {
    if (!isBoxSelecting || !boxCorner1) return;
    
    const input = engine.InputService;
    const isShiftPressed = input.IsKeyPressed("ShiftLeft") || input.IsKeyPressed("ShiftRight");
    const isPressingMove = 
      input.IsKeyPressed("KeyA") || 
      input.IsKeyPressed("KeyD") || 
      input.IsKeyPressed("KeyW") || 
      input.IsKeyPressed("KeyS");

    if (isPressingMove && boxCorner1 && boxCorner2) {
      moveTimer -= deltaTime;
      if (moveTimer <= 0) {
        if (input.IsKeyPressed("KeyA")) {
          if (isShiftPressed) {
            boxCorner2.x -= GRID_SIZE;
          } else {
            boxCorner2.x -= GRID_SIZE;
            boxCorner1.x -= GRID_SIZE;
          }
        }
        if (input.IsKeyPressed("KeyD")) {
          if (isShiftPressed) {
            boxCorner2.x += GRID_SIZE;
          } else {
            boxCorner2.x += GRID_SIZE;
            boxCorner1.x += GRID_SIZE;
          }
        }
        if (input.IsKeyPressed("KeyW")) {
          if (isShiftPressed) {
            boxCorner2.y -= GRID_SIZE;
          } else {
            boxCorner2.y -= GRID_SIZE;
            boxCorner1.y -= GRID_SIZE;
          }
        }
        if (input.IsKeyPressed("KeyS")) {
          if (isShiftPressed) {
            boxCorner2.y += GRID_SIZE;
          } else {
            boxCorner2.y += GRID_SIZE;
            boxCorner1.y += GRID_SIZE;
          }
        }
        moveTimer = MOVE_DELAY;
        updateSelectionBox(engine);
      }
    } else {
      moveTimer = 0;
    }
  }
};
