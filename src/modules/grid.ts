import { Engine } from "../Engine/index.ts";

export default {
  async onSetup(engine: Engine) {
    const halfWidth = 400;
    const halfHeight = 300;
    const gridSize = 10;
    const gridColor = "#ddd";

    for (let y = -halfHeight; y <= halfHeight; y += gridSize) {
      engine.Scene.createLine(-halfWidth, y, halfWidth, y, gridColor, 1, 0, { isGrid: true });
    }

    for (let x = -halfWidth; x <= halfWidth; x += gridSize) {
      engine.Scene.createLine(x, -halfHeight, x, halfHeight, gridColor, 1, 0, { isGrid: true });
    }
  },

  onRender(_engine: Engine, _deltaTime: number) {
  }
}