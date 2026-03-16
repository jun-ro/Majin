import { Engine } from "../../Engine/index.ts";

export default {
  onSetup(engine: Engine) {
    engine.InputService.BindShortcut(["ControlLeft", "KeyE"], (input, gpe) => {
      if (gpe) return;
      engine.exportCanvas(true);
      console.log("Exported canvas without grid lines");
    });
  },

  onRender(_engine: Engine, _deltaTime: number) {
  }
};
