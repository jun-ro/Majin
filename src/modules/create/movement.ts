import { Engine } from "../../Engine/index.ts";
import { getItemStorage, getCurrentItemIndex } from "./items.ts";
import { isSelecting } from "./selection.ts";

const GRID_SIZE = 10;
const MOVE_DELAY = 0.1;

let moveTimer = 0;

export default {
  onSetup(engine: Engine) {
    const noopCallback = () => {};
    const arrowOpts = { preventDefault: true };
    engine.InputService.BindShortcut(["ArrowLeft"], noopCallback, arrowOpts);
    engine.InputService.BindShortcut(["ArrowRight"], noopCallback, arrowOpts);
    engine.InputService.BindShortcut(["ArrowUp"], noopCallback, arrowOpts);
    engine.InputService.BindShortcut(["ArrowDown"], noopCallback, arrowOpts);
  },

  onRender(engine: Engine, deltaTime: number) {
    const items = getItemStorage();
    if (items.length === 0) return;

    const selectedItems = items.filter((item: any) => item.selected);
    const itemsToMove = selectedItems.length > 0 ? selectedItems : [items[getCurrentItemIndex()]];

    if (!itemsToMove[0]) return;

    const input = engine.InputService;
    const isBoxSelectingNow = isSelecting();
    const isPressingMove =
      !isBoxSelectingNow && (
        input.IsKeyPressed("KeyA") || input.IsKeyPressed("ArrowLeft") ||
        input.IsKeyPressed("KeyD") || input.IsKeyPressed("ArrowRight") ||
        input.IsKeyPressed("KeyW") || input.IsKeyPressed("ArrowUp") ||
        input.IsKeyPressed("KeyS") || input.IsKeyPressed("ArrowDown")
      );

    if (isPressingMove) {
      moveTimer -= deltaTime;
      if (moveTimer <= 0) {
        if (input.IsKeyPressed("KeyA") || input.IsKeyPressed("ArrowLeft")) {
          itemsToMove.forEach((item: any) => item.x -= GRID_SIZE);
        } else if (input.IsKeyPressed("KeyD") || input.IsKeyPressed("ArrowRight")) {
          itemsToMove.forEach((item: any) => item.x += GRID_SIZE);
        } else if (input.IsKeyPressed("KeyW") || input.IsKeyPressed("ArrowUp")) {
          itemsToMove.forEach((item: any) => item.y -= GRID_SIZE);
        } else if (input.IsKeyPressed("KeyS") || input.IsKeyPressed("ArrowDown")) {
          itemsToMove.forEach((item: any) => item.y += GRID_SIZE);
        }
        moveTimer = MOVE_DELAY;
      }
    } else {
      moveTimer = 0;
    }
  }
};
