import items from "./items.ts";
import path from "./path.ts";
import movement from "./movement.ts";
import exportModule from "./export.ts";
import selection from "./selection.ts";

export default {
  async onSetup(engine: any) {
    items.onSetup(engine);
    path.onSetup(engine);
    movement.onSetup(engine);
    exportModule.onSetup(engine);
    selection.onSetup(engine);
  },

  onRender(engine: any, deltaTime: number) {
    items.onRender(engine, deltaTime);
    path.onRender(engine, deltaTime);
    movement.onRender(engine, deltaTime);
    exportModule.onRender(engine, deltaTime);
    selection.onRender(engine, deltaTime);
  }
};
