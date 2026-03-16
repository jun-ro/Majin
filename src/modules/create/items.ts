import { Engine, type InputObject } from "../../Engine/index.ts";

const GRID_SIZE = 10;

let itemStorage: any[] = [];
let currentHighlight: any = null;
let currentItemIndex = 0;

export function getItemStorage() {
  return itemStorage;
}

export function getCurrentItem() {
  if (itemStorage.length === 0) return null;
  return itemStorage[currentItemIndex];
}

export function getCurrentItemIndex() {
  return currentItemIndex;
}

export function getCurrentHighlight() {
  return currentHighlight;
}

function createHighlight(engine: Engine) {
  if (currentHighlight !== null) currentHighlight.destroy();
  currentHighlight = engine.Scene.createRect(0, 0, GRID_SIZE + 5, GRID_SIZE + 5, "orange", 1, { isExportable: false });
}

export function cycleItem(dir: number, engine: Engine) {
  if (itemStorage.length === 0) return;
  currentItemIndex = (currentItemIndex + dir + itemStorage.length) % itemStorage.length;
  createHighlight(engine);
}

export function setCurrentItemIndex(index: number) {
  currentItemIndex = index;
}

export default {
  async onSetup(engine: Engine) {
    engine.InputService.BindShortcut(["KeyC"], (input, gpe) => {
      if (gpe) return;
      createHighlight(engine);
      let x = 0, y = 0;
      if (itemStorage.length > 0) {
        const activeItem = itemStorage[currentItemIndex];
        x = activeItem.x;
        y = activeItem.y;
      }
      const item = engine.Scene.createRect(x, y, GRID_SIZE, GRID_SIZE, "black", 2);
      itemStorage.push(item);
      currentItemIndex = itemStorage.length - 1;
    });

    engine.InputService.BindShortcut(["KeyX"], (input, gpe) => {
      if (gpe || itemStorage.length === 0) return;
      
      const selectedItems = itemStorage.filter((item: any) => item.selected);
      if (selectedItems.length > 0) {
        selectedItems.forEach((item: any) => {
          item.destroy();
          const idx = itemStorage.indexOf(item);
          if (idx > -1) itemStorage.splice(idx, 1);
        });
        console.log(`Deleted ${selectedItems.length} selected items`);
      } else {
        const item = itemStorage[currentItemIndex];
        item.destroy();
        itemStorage.splice(currentItemIndex, 1);
      }
      
      if (itemStorage.length === 0) {
        currentItemIndex = 0;
        if (currentHighlight) {
          currentHighlight.destroy();
          currentHighlight = null;
        }
      } else {
        currentItemIndex = currentItemIndex % itemStorage.length;
        createHighlight(engine);
      }
    });

    engine.InputService.BindShortcut(["KeyQ"], (input, gpe) => {
      if (gpe) return;
      cycleItem(-1, engine);
    });

    engine.InputService.BindShortcut(["KeyE"], (input, gpe) => {
      if (gpe) return;
      cycleItem(1, engine);
    });

    engine.InputService.BindAction("InputBegan", (input: any, gpe: boolean) => {
      if (gpe) return;
      if (input.keyCode === "Escape") {
        const selectedItems = itemStorage.filter((item: any) => item.selected);
        if (selectedItems.length > 0) {
          selectedItems.forEach((item: any) => item.selected = false);
          console.log("Deselected all items");
        }
      }
    });
  },

  onRender(engine: Engine, deltaTime: number) {
    if (itemStorage.length === 0) return;
    const activeItem = itemStorage[currentItemIndex];

    if (currentHighlight && activeItem) {
      currentHighlight.x = activeItem.x;
      currentHighlight.y = activeItem.y;
    }

    for (const item of itemStorage) {
      if (item.selected) {
        item.color = "#0066ff";
      } else {
        item.color = "black";
      }
    }
  }
};
