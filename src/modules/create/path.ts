import { Engine } from "../../Engine/index.ts";
import { getItemStorage, getCurrentItemIndex } from "./items.ts";
import { isSelecting } from "./selection.ts";

let pathItems: any[] = [];
let dynamicLines: { line: any; startItem: any; endItem: any }[] = [];

export function getPathItems() {
  return pathItems;
}

export function getDynamicLines() {
  return dynamicLines;
}

export default {
  async onSetup(engine: Engine) {
    engine.InputService.BindShortcut(["Space"], (input, gpe) => {
      if (gpe) return;
      if (isSelecting()) return;
      
      const items = getItemStorage();
      const selectedItems = items.filter((item: any) => item.selected);
      
      if (selectedItems.length > 0) {
        selectedItems.forEach((item: any) => {
          if (!pathItems.includes(item)) {
            pathItems.push(item);
          }
        });
        console.log(`Added ${selectedItems.length} selected items to path. Total: ${pathItems.length}`);
      } else {
        const currentIdx = getCurrentItemIndex();
        if (items.length === 0) return;
        
        const item = items[currentIdx];
        if (!pathItems.includes(item)) {
          pathItems.push(item);
          console.log(`Added to path. Total: ${pathItems.length}`);
        } else {
          pathItems = pathItems.filter(i => i !== item);
          console.log(`Removed from path. Total: ${pathItems.length}`);
        }
      }
    });

    engine.InputService.BindShortcut(["KeyF"], (input, gpe) => {
      if (gpe) return;
      if (pathItems.length >= 2) {
        for (let i = 0; i < pathItems.length - 1; i++) {
          const start = pathItems[i];
          const end = pathItems[i + 1];
          const line = engine.Scene.createLine(start.x, start.y, end.x, end.y, "black", 2, 0);
          dynamicLines.push({ line, startItem: start, endItem: end });
        }
        console.log(`Drew ${pathItems.length - 1} lines.`);
      }
      pathItems = [];
    });

    engine.InputService.BindAction("InputBegan", (input: any, gpe: boolean) => {
      if (gpe) return;
      if (input.keyCode === "Escape") {
        if (pathItems.length > 0) {
          pathItems = [];
          console.log("Path cleared.");
        }
      }
    });
  },

  onRender(engine: Engine, deltaTime: number) {
    for (const connection of dynamicLines) {
      connection.line.x1 = connection.startItem.x;
      connection.line.y1 = connection.startItem.y;
      connection.line.x2 = connection.endItem.x;
      connection.line.y2 = connection.endItem.y;
    }
  }
};
